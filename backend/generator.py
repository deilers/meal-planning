import random


def generate_plan(meals: list[dict], num_weeks: int) -> list[dict]:
    """
    Generate a meal plan for the given number of weeks.

    Each week is assigned 2 distinct meals drawn from a weighted pool. Constraints:
    - The two meals in a week must differ.
    - Neither meal may repeat from the previous week (back-to-back constraint).
    - Each selection removes one occurrence from the pool, so a meal with weight N
      can appear at most N times across the full plan.

    If the pool runs too low to satisfy the back-to-back constraint, it is relaxed
    and the full remaining pool is used. If even that has fewer than 2 unique meals,
    a ValueError is raised.

    Args:
        meals: List of dicts with 'id' and 'weight' keys.
        num_weeks: Number of weeks to generate.

    Returns:
        List of dicts with keys 'week', 'meal_1_id', 'meal_2_id'.

    Raises:
        ValueError: If there are not enough meals to fill the requested weeks.
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
