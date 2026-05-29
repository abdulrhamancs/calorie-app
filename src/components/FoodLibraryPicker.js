import React, { memo, useCallback, useMemo, useState } from 'react';
import { normalizeMeal, uid } from '../utils/nutrition';
import { COMMON_FOODS } from '../constants/commonFoods';
import EmptyStateIcon from './EmptyStateIcon';

const UNITS = ['g', 'ml', 'serving', 'pack', 'bottle', 'scoop', 'container', 'can', 'slice', 'tbsp', 'tsp', 'piece', 'cup'];
const unitKey = { g: 'grams', ml: 'ml', serving: 'serving', pack: 'pack', bottle: 'bottle', scoop: 'scoop', container: 'container', can: 'can', slice: 'slice', tbsp: 'tablespoon', tsp: 'teaspoon', piece: 'piece', cup: 'cup' };
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const mealTypeKey = { Breakfast: 'libraryBreakfast', Lunch: 'libraryLunch', Dinner: 'libraryDinner', Snack: 'librarySnack' };
const PAGE_SIZE = 30;
const CATEGORY_FILTERS = [
  { key: 'all', labelKey: 'foodCategoryAll' },
  { key: 'protein', labelKey: 'foodCategoryProtein', categories: ['proteinFoods'] },
  { key: 'proteinDrinks', labelKey: 'foodCategoryProteinDrinks', categories: ['proteinDrinks'] },
  { key: 'dairy', labelKey: 'foodCategoryDairy', categories: ['dairyFoods', 'highProteinDairy'] },
  { key: 'carbs', labelKey: 'foodCategoryCarbs', categories: ['carbFoods'] },
  { key: 'fats', labelKey: 'foodCategoryFats', categories: ['fatFoods'] },
  { key: 'arabicFoods', labelKey: 'foodCategoryArabicFoods', categories: ['arabicFoods'] },
  { key: 'snacks', labelKey: 'foodCategorySnacks', categories: ['snackFoods'] },
  { key: 'sauces', labelKey: 'foodCategorySauces', categories: ['sauceFoods', 'cookingFoods'] },
  { key: 'drinks', labelKey: 'foodCategoryDrinks', categories: ['drinkFoods'] },
  { key: 'fruits', labelKey: 'foodCategoryFruits', categories: ['fruitFoods'], ids: ['banana', 'apple', 'orange', 'dates', 'strawberries', 'grapes', 'watermelon', 'mango'] },
  { key: 'vegetables', labelKey: 'foodCategoryVegetables', categories: ['vegetableFoods'] },
  { key: 'supplements', labelKey: 'foodCategorySupplements', categories: ['proteinSupplements', 'supplementFoods'], ids: ['whey-protein-scoop', 'whey-protein-powder', 'protein-shake-ready-to-drink'] },
];

