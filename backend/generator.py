import random


def generate_plan(meals: list[dict], num_weeks: int) -> list[dict]:
    """
    Generate a meal plan for num_weeks weeks.
    Each week gets 2 meals. Constraints:
    - No same meal twice in a week
    - No meal repeated from the previous week
    - Each meal is removed from the pool after selection (weight controls how
      many times a meal can appear across the full plan)
    Falls back gracefully if the pool is exhausted.
    """
    # Build weighted pool: each meal id repeated `weight` times
    pool: list[str] = []
    for meal in meals:
        weight = int(meal.get("weight", 1))
        pool.extend([meal["id"]] * weight)

    remaining = pool.copy()
    previous_ids: set[str] = set()
    result = []

    for week in range(1, num_weeks + 1):
        # Prefer meals not used last week
        available = [m for m in remaining if m not in previous_ids]

        # Relax back-to-back constraint if pool is running low
        if len(set(available)) < 2:
            available = list(remaining)

        if len(set(available)) < 2:
            raise ValueError(
                f"Not enough meals to fill {num_weeks} weeks. "
                "Try adding more meals or reducing the number of weeks."
            )

        meal_1_id = random.choice(available)
        meal_2_candidates = [m for m in available if m != meal_1_id]
        meal_2_id = random.choice(meal_2_candidates)

        remaining.remove(meal_1_id)
        remaining.remove(meal_2_id)

        previous_ids = {meal_1_id, meal_2_id}
        result.append({"week": week, "meal_1_id": meal_1_id, "meal_2_id": meal_2_id})

    return result
