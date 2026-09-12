"""Isolated API/SQL tests: never connect to the configured application database."""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import FastAPI, HTTPException, Request
from fastapi.testclient import TestClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy import create_engine, event, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from database import get_db_session
from models import Base, AnalyticsEvent, Hotel, HotelCallLog, User
from routers import analytics


@compiles(JSONB, "sqlite")
def sqlite_jsonb(type_, compiler, **kw):
    return "JSON"


class AsyncSessionAdapter:
    def __init__(self, session):
        self.session = session

    async def execute(self, statement):
        return self.session.execute(statement)

    async def get(self, model, id):
        return self.session.get(model, id)

    def add(self, value):
        self.session.add(value)

    async def flush(self):
        self.session.flush()

    async def commit(self):
        self.session.commit()


@pytest.fixture
def api(monkeypatch):
    engine = create_engine(
        "sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False}
    )

    @event.listens_for(engine, "connect")
    def configure(connection, record):
        connection.execute("PRAGMA foreign_keys=ON")
        connection.create_function("timezone", 2, lambda zone, value: value)

    Base.metadata.create_all(engine)
    session = Session(engine, expire_on_commit=False)
    adapter = AsyncSessionAdapter(session)
    app = FastAPI()
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    async def current_user(request: Request):
        role = request.headers.get("x-test-role")
        if not role:
            raise HTTPException(401, "Not authenticated")
        return {"role": role}

    async def database():
        yield adapter

    app.dependency_overrides[get_db_session] = database
    app.include_router(analytics.create_router(current_user, limiter), prefix="/api")
    now = datetime(2026, 9, 12, 12, tzinfo=timezone.utc)
    monkeypatch.setattr(
        analytics,
        "period",
        lambda days: (now.replace(hour=0) - timedelta(days=days - 1), now),
    )
    with TestClient(app) as client:
        yield client, session, now
    session.close()
    engine.dispose()


def add_hotel(session, id="h1", city="Arusha", **kwargs):
    hotel = Hotel(id=id, hotel_code=id, name=f"Hotel {id}", city=city, **kwargs)
    session.add(hotel)
    session.flush()
    return hotel


def add_event(session, now, event_type, **kwargs):
    session.add(
        AnalyticsEvent(
            event_type=event_type, created_at=kwargs.pop("created_at", now), **kwargs
        )
    )
    session.flush()