const round = (value, digits = 0) => Number((Number(value) || 0).toFixed(digits));
const parseAmount = (value) => {
  if (value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const hasUsefulName = (name) => {
  const value = String(name || '').trim();
  return value && !/^[\d\s.,:/\\-]+$/.test(value);
};

const getSearchText = (food) => `${food.name || ''} ${food.arabicName || ''} ${food.category || ''} ${(food.aliases || []).join(' ')}`.toLowerCase();

const toLibraryFood = (food, source) => {
  const normalized = normalizeMeal(food, { source });
  const libraryFood = {
    id: normalized.id,
    name: source === 'recent' && !hasUsefulName(normalized.name) ? 'Recent meal' : normalized.name,
    arabicName: food.arabicName || '',
    servingUnit: normalized.unit === 'unknown' ? 'serving' : normalized.unit,
    baseAmount: Number(normalized.quantity) || 1,
    calories: normalized.calories,
    protein: normalized.protein,
    carbs: normalized.carbs,
    fat: normalized.fat,
    servingOptions: food.servingOptions || [],
    aliases: Array.isArray(food.aliases) ? food.aliases : [],
    category: food.category || '',
    createdAt: food.createdAt || normalized.createdAt,
    source,
    isFavorite: Boolean(food.favorite || food.isFavorite),
    imagePreview: normalized.imagePreview,
  };
  return {
    ...libraryFood,
    searchText: getSearchText(libraryFood),
  };
};

function calculate(food, unit, amount) {
  const safeAmount = parseAmount(amount);
  const factor = getConversionFactor(food, unit, safeAmount);
  return {
    calories: round(food.calories * factor),
    protein: round(food.protein * factor, 1),
    carbs: round(food.carbs * factor, 1),
    fat: round(food.fat * factor, 1),
  };
}

function getConversionFactor(food, unit, amount) {
  const options = Array.isArray(food.servingOptions) ? food.servingOptions : [];
  const selectedOption = options.find((item) => item.unit === unit);
  const baseReference = getBaseReferenceAmount(food);

  if ((unit === 'g' || unit === 'ml') && baseReference) {
    return amount / baseReference;
  }

  if (selectedOption && Number(selectedOption.grams) > 0 && baseReference) {
    return (amount * Number(selectedOption.grams)) / baseReference;
  }

  if (unit === food.servingUnit) {
    return amount;
  }

  return 0;
}

function getAvailableUnits(food) {
  const options = Array.isArray(food.servingOptions) ? food.servingOptions : [];
  const optionUnits = options
    .filter((item) => UNITS.includes(item.unit) && Number(item.grams) > 0)
    .map((item) => item.unit);
  const units = new Set(optionUnits);
  const baseUnit = UNITS.includes(food.servingUnit) ? food.servingUnit : 'serving';
  const baseReference = getBaseReferenceAmount(food);
  const measureUnit = getMeasureUnit(food);

  units.add(baseUnit);
  if (baseReference && measureUnit) units.add(measureUnit);

  return UNITS.filter((item) => units.has(item));
}

function getBaseReferenceAmount(food) {
  const baseAmount = Number(food.baseAmount);
  const options = Array.isArray(food.servingOptions) ? food.servingOptions : [];
  const baseOption = options.find((item) => item.unit === food.servingUnit);

  if (Number(baseOption?.grams) > 0) return Number(baseOption.grams);
  if (['g', 'ml'].includes(food.servingUnit) && Number.isFinite(baseAmount) && baseAmount > 0) return baseAmount;
  if (Number.isFinite(baseAmount) && baseAmount > 1) return baseAmount;
  return null;
}

function getMeasureUnit(food) {
  if (food.servingUnit === 'ml') return 'ml';
  if (food.servingUnit === 'g') return 'g';
  if (['scoop', 'piece', 'slice', 'pack', 'can'].includes(food.servingUnit)) return 'g';
  if (['drinkFoods', 'proteinDrinks'].includes(food.category)) return 'ml';
  return 'g';
}

const FoodLibraryRow = memo(function FoodLibraryRow({ food, t, onSelect }) {
  return (
    <article className="library-food-row">
      <div>
        <strong dir="auto">{food.name === 'Recent meal' ? t.recentMealFallback : food.name}</strong>
        {food.arabicName && <span dir="auto">{food.arabicName}</span>}
        {food.category && <small>{t[food.category] || food.category}</small>}
        <small>{food.baseAmount === 100 ? t.per100g : t.perServing} &middot; {food.calories} {t.calories}</small>
        <small className="library-macro-row">P {food.protein}g &middot; C {food.carbs}g &middot; F {food.fat}g</small>
      </div>
      <button type="button" onClick={() => onSelect(food)}>{t.select}</button>
    </article>
  );
});

function FoodLibraryPicker({ t, savedFoods, recentMeals, onClose, onAdd, onSave, onFavorite }) {
  const [tab, setTab] = useState('commonFoods');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [unit, setUnit] = useState('g');
  const [amountDraft, setAmountDraft] = useState('100');
  const [mealType, setMealType] = useState('Breakfast');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const foods = useMemo(() => {
    const common = COMMON_FOODS.map((food) => ({
      ...food,
      searchText: food.searchText || getSearchText(food),
    }));
    const saved = savedFoods.map((food) => toLibraryFood(food, 'saved'));
    const recent = recentMeals.map((food) => toLibraryFood(food, 'recent'));
    const favorites = saved.filter((food) => food.isFavorite);
    return { commonFoods: common, myFoods: saved, favorites, recentMeals: recent };
  }, [recentMeals, savedFoods]);

  const activeCategory = useMemo(() => CATEGORY_FILTERS.find((item) => item.key === categoryFilter), [categoryFilter]);

  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    return foods[tab].filter((food) => {
      const categoryMatches = tab !== 'commonFoods'
        || !activeCategory
        || activeCategory.key === 'all'
        || activeCategory.categories?.includes(food.category)
        || activeCategory.ids?.includes(food.id);
      if (!categoryMatches) return false;
      if (!term) return true;
      return food.searchText.includes(term);
    });
  }, [activeCategory, foods, query, tab]);

  const visibleList = useMemo(() => list.slice(0, visibleCount), [list, visibleCount]);
  const hasMore = visibleCount < list.length;
  const emptyText = tab === 'myFoods'
    ? t.noSavedFoodsYet
    : tab === 'favorites'
      ? t.noFavoritesYet
      : tab === 'recentMeals'
        ? t.noRecentMealsYet
        : t.noFoodsFound;

  const updateQuery = (value) => {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  };

  const updateTab = (key) => {
    setTab(key);
    setVisibleCount(PAGE_SIZE);
  };

  const updateCategory = (key) => {
    setCategoryFilter(key);
    setVisibleCount(PAGE_SIZE);
  };

  const openFood = useCallback((food) => {
    const units = getAvailableUnits(food);
    const nextUnit = units.includes(food.servingUnit) ? food.servingUnit : units[0] || 'serving';
    setSelected(food);
    setUnit(nextUnit);
    setAmountDraft(String(nextUnit === 'g' || nextUnit === 'ml' ? (food.baseAmount || 100) : 1));
  }, []);

  const amountValue = parseAmount(amountDraft);
  const hasValidAmount = amountValue > 0;
  const nutrition = selected ? calculate(selected, unit, amountDraft) : null;
  const availableUnits = selected ? getAvailableUnits(selected) : UNITS;

  const amountAsGrams = () => {
    if (!selected) return amountValue;
    if (unit === 'g' || unit === 'ml') return amountValue;
    const option = selected.servingOptions?.find((item) => item.unit === unit);
    return option?.grams ? amountValue * option.grams : amountValue;
  };

  const addGramAmount = (delta) => {
    if (!availableUnits.includes('g')) return;
    setUnit('g');
    setAmountDraft(String(Math.max(0, round(amountAsGrams() + delta, 1))));
  };

  const updateAmountDraft = (value) => {
    if (value === '') {
      setAmountDraft('');
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setAmountDraft(parsed < 0 ? '0' : value);
  };

  const addToToday = () => {
    if (!selected || !nutrition || !hasValidAmount || !selected.name.trim()) return;
    onAdd({
      id: uid(),
      name: selected.arabicName ? `${selected.name} / ${selected.arabicName}` : selected.name,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      category: mealType,
      quantity: amountValue,
      unit,
      confidence: 'manual',
      source: selected.source === 'recent' ? 'recent' : selected.source === 'common' ? 'library' : 'saved',
      notes: `${t.amount}: ${amountDraft}${unit}`,
      imagePreview: selected.imagePreview || '',
    });
    onClose();
  };

  const saveSelected = () => {
    if (!selected || !nutrition || !hasValidAmount || !selected.name.trim()) return;
    onSave({
      name: selected.arabicName ? `${selected.name} / ${selected.arabicName}` : selected.name,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      quantity: amountValue,
      unit,
      confidence: 'manual',
      source: 'saved',
    });
  };

  return (
    <div className="modal-backdrop food-library-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card food-library-modal" role="dialog" aria-modal="true" aria-label={t.foodLibrary} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{t.addMealSource}</p>
            <h2>{t.foodLibrary}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t.cancel}>&times;</button>
        </div>

        {!selected ? (
          <>
            <label className="field">
              <span>{t.searchFoods}</span>
              <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder={t.searchFoods} dir="auto" />
            </label>
            <div className="segmented food-library-tabs">
              {['commonFoods', 'myFoods', 'favorites', 'recentMeals'].map((key) => (
                <button key={key} type="button" className={tab === key ? 'active' : ''} onClick={() => updateTab(key)}>{t[key]}</button>
              ))}
            </div>
            {tab === 'commonFoods' && (
              <div className="food-category-filters">
                {CATEGORY_FILTERS.map((filter) => (
                  <button key={filter.key} type="button" className={categoryFilter === filter.key ? 'active' : ''} onClick={() => updateCategory(filter.key)}>
                    {t[filter.labelKey]}
                  </button>
                ))}
              </div>
            )}
            <div className="food-library-list">
              {list.length === 0 ? (
                <div className="empty-state compact-empty"><EmptyStateIcon type="library" /><p>{emptyText}</p></div>
              ) : visibleList.map((food) => (
                <FoodLibraryRow key={`${food.source}-${food.id}`} food={food} t={t} onSelect={openFood} />
              ))}
            </div>
            {hasMore && (
              <button className="secondary-action show-more-foods" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                {t.showMore}
              </button>
            )}
          </>
        ) : (
          <div className="food-amount-panel">
            <button className="back-action" type="button" onClick={() => setSelected(null)}>&larr; {t.back}</button>
            <div className="section-title compact-title">
              <p className="eyebrow">{selected.baseAmount === 100 ? t.per100g : t.perServing}</p>
              <h2 dir="auto">{selected.name}</h2>
              {selected.arabicName && <p dir="auto">{selected.arabicName}</p>}
            </div>
            <div className="compact-grid">
              <label className="field"><span>{t.amount}</span><input type="number" min="0" step="1" value={amountDraft} onChange={(event) => updateAmountDraft(event.target.value)} /></label>
              <label className="field"><span>{t.unit}</span><select value={unit} onChange={(event) => setUnit(event.target.value)}>{availableUnits.map((item) => <option key={item} value={item}>{t[unitKey[item]]}</option>)}</select></label>
            </div>
            <label className="field">
              <span>{t.libraryMealType}</span>
              <select value={mealType} onChange={(event) => setMealType(event.target.value)}>
                {MEAL_TYPES.map((meal) => <option key={meal} value={meal}>{t[mealTypeKey[meal]]}</option>)}
              </select>
            </label>
            <div className="amount-controls">
              {[-50, -10, 10, 50, 100].map((delta) => (
                <button type="button" key={delta} disabled={!availableUnits.includes('g')} onClick={() => addGramAmount(delta)}>{delta > 0 ? `+${delta}g` : `${delta}g`}</button>
              ))}
            </div>
            <div className="library-nutrition-grid">
              <div><span>{t.calories}</span><strong>{nutrition.calories}</strong></div>
              <div><span>{t.protein}</span><strong>{nutrition.protein}g</strong></div>
              <div><span>{t.carbs}</span><strong>{nutrition.carbs}g</strong></div>
              <div><span>{t.fat}</span><strong>{nutrition.fat}g</strong></div>
            </div>
            <div className="action-row">
              <button className="secondary-action" type="button" disabled={!hasValidAmount} onClick={saveSelected}>{t.saveFood}</button>
              {selected.source !== 'common' && <button className="secondary-action" type="button" onClick={() => onFavorite(selected)}>{selected.isFavorite ? t.unfavorite : t.favorite}</button>}
              <button className="primary-action" type="button" disabled={!hasValidAmount} onClick={addToToday}>{t.addToToday}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default FoodLibraryPicker;
