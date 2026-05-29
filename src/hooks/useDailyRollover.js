import { useMemo } from 'react';
import { displayDate, parseLocalDate, todayKey } from '../utils/dates';
import { normalizeMeal, sumMeals, uid } from '../utils/nutrition';
import { readJSON, safeArray, writeJSON } from '../utils/storage';

export function useDailyRollover() {
  return useMemo(() => {
    const today = todayKey();
    const activeDay = localStorage.getItem('activeDay');
    const foods = safeArray(readJSON('foods', [])).map((food) => normalizeMeal(food));
    const history = safeArray(readJSON('history', []));
    const targets = readJSON('targets', null);

    if (!activeDay) {
      localStorage.setItem('activeDay', today);
      return { foods, history, note: '' };
    }

    if (activeDay === today) {
      return { foods, history, note: '' };
    }

    let nextHistory = history;
    let note = '';
    const alreadyArchived = history.some((entry) => entry?.key === activeDay || entry?.date === activeDay);

    if (foods.length > 0 && !alreadyArchived) {
      nextHistory = [
        {
          id: uid(),
          key: activeDay,
          date: displayDate('en', parseLocalDate(activeDay) || new Date()),
          totals: sumMeals(foods),
          target: targets?.calories || targets?.calorieTarget || 0,
          items: foods,
          autoArchived: true,
        },
        ...history,
      ];
      writeJSON('history', nextHistory);
      note = 'New day started. Yesterday was archived.';
    }

    writeJSON('foods', []);
    localStorage.setItem('activeDay', today);
    return { foods: [], history: nextHistory, note };
  }, []);
}
