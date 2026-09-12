"""Business analytics ingestion and SQL aggregates (UTC calendar days)."""

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_session
from models import (
    AnalyticsEvent as Event,
    AnalyticsEventType,
    Hotel,
    HotelCallLog,
    User,
)


class EventCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    event_type: AnalyticsEventType
    hotel_id: str | None = Field(default=None, min_length=1, max_length=36)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    session_id: str | None = Field(default=None, min_length=1, max_length=255)
    budget_min: int | None = Field(default=None, ge=0, le=2147483647)
    budget_max: int | None = Field(default=None, ge=0, le=2147483647)
    results_count: int | None = Field(default=None, ge=0, le=2147483647)
    metadata: dict[str, Any] | None = None

    @model_validator(mode="after")
    def valid_budget(self):
        if (
            self.budget_min is not None
            and self.budget_max is not None
            and self.budget_min > self.budget_max
        ):
            raise ValueError("budget_min must not exceed budget_max")
        return self


async def record_event(session, event_type, **fields):
    """Use inside an existing transaction for server-side business events."""
    metadata = fields.pop("metadata", None) or {}
    event = Event(event_type=event_type, event_metadata=metadata, **fields)
    session.add(event)
    await session.flush()
    return event


def period(days):
    end = datetime.now(timezone.utc)
    start = end.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(
        days=days - 1
    )
    return start, end


def percentage(numerator, denominator):
    return round(numerator / denominator * 100, 2) if denominator else 0.0


def count_if(condition):
    return func.count().filter(condition)


async def rows(session, query):
    return [dict(row) for row in (await session.execute(query)).mappings().all()]


def daily_series(start, days, data, keys):
    by_date = {str(row["date"]): row for row in data}
    return [
        {"date": date, **{key: by_date.get(date, {}).get(key, 0) for key in keys}}
        for date in (
            (start.date() + timedelta(days=i)).isoformat() for i in range(days)
        )
    ]


def event_window(start, end):
    return and_(Event.created_at >= start, Event.created_at <= end)


def utc_date(column):
    return func.date(func.timezone("UTC", column))


async def city_ranking(session, window, condition, label="count"):
    count = func.count().label(label)
    return await rows(
        session,
        select(Event.city, count)
        .where(window, condition, Event.city.is_not(None), Event.city != "")
        .group_by(Event.city)
        .order_by(count.desc(), Event.city)
        .limit(10),
    )


async def add_listed_counts(session, cities):
    if not cities:
        return cities
    counts = dict(
        (
            await session.execute(
                select(Hotel.city, func.count())
                .where(
                    Hotel.city.in_([row["city"] for row in cities]),
                    Hotel.status.in_(["verified", "imported"]),
                )
                .group_by(Hotel.city)
            )
        ).all()
    )
    return [{**row, "hotels_listed": counts.get(row["city"], 0)} for row in cities]


def hotel_counts(window):
    return (
        select(
            Event.hotel_id,
            count_if(Event.event_type == "hotel_view").label("views"),
            count_if(Event.event_type == "whatsapp_click").label("whatsapp_clicks"),
            count_if(Event.event_type == "phone_revealed").label("phone_reveals"),
        )
        .where(window, Event.hotel_id.is_not(None))
        .group_by(Event.hotel_id)
        .subquery()
    )


