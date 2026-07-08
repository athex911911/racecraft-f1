"""Shared pytest fixtures.

Tests run against the real `f1_insight` database (they need the ingested race
data). Anything a test writes — accounts, predictions, favorites — is created
under a unique `pytest_*` username and deleted afterwards (cascades clean up the
child rows), so the suite leaves no residue.
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.core.database import SessionLocal
from app.main import app
from app.models.user import User


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def temp_user(client, db):
    """Factory that registers a throwaway account and cleans it up on teardown."""
    created: list[int] = []

    def make() -> tuple[str, str]:
        uname = f"pytest_{uuid.uuid4().hex[:8]}"
        r = client.post(
            "/api/v1/auth/register",
            json={"email": f"{uname}@test.dev", "username": uname, "password": "testpass123"},
        )
        assert r.status_code == 201, r.text
        data = r.json()
        created.append(data["user"]["id"])
        return uname, data["access_token"]

    yield make

    for uid in created:
        db.execute(delete(User).where(User.id == uid))
    db.commit()