def admin_get(client, endpoint, days=2):
    response = client.get(
        f"/api/analytics/{endpoint}?days={days}", headers={"x-test-role": "admin"}
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_ingestion_persists_full_data_and_defaults(api):
    client, session, now = api
    add_hotel(session)
    body = {
        "event_type": "hotel_search",
        "hotel_id": "h1",
        "city": "Arusha",
        "session_id": "visit-1",
        "budget_min": 0,
        "budget_max": 60000,
        "results_count": 0,
        "metadata": {"filters": {"amenities": ["WiFi"]}},
    }
    response = client.post("/api/analytics/event", json=body)
    assert response.status_code == 201, response.text
    stored = session.get(AnalyticsEvent, response.json()["id"])
    assert stored.event_metadata == body["metadata"]
    assert stored.budget_min == 0 and stored.results_count == 0
    assert stored.session_id == "visit-1" and stored.created_at
    for kind in [
        "hotel_view",
        "whatsapp_click",
        "phone_revealed",
        "zero_results",
        "report_submitted",
    ]:
        response = client.post("/api/analytics/event", json={"event_type": kind})
        assert response.status_code == 201
        assert session.get(AnalyticsEvent, response.json()["id"]).event_metadata == {}


@pytest.mark.parametrize(
    "body",
    [
        {"event_type": "unknown"},
        {},
        {"event_type": "hotel_search", "budget_min": -1},
        {"event_type": "hotel_search", "budget_min": 50000, "budget_max": 20000},
        {"event_type": "hotel_search", "results_count": -1},
        {"event_type": "hotel_search", "results_count": 1.5},
        {"event_type": "hotel_search", "metadata": []},
        {"event_type": "hotel_search", "created_at": "2020-01-01"},
    ],
)
def test_invalid_events(api, body):
    assert api[0].post("/api/analytics/event", json=body).status_code == 422


def test_missing_hotel(api):
    assert (
        api[0]
        .post(
            "/api/analytics/event",
            json={"event_type": "hotel_view", "hotel_id": "missing"},
        )
        .status_code
        == 404
    )


def test_rate_limit(api):
    client = api[0]
    for _ in range(30):
        assert (
            client.post(
                "/api/analytics/event", json={"event_type": "hotel_view"}
            ).status_code
            == 201
        )
    assert (
        client.post(
            "/api/analytics/event", json={"event_type": "hotel_view"}
        ).status_code
        == 429
    )


@pytest.mark.parametrize("endpoint", ["summary", "calls", "hotels"])
def test_admin_access_and_days_validation(api, endpoint):
    client = api[0]
    url = f"/api/analytics/{endpoint}"
    assert client.get(url).status_code == 401
    for role in ["traveler", "owner", "cashier", "backoffice"]:
        assert client.get(url, headers={"x-test-role": role}).status_code == 403
    for days in [0, -1, 366, "invalid"]:
        assert (
            client.get(
                url, params={"days": days}, headers={"x-test-role": "admin"}
            ).status_code
            == 422
        )
    assert client.get(url, headers={"x-test-role": "admin"}).status_code == 200


def test_empty_analytics(api):
    client = api[0]
    summary = admin_get(client, "summary")
    assert summary["total_searches"] == summary["conversion_rate"] == 0
    assert summary["searches_by_day"] == [
        {"date": "2026-09-11", "count": 0},
        {"date": "2026-09-12", "count": 0},
    ]
    assert len(summary["budget_distribution"]) == 4
    calls = admin_get(client, "calls")
    assert calls["total_calls"] == calls["verification_rate"] == 0
    assert calls["calls_by_day"][0]["verified"] == 0
    assert admin_get(client, "hotels") == {
        "most_viewed": [],
        "most_contacted": [],
        "zero_result_cities": [],
    }


def test_summary_and_hotels_counts_boundaries_and_no_double_count(api):
    client, session, now = api
    add_hotel(session)
    for budget in [0, 30000, 60000, 100000]:
        add_event(
            session,
            now,
            "hotel_search",
            city="Arusha",
            budget_min=budget,
            results_count=2,
        )
    add_event(
        session, now, "hotel_search", city="Moshi", budget_max=40000, results_count=0
    )
    add_event(session, now, "zero_results", city="Moshi")
    add_event(
        session,
        now,
        "hotel_search",
        results_count=5,
        created_at=now.replace(hour=0) - timedelta(days=1),
    )
    for time in [now - timedelta(days=2), now + timedelta(seconds=1)]:
        add_event(session, now, "hotel_search", city="Excluded", created_at=time)
    for kind in ["hotel_view", "hotel_view", "whatsapp_click", "phone_revealed"]:
        add_event(session, now, kind, hotel_id="h1")
    data = admin_get(client, "summary")
    assert data["period_days"] == 2 and data["total_searches"] == 6
    assert data["conversion_rate"] == 50.0 and data["zero_results_searches"] == 1
    assert [b["count"] for b in data["budget_distribution"]] == [1, 2, 1, 1]
    assert data["searches_by_day"][0]["count"] == 1
    assert data["top_cities_searched"][0] == {"city": "Arusha", "count": 4}
    assert data["top_hotels_viewed"][0]["views"] == 2
    assert data["top_hotels_whatsapp"][0]["clicks"] == 1
    hotels = admin_get(client, "hotels")
    assert hotels["most_viewed"][0]["phone_reveals"] == 1
    assert hotels["most_viewed"][0]["conversion_rate"] == 50
    assert hotels["most_contacted"][0]["phone_reveals"] == 1
    assert hotels["zero_result_cities"] == [
        {
            "city": "Arusha",
            "search_count": 4,
            "hotels_listed": 0,
            "zero_results_count": 0,
        },
        {
            "city": "Moshi",
            "search_count": 1,
            "hotels_listed": 0,
            "zero_results_count": 1,
        },
    ]


def test_rankings_limit_and_contact_only_hotel(api):
    client, session, now = api
    for i in range(25):
        add_hotel(session, f"h{i}", f"City{i}")
        add_event(session, now, "hotel_view", hotel_id=f"h{i}")
        add_event(session, now, "hotel_search", city=f"City{i}")
    add_hotel(session, "contact")
    add_event(session, now, "whatsapp_click", hotel_id="contact")
    summary = admin_get(client, "summary")
    assert (
        len(summary["top_hotels_viewed"]) == len(summary["top_cities_searched"]) == 10
    )
    assert len(admin_get(client, "hotels")["most_viewed"]) == 25
    assert admin_get(client, "hotels")["most_contacted"][0]["hotel_id"] == "contact"


def test_call_logs_use_called_at_and_town_snapshot(api):
    client, session, now = api
    add_hotel(session, call_status="verified", status="verified")
    add_hotel(session, "h2", call_status="pending", status="imported")
    session.add(
        User(
            id="u1",
            email="caller@example.test",
            full_name="Caller",
            phone="123",
            password_hash="unused",
        )
    )
    session.flush()
    for state, at, user in [
        ("verified", now, "u1"),
        ("unreachable", now, "u1"),
        ("called", now - timedelta(days=1), None),
        ("verified", now - timedelta(days=5), "u1"),
    ]:
        session.add(
            HotelCallLog(
                hotel_id="h1",
                backoffice_user_id=user,
                call_status=state,
                called_at=at,
                created_at=now,
            )
        )
    session.flush()
    data = admin_get(client, "calls")
    assert data["total_calls"] == 3 and data["verified"] == data["unreachable"] == 1
    assert data["verification_rate"] == 33.33
    assert data["calls_by_day"][0] == {"date": "2026-09-11", "total": 1, "verified": 0}
    assert data["top_callers"][0] == {
        "user_id": "u1",
        "name": "Caller",
        "total": 2,
        "verified": 1,
        "rate": 50.0,
        "last_active": "2026-09-12T12:00:00",
    }
    assert data["pipeline_counts"] == {
        "total": 2,
        "pending": 1,
        "called": 0,
        "verified": 1,
        "published": 1,
    }
    assert data["towns_progress"] == [
        {
            "city": "Arusha",
            "pending": 1,
            "called": 0,
            "verified": 1,
            "published": 1,
            "completion_pct": 50.0,
        }
    ]


def test_report_records_server_event_in_same_transaction(api, monkeypatch):
    import asyncio
    import importlib
    from models import HotelReport

    client, session, now = api
    add_hotel(session)
    session.commit()
    monkeypatch.setenv("SECRET_KEY", "isolated-analytics-test-key")
    server = importlib.import_module("server_postgres")
    paths = server.app.openapi()["paths"]
    assert all(
        f"/api/analytics/{name}" in paths
        for name in ["event", "summary", "calls", "hotels"]
    )
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/hotels/h1/report",
            "headers": [],
        }
    )
    result = asyncio.run(
        server.report_hotel.__wrapped__(
            request,
            "h1",
            server.HotelReportCreate(field_reported="price", note="Wrong price"),
            AsyncSessionAdapter(session),
        )
    )
    stored = session.execute(select(AnalyticsEvent)).scalar_one()
    assert stored.event_type == "report_submitted"
    assert stored.hotel_id == "h1" and stored.city == "Arusha"
    assert stored.event_metadata == {
        "report_id": result["id"],
        "field_reported": "price",
    }
    session.rollback()
    assert session.execute(select(AnalyticsEvent)).first() is None
    assert session.execute(select(HotelReport)).first() is None


def test_listed_counts_only_include_public_hotels(api):
    client, session, now = api
    for index, status in enumerate(["verified", "imported", "pending", "suspended"]):
        add_hotel(session, f"listed{index}", "Arusha", status=status)
    add_event(session, now, "zero_results", city="Arusha")
    cities = admin_get(client, "summary")["top_cities_zero_results"]
    assert cities == [{"city": "Arusha", "count": 1, "hotels_listed": 2}]
