def test_register_login_me(client, temp_user):
    uname, token = temp_user()

    r = client.post("/api/v1/auth/login", json={"identifier": uname, "password": "testpass123"})
    assert r.status_code == 200
    assert r.json()["user"]["username"] == uname

    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["username"] == uname


def test_duplicate_registration_conflicts(client, temp_user):
    uname, _ = temp_user()
    r = client.post(
        "/api/v1/auth/register",
        json={"email": f"{uname}@test.dev", "username": uname, "password": "testpass123"},
    )
    assert r.status_code == 409


def test_bad_password_rejected(client, temp_user):
    uname, _ = temp_user()
    r = client.post("/api/v1/auth/login", json={"identifier": uname, "password": "nope"})
    assert r.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_weak_password_validation(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "x@y.dev", "username": "weakling", "password": "short"},
    )
    assert r.status_code == 422


def test_favorites_add_and_list(client, temp_user):
    _, token = temp_user()
    h = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/v1/auth/favorites", headers=h, json={"entity_type": "driver", "entity_ref": "hamilton"})
    assert r.status_code == 201
    assert any(f["entity_ref"] == "hamilton" for f in r.json())
