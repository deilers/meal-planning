def _create_meals(client, n):
    for i in range(n):
        client.post("/api/meals", json={"name": f"Meal {i}"})


# ── Meals ─────────────────────────────────────────────────────────────────────


def test_list_meals_empty(client):
    resp = client.get("/api/meals")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_meal(client):
    resp = client.post("/api/meals", json={"name": "Tacos"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Tacos"
    assert data["weight"] == 1
    assert "id" in data
    assert "created_at" in data


def test_create_meal_with_all_fields(client):
    resp = client.post(
        "/api/meals",
        json={"name": "Tacos", "recipe": "Cook it.", "ingredients": "Beef\nCheese", "tags": "mexican", "weight": 3},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["recipe"] == "Cook it."
    assert data["weight"] == 3


def test_get_meal(client):
    created = client.post("/api/meals", json={"name": "Tacos"}).json()
    resp = client.get(f"/api/meals/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Tacos"


def test_get_meal_not_found(client):
    resp = client.get("/api/meals/nonexistent")
    assert resp.status_code == 404


def test_update_meal(client):
    created = client.post("/api/meals", json={"name": "Tacos"}).json()
    resp = client.put(f"/api/meals/{created['id']}", json={"name": "Burritos", "weight": 2})
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Burritos"
    assert data["weight"] == 2


def test_update_meal_not_found(client):
    resp = client.put("/api/meals/nonexistent", json={"name": "X"})
    assert resp.status_code == 404


def test_delete_meal(client):
    created = client.post("/api/meals", json={"name": "Tacos"}).json()
    resp = client.delete(f"/api/meals/{created['id']}")
    assert resp.status_code == 204
    assert client.get(f"/api/meals/{created['id']}").status_code == 404


def test_delete_meal_not_found(client):
    resp = client.delete("/api/meals/nonexistent")
    assert resp.status_code == 404


def test_list_meals_sorted_alphabetically(client):
    for name in ["Zucchini soup", "Apple pie", "Meatballs"]:
        client.post("/api/meals", json={"name": name})
    names = [m["name"] for m in client.get("/api/meals").json()]
    assert names == sorted(names, key=str.lower)


def test_list_meals_filter_by_tag(client):
    client.post("/api/meals", json={"name": "Tacos", "tags": "mexican"})
    client.post("/api/meals", json={"name": "Spaghetti", "tags": "italian"})
    resp = client.get("/api/meals?tag=mexican")
    names = [m["name"] for m in resp.json()]
    assert names == ["Tacos"]


# ── Plans ─────────────────────────────────────────────────────────────────────


def test_generate_plan(client):
    _create_meals(client, 10)
    resp = client.post("/api/plans/generate", json={"weeks": 4, "name": "April"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "April"
    assert len(data["weeks"]) == 4


def test_generate_plan_default_name(client):
    _create_meals(client, 4)
    resp = client.post("/api/plans/generate", json={"weeks": 1, "name": ""})
    assert resp.status_code == 201
    assert resp.json()["name"].startswith("Plan ")


def test_generate_plan_week_entries_have_meal_names(client):
    _create_meals(client, 4)
    resp = client.post("/api/plans/generate", json={"weeks": 1, "name": ""})
    week = resp.json()["weeks"][0]
    assert week["meal_1_name"] != ""
    assert week["meal_2_name"] != ""


def test_generate_plan_not_enough_meals(client):
    client.post("/api/meals", json={"name": "Only Meal"})
    resp = client.post("/api/plans/generate", json={"weeks": 1, "name": ""})
    assert resp.status_code == 400


def test_list_plans(client):
    _create_meals(client, 4)
    client.post("/api/plans/generate", json={"weeks": 1, "name": "Plan A"})
    client.post("/api/plans/generate", json={"weeks": 1, "name": "Plan B"})
    resp = client.get("/api/plans")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_plans_newest_first(client):
    _create_meals(client, 4)
    client.post("/api/plans/generate", json={"weeks": 1, "name": "First"})
    client.post("/api/plans/generate", json={"weeks": 1, "name": "Second"})
    names = [p["name"] for p in client.get("/api/plans").json()]
    assert names[0] == "Second"


def test_get_plan(client):
    _create_meals(client, 4)
    plan = client.post("/api/plans/generate", json={"weeks": 1, "name": "Test"}).json()
    resp = client.get(f"/api/plans/{plan['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == plan["id"]


def test_get_plan_not_found(client):
    assert client.get("/api/plans/nonexistent").status_code == 404


def test_update_plan_name(client):
    _create_meals(client, 4)
    plan = client.post("/api/plans/generate", json={"weeks": 1, "name": "Old"}).json()
    resp = client.put(f"/api/plans/{plan['id']}", json={"name": "New"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


def test_delete_plan(client):
    _create_meals(client, 4)
    plan = client.post("/api/plans/generate", json={"weeks": 1, "name": "To Delete"}).json()
    assert client.delete(f"/api/plans/{plan['id']}").status_code == 204
    assert client.get(f"/api/plans/{plan['id']}").status_code == 404


def test_delete_plan_not_found(client):
    assert client.delete("/api/plans/nonexistent").status_code == 404
