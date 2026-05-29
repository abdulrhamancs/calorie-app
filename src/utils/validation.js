export const clamp = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(number, min), max);
};

export const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const roundCalories = (value) => Math.round(clamp(value, 0, 6000));
export const roundMacro = (value) => Math.round(clamp(value, 0, 500));

export const validateMealValues = (meal) =>
  meal.name?.trim() &&
  meal.calories >= 0 &&
  meal.calories <= 5000 &&
  meal.protein >= 0 &&
  meal.protein <= 500 &&
  meal.carbs >= 0 &&
  meal.carbs <= 500 &&
  meal.fat >= 0 &&
  meal.fat <= 500;

export const validateProfile = (profile) =>
  safeNumber(profile.age) >= 10 &&
  safeNumber(profile.age) <= 100 &&
  safeNumber(profile.height) >= 100 &&
  safeNumber(profile.height) <= 230 &&
  safeNumber(profile.currentWeight) >= 20 &&
  safeNumber(profile.currentWeight) <= 300 &&
  safeNumber(profile.goalWeight) >= 20 &&
  safeNumber(profile.goalWeight) <= 300 &&
  safeNumber(profile.proteinTarget) >= 0 &&
  safeNumber(profile.proteinTarget) <= 300 &&
  safeNumber(profile.calorieTarget) >= 800 &&
  safeNumber(profile.calorieTarget) <= 6000;
