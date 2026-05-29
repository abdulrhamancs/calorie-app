import { todayKey } from './dates';
import { clamp, roundCalories, roundMacro, safeNumber } from './validation';

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export const UNITS = ['g', 'ml', 'piece', 'serving', 'tbsp', 'tsp', 'cup', 'unknown'];

export const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const normalizeMeal = (meal = {}, defaults = {}) => {
  const totals = meal.totals || {};
  return {
    id: meal.id || uid(),
    name: String(meal.name || meal.label || meal.food || defaults.name || 'Meal').trim(),
    category: MEAL_TYPES.includes(meal.category) ? meal.category : defaults.category || 'Breakfast',
    calories: roundCalories(meal.calories ?? meal.cal ?? totals.calories ?? totals.cal ?? defaults.calories ?? 0),
    protein: roundMacro(meal.protein ?? meal.p ?? totals.protein ?? totals.p ?? defaults.protein ?? 0),
    carbs: roundMacro(meal.carbs ?? meal.c ?? totals.carbs ?? totals.c ?? defaults.carbs ?? 0),
    fat: roundMacro(meal.fat ?? meal.f ?? totals.fat ?? totals.f ?? defaults.fat ?? 0),
    quantity: clamp(meal.quantity ?? defaults.quantity ?? 1, 0, 5000),
    unit: UNITS.includes(meal.unit) ? meal.unit : defaults.unit || 'serving',
    confidence: ['high', 'medium', 'low', 'manual'].includes(meal.confidence) ? meal.confidence : defaults.confidence || 'manual',
    source: ['ai', 'manual', 'saved', 'recent'].includes(meal.source) ? meal.source : defaults.source || 'manual',
    notes: String(meal.notes || meal.reasoningNote || defaults.notes || '').slice(0, 240),
    items: Array.isArray(meal.items) ? meal.items : [],
    imagePreview: typeof (meal.imagePreview || meal.thumbnail || defaults.imagePreview) === 'string' ? (meal.imagePreview || meal.thumbnail || defaults.imagePreview) : '',
    createdAt: meal.createdAt || defaults.createdAt || new Date().toISOString(),
    dateKey: meal.dateKey || defaults.dateKey || todayKey(),
  };
};

export const sumMeals = (meals = []) =>
  meals.map((meal) => normalizeMeal(meal)).reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fat: sum.fat + meal.fat,
      cal: sum.cal + meal.calories,
      p: sum.p + meal.protein,
      c: sum.c + meal.carbs,
      f: sum.f + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, cal: 0, p: 0, c: 0, f: 0 }
  );

export const estimateTargets = (profile) => {
  const weight = clamp(profile.currentWeight, 20, 300);
  const height = clamp(profile.height, 100, 230);
  const age = clamp(profile.age, 10, 100);
  const activity = { low: 1.35, moderate: 1.55, high: 1.75 }[profile.activity] || 1.45;
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const maintenance = bmr * activity;
  const calories = profile.goal === 'lose' ? maintenance - 450 : profile.goal === 'gain' ? maintenance + 300 : maintenance;
  const suggestedCalories = Math.round(clamp(calories, 800, 6000) / 10) * 10;
  const suggestedProtein = Math.round(clamp(weight * (profile.goal === 'gain' ? 2 : 1.8), 0, 300));

  return {
    suggestedCalories,
    suggestedProtein,
    calories: roundCalories(profile.calorieTarget || suggestedCalories),
    protein: Math.round(clamp(profile.proteinTarget || suggestedProtein, 0, 300)),
    carbs: roundMacro((safeNumber(profile.calorieTarget || suggestedCalories) * 0.42) / 4),
    fat: roundMacro((safeNumber(profile.calorieTarget || suggestedCalories) * 0.28) / 9),
  };
};

export const normalizeProfile = (profile = {}) => {
  const base = {
    age: clamp(profile.age ?? 30, 10, 100),
    height: clamp(profile.height ?? 172, 100, 230),
    currentWeight: clamp(profile.currentWeight ?? 75, 20, 300),
    goalWeight: clamp(profile.goalWeight ?? 70, 20, 300),
    activity: ['low', 'moderate', 'high'].includes(profile.activity) ? profile.activity : 'moderate',
    goal: ['lose', 'maintain', 'gain'].includes(profile.goal) ? profile.goal : 'lose',
    calorieTarget: profile.calorieTarget,
    proteinTarget: profile.proteinTarget,
  };
  const targets = estimateTargets(base);
  return {
    ...base,
    calorieTarget: clamp(base.calorieTarget || targets.suggestedCalories, 800, 6000),
    proteinTarget: clamp(base.proteinTarget || targets.suggestedProtein, 0, 300),
  };
};

export const normalizeAIResult = (raw = {}) => {
  const items = Array.isArray(raw.items) ? raw.items : [];
  const normalizedItems = items.map((item) => normalizeMeal(item, { source: 'ai', confidence: item.confidence || 'low', unit: item.unit || 'unknown' }));
  const totalsFromItems = sumMeals(normalizedItems);
  const totals = raw.totals || {};
  const confidence = normalizedItems.some((item) => item.confidence === 'low')
    ? 'low'
    : normalizedItems.some((item) => item.confidence === 'medium')
      ? 'medium'
      : 'high';

  return {
    items: normalizedItems,
    totals: {
      calories: roundCalories(totals.calories ?? totals.cal ?? totalsFromItems.calories),
      protein: roundMacro(totals.protein ?? totals.p ?? totalsFromItems.protein),
      carbs: roundMacro(totals.carbs ?? totals.c ?? totalsFromItems.carbs),
      fat: roundMacro(totals.fat ?? totals.f ?? totalsFromItems.fat),
      cal: roundCalories(totals.calories ?? totals.cal ?? totalsFromItems.calories),
      p: roundMacro(totals.protein ?? totals.p ?? totalsFromItems.protein),
      c: roundMacro(totals.carbs ?? totals.c ?? totalsFromItems.carbs),
      f: roundMacro(totals.fat ?? totals.f ?? totalsFromItems.fat),
    },
    confidence,
    needsUserClarification: Boolean(raw.needsUserClarification) || confidence === 'low',
    clarifyingQuestion: raw.clarifyingQuestion || (confidence === 'low' ? 'What portion size, grams, or serving amount should I use?' : null),
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map((warning) => String(warning).slice(0, 160)) : [],
  };
};

export const normalizeArchiveDay = (day = {}) => {
  const totals = day.totals || {};
  return {
    calories: roundCalories(totals.calories ?? totals.cal ?? day.calories ?? day.cal),
    protein: roundMacro(totals.protein ?? totals.p ?? day.protein ?? day.p),
    carbs: roundMacro(totals.carbs ?? totals.c ?? day.carbs ?? day.c),
    fat: roundMacro(totals.fat ?? totals.f ?? day.fat ?? day.f),
    goal: roundCalories(day.goal ?? day.target ?? day.calGoal),
    date: day.date || day.key || '',
    items: Array.isArray(day.items) ? day.items.filter(Boolean).map((item) => normalizeMeal(item)) : [],
  };
};

export const toStoredMeal = (meal, defaults = {}) => normalizeMeal(meal, defaults);
