import pytest
from generator import generate_plan


def make_meals(n, weight=1):
    return [{"id": str(i), "weight": weight} for i in range(n)]


def test_returns_correct_number_of_weeks():
    result = generate_plan(make_meals(10), 4)
    assert len(result) == 4


def test_week_numbers_are_sequential():
    result = generate_plan(make_meals(10), 3)
    assert [e["week"] for e in result] == [1, 2, 3]


def test_entry_has_required_keys():
    result = generate_plan(make_meals(4), 1)
    entry = result[0]
    assert {"week", "meal_1_id", "meal_2_id"} <= entry.keys()


def test_no_same_meal_in_a_week():
    for _ in range(20):
        result = generate_plan(make_meals(20), 8)
        for entry in result:
            assert entry["meal_1_id"] != entry["meal_2_id"]


def test_no_back_to_back_repeats():
    for _ in range(20):
        result = generate_plan(make_meals(20), 8)
        for i in range(1, len(result)):
            prev = {result[i - 1]["meal_1_id"], result[i - 1]["meal_2_id"]}
            curr = {result[i]["meal_1_id"], result[i]["meal_2_id"]}
            assert not prev & curr, f"Back-to-back repeat at week {i + 1}"


def test_no_repeated_meals_within_plan():
    result = generate_plan(make_meals(20), 8)
    used = [e["meal_1_id"] for e in result] + [e["meal_2_id"] for e in result]
    assert len(used) == len(set(used))


def test_raises_when_not_enough_meals():
    with pytest.raises(ValueError, match="Not enough meals"):
        generate_plan(make_meals(1), 1)


def test_weighted_meals_selected_more_often():
    meals = [{"id": "heavy", "weight": 5}] + [
        {"id": str(i), "weight": 1} for i in range(19)
    ]
    hits = sum(
        1
        for _ in range(50)
        for entry in generate_plan(meals, 1)
        if "heavy" in (entry["meal_1_id"], entry["meal_2_id"])
    )
    # With weight 5 out of total weight 24, expect ~20 hits over 50 runs; 10 is a safe floor
    assert hits > 10
