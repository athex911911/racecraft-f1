def test_predict_open_race_and_lock_completed(client, temp_user):
    _, token = temp_user()
    h = {"Authorization": f"Bearer {token}"}

    races = client.get("/api/v1/league/races", headers=h).json()
    opens = [r for r in races["races"] if r["status"] == "open"]
    completed = [r for r in races["races"] if r["status"] == "completed"]
    assert opens, "expected at least one open race in the current season"
    assert completed, "expected at least one completed race in the current season"

    oid = opens[0]["race_id"]
    detail = client.get(f"/api/v1/league/races/{oid}", headers=h).json()
    driver_id = detail["options"][0]["driver"]["id"]

    r = client.post(
        "/api/v1/league/predictions",
        headers=h,
        json={"race_id": oid, "winner_driver_id": driver_id},
    )
    assert r.status_code == 201
    assert r.json()["prediction"]["winner_driver_id"] == driver_id

    # a completed race is locked
    r = client.post(
        "/api/v1/league/predictions",
        headers=h,
        json={"race_id": completed[-1]["race_id"], "winner_driver_id": driver_id},
    )
    assert r.status_code == 409


def test_prediction_requires_auth(client):
    assert client.post("/api/v1/league/predictions", json={"race_id": 1}).status_code == 401


def test_leaderboard_is_public(client):
    r = client.get("/api/v1/league/leaderboard")
    assert r.status_code == 200
    assert "entries" in r.json()
