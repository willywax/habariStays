import os
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from jose import jwt
from test_analytics import api, AsyncSessionAdapter
from database import get_db_session
from models import User

@pytest.fixture
def reset_api(api, monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "isolated-password-test-key")
    import server_postgres as server
    _, session, _ = api
    for role in ["admin", "traveler", "owner", "cashier", "backoffice"]:
        session.add(User(id=role, role=role, email=role+"@example.test", full_name=role, phone="123", password_hash=server.get_password_hash("Original123"), is_active=True))
    session.commit()
    async def database():
        yield AsyncSessionAdapter(session)
    app = FastAPI()
    app.include_router(server.api_router)
    app.dependency_overrides[get_db_session] = database
    def headers(role):
        return {"Authorization": "Bearer " + jwt.encode({"sub": role}, server.SECRET_KEY, algorithm="HS256")}
    with TestClient(app) as client:
        yield client, session, server, headers

@pytest.mark.parametrize("role", ["admin", "traveler", "owner", "cashier", "backoffice"])
def test_admin_can_reset_every_role_without_revoking_tokens(reset_api, role):
    client, session, server, headers = reset_api
    existing_token = headers(role)
    response = client.post(f"/api/admin/users/{role}/reset-password", headers=headers("admin"), json={"new_password":"NewSecure123"})
    assert response.status_code == 200 and response.json() == {"message":"Password updated"}
    user = session.get(User, role)
    assert server.verify_password("NewSecure123", user.password_hash)
    assert not server.verify_password("Original123", user.password_hash)
    assert user.role == role and user.is_active
    assert client.get("/api/auth/me", headers=existing_token).status_code == 200

@pytest.mark.parametrize("role", [None, "traveler", "owner", "cashier", "backoffice"])
def test_only_admin_may_reset(reset_api, role):
    client, session, server, headers = reset_api
    response = client.post("/api/admin/users/traveler/reset-password", headers=headers(role) if role else {}, json={"new_password":"NewSecure123"})
    assert response.status_code == (403 if role else 401)
    assert server.verify_password("Original123", session.get(User, "traveler").password_hash)

@pytest.mark.parametrize("password", ["short", "", None, "a"*73, "😀"*19])
def test_server_validates_password(reset_api, password):
    client, session, server, headers = reset_api
    assert client.post("/api/admin/users/traveler/reset-password", headers=headers("admin"), json={"new_password":password}).status_code == 422
    assert server.verify_password("Original123", session.get(User,"traveler").password_hash)

def test_missing_user(reset_api):
    client, _, _, headers = reset_api
    assert client.post("/api/admin/users/missing/reset-password", headers=headers("admin"), json={"new_password":"NewSecure123"}).status_code == 404