def create_router(get_current_user, limiter):
    # Inject shared auth/limiter to avoid importing the application circularly.
    router = APIRouter(prefix="/analytics", tags=["analytics"])

    async def require_admin(user: dict = Depends(get_current_user)):
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return user

    @router.post("/event", status_code=201)
    @limiter.limit("30/minute")
    async def ingest_event(
        request: Request,
        body: EventCreate,
        session: AsyncSession = Depends(get_db_session),
    ):
        if body.hotel_id and await session.get(Hotel, body.hotel_id) is None:
            raise HTTPException(status_code=404, detail="Hotel not found")
        event = await record_event(session, **body.model_dump())
        await session.commit()
        return {
            "id": event.id,
            "event_type": event.event_type,
            "created_at": event.created_at,
        }

    @router.get("/summary", dependencies=[Depends(require_admin)])
    async def summary(
        days: int = Query(30, ge=1, le=365),
        session: AsyncSession = Depends(get_db_session),
    ):
        start, end = period(days)
        window = event_window(start, end)
        counts = dict(
            (
                await session.execute(
                    select(Event.event_type, func.count())
                    .where(window)
                    .group_by(Event.event_type)
                )
            ).all()
        )
        result = {"period_days": days}
        for key, event_type in {
            "total_searches": "hotel_search",
            "total_hotel_views": "hotel_view",
            "total_whatsapp_clicks": "whatsapp_click",
            "total_phone_reveals": "phone_revealed",
            "zero_results_searches": "zero_results",
        }.items():
            result[key] = counts.get(event_type, 0)
        result["conversion_rate"] = percentage(
            result["total_whatsapp_clicks"], result["total_hotel_views"]
        )
        result["top_cities_searched"] = await city_ranking(
            session, window, Event.event_type == "hotel_search"
        )
        result["top_cities_zero_results"] = await city_ranking(
            session, window, Event.event_type == "zero_results"
        )
        result["top_cities_zero_results"] = await add_listed_counts(
            session, result["top_cities_zero_results"]
        )
        stats = hotel_counts(window)
        for key, metric, label in [
            ("top_hotels_viewed", "views", "views"),
            ("top_hotels_whatsapp", "whatsapp_clicks", "clicks"),
        ]:
            value = stats.c[metric]
            result[key] = await rows(
                session,
                select(
                    Hotel.id.label("hotel_id"),
                    Hotel.name,
                    Hotel.city,
                    value.label(label),
                )
                .join(stats, stats.c.hotel_id == Hotel.id)
                .where(value > 0)
                .order_by(value.desc(), Hotel.id)
                .limit(10),
            )
        day = utc_date(Event.created_at).label("date")
        daily = await rows(
            session,
            select(day, func.count().label("count"))
            .where(window, Event.event_type == "hotel_search")
            .group_by(day),
        )
        result["searches_by_day"] = daily_series(start, days, daily, ["count"])
        budget = func.coalesce(Event.budget_min, Event.budget_max)
        bucket = case(
            (budget < 30000, "0-30k"),
            (budget < 60000, "30k-60k"),
            (budget < 100000, "60k-100k"),
            else_="100k+",
        ).label("range")
        distribution = dict(
            (
                await session.execute(
                    select(bucket, func.count())
                    .where(
                        window, Event.event_type == "hotel_search", budget.is_not(None)
                    )
                    .group_by(bucket)
                )
            ).all()
        )
        result["budget_distribution"] = [
            {"range": label, "count": distribution.get(label, 0)}
            for label in ["0-30k", "30k-60k", "60k-100k", "100k+"]
        ]
        return result

    @router.get("/calls", dependencies=[Depends(require_admin)])
    async def calls(
        days: int = Query(30, ge=1, le=365),
        session: AsyncSession = Depends(get_db_session),
    ):
        start, end = period(days)
        log = HotelCallLog
        window = and_(log.called_at >= start, log.called_at <= end)
        verified = count_if(log.call_status == "verified")
        totals = (
            await rows(
                session,
                select(
                    func.count().label("total_calls"),
                    verified.label("verified"),
                    count_if(log.call_status == "unreachable").label("unreachable"),
                ).where(window),
            )
        )[0]
        totals["verification_rate"] = percentage(
            totals["verified"], totals["total_calls"]
        )
        day = utc_date(log.called_at).label("date")
        daily = await rows(
            session,
            select(day, func.count().label("total"), verified.label("verified"))
            .where(window)
            .group_by(day),
        )
        totals["calls_by_day"] = daily_series(start, days, daily, ["total", "verified"])
        callers = await rows(
            session,
            select(
                log.backoffice_user_id.label("user_id"),
                User.full_name.label("name"),
                func.max(log.called_at).label("last_active"),
                func.count().label("total"),
                verified.label("verified"),
            )
            .outerjoin(User, User.id == log.backoffice_user_id)
            .where(window)
            .group_by(log.backoffice_user_id, User.full_name)
            .order_by(func.count().desc(), log.backoffice_user_id),
        )
        totals["top_callers"] = [
            {**row, "rate": percentage(row["verified"], row["total"])}
            for row in callers
        ]
        towns = await rows(
            session,
            select(
                Hotel.city,
                func.count().label("total"),
                count_if(
                    or_(Hotel.call_status == "pending", Hotel.call_status.is_(None))
                ).label("pending"),
                count_if(Hotel.call_status == "called").label("called"),
                count_if(Hotel.call_status == "verified").label("verified"),
                count_if(Hotel.status == "verified").label("published"),
            )
            .group_by(Hotel.city)
            .order_by(Hotel.city),
        )
        totals["pipeline_counts"] = {
            key: sum(town[key] for town in towns)
            for key in ["total", "pending", "called", "verified", "published"]
        }
        for town in towns:
            town["completion_pct"] = percentage(town["verified"], town.pop("total"))
        totals["towns_progress"] = towns
        return totals

    @router.get("/hotels", dependencies=[Depends(require_admin)])
    async def hotels(
        days: int = Query(30, ge=1, le=365),
        session: AsyncSession = Depends(get_db_session),
    ):
        start, end = period(days)
        window = event_window(start, end)
        stats = hotel_counts(window)
        base = select(Hotel.id.label("hotel_id"), Hotel.name, Hotel.city).join(
            stats, stats.c.hotel_id == Hotel.id
        )
        viewed = await rows(
            session,
            base.add_columns(
                stats.c.views, stats.c.whatsapp_clicks, stats.c.phone_reveals
            )
            .where(stats.c.views > 0)
            .order_by(stats.c.views.desc(), Hotel.id),
        )
        for row in viewed:
            row["conversion_rate"] = percentage(row["whatsapp_clicks"], row["views"])
        contacts = stats.c.whatsapp_clicks + stats.c.phone_reveals
        contacted = await rows(
            session,
            base.add_columns(stats.c.whatsapp_clicks, stats.c.phone_reveals)
            .where(contacts > 0)
            .order_by(contacts.desc(), Hotel.id),
        )
        # zero_results is separate from hotel_search: do not count the pair twice.
        underserved = or_(
            Event.event_type == "zero_results",
            and_(Event.event_type == "hotel_search", Event.results_count.between(1, 3)),
        )
        cities = await city_ranking(session, window, underserved, "search_count")
        cities = await add_listed_counts(session, cities)
        zero_counts = dict(
            (
                await session.execute(
                    select(Event.city, func.count())
                    .where(window, Event.event_type == "zero_results")
                    .group_by(Event.city)
                )
            ).all()
        )
        for city in cities:
            city["zero_results_count"] = zero_counts.get(city["city"], 0)
        return {
            "most_viewed": viewed,
            "most_contacted": contacted,
            "zero_result_cities": cities,
        }

    return router
