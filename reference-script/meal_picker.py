import random

filename = "meals.txt"

with open(filename, "r", encoding="utf-8") as file:
    meals = file.readlines()

meals = [line.strip() for line in meals]

previous_1 = ''
previous_2 = ''

for i in range(1, 9):
    meal_1 = random.choice(meals)
    meal_2 = random.choice(meals)

    while meal_1 in [previous_1, previous_2] or meal_2 in [previous_1, previous_2] or meal_1 == meal_2:
        meal_1 = random.choice(meals)
        meal_2 = random.choice(meals)

    previous_1 = meal_1
    previous_2 = meal_2

    meals.remove(meal_1)
    meals.remove(meal_2)

    print(f'Week {i}: {meal_1}, and {meal_2}')
