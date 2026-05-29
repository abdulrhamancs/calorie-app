import { dateKeyFromDate, parseLocalDate, saturdayWeekRange } from './dates';
import { safeNumber } from './validation';

const weightTimestamp = (entry) => {
  const date = new Date(entry?.createdAt || entry?.updatedAt || entry?.key || entry?.date || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

export const normalizeWeightEntry = (entry) => {
  const date = parseLocalDate(entry?.key || entry?.createdAt || entry?.date);
  const key = entry?.key || dateKeyFromDate(date);
  const value = safeNumber(entry?.value ?? entry?.weight);
  if (!key || value < 20 || value > 300) return null;

  return {
    ...entry,
    id: entry?.id || `${key}-${weightTimestamp(entry) || value}`,
    key,
    value,
    createdAt: entry?.createdAt || `${key}T12:00:00`,
  };
};

export const normalizeWeeklyWeightAverage = (summary) => {
  const range = saturdayWeekRange(summary?.weekStartDate);
  const averageWeight = safeNumber(summary?.averageWeight);
  const daysLogged = Math.max(0, Math.min(7, Math.round(safeNumber(summary?.daysLogged))));
  if (!range || averageWeight < 20 || averageWeight > 300 || daysLogged === 0) return null;

  const change = summary?.weightChangeFromPreviousWeek;
  return {
    id: summary?.id || `week-${range.weekStartDate}`,
    weekStartDate: range.weekStartDate,
    weekEndDate: summary?.weekEndDate || range.weekEndDate,
    averageWeight,
    daysLogged,
    isCompleteWeek: daysLogged === 7,
    weightChangeFromPreviousWeek: change === null || change === undefined || !Number.isFinite(Number(change)) ? null : Number(change),
    createdAt: summary?.createdAt || new Date().toISOString(),
    updatedAt: summary?.updatedAt || new Date().toISOString(),
  };
};

export const buildWeeklyWeightAverages = (weightHistory, existingSummaries = []) => {
  const existingByStart = new Map(
    (Array.isArray(existingSummaries) ? existingSummaries : [])
      .map(normalizeWeeklyWeightAverage)
      .filter(Boolean)
      .map((summary) => [summary.weekStartDate, summary])
  );
  const weeks = new Map();

  (Array.isArray(weightHistory) ? weightHistory : [])
    .map(normalizeWeightEntry)
    .filter(Boolean)
    .forEach((entry) => {
      const range = saturdayWeekRange(entry.key);
      if (!range) return;
      if (!weeks.has(range.weekStartDate)) {
        weeks.set(range.weekStartDate, { ...range, byDay: new Map() });
      }
      const week = weeks.get(range.weekStartDate);
      const currentForDay = week.byDay.get(entry.key);
      if (!currentForDay || weightTimestamp(entry) >= weightTimestamp(currentForDay)) {
        week.byDay.set(entry.key, entry);
      }
    });

  const now = new Date().toISOString();
  const summaries = [...weeks.values()]
    .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))
    .map((week) => {
      const dailyWeights = [...week.byDay.values()];
      const averageWeight = dailyWeights.reduce((sum, entry) => sum + safeNumber(entry.value), 0) / dailyWeights.length;
      const existing = existingByStart.get(week.weekStartDate);
      return {
        id: existing?.id || `week-${week.weekStartDate}`,
        weekStartDate: week.weekStartDate,
        weekEndDate: week.weekEndDate,
        averageWeight: Number(averageWeight.toFixed(1)),
        daysLogged: dailyWeights.length,
        isCompleteWeek: dailyWeights.length === 7,
        weightChangeFromPreviousWeek: null,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
    });

  return summaries
    .map((summary, index) => ({
      ...summary,
      weightChangeFromPreviousWeek: index > 0 ? Number((summary.averageWeight - summaries[index - 1].averageWeight).toFixed(1)) : null,
    }))
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
};

export const latestWeeklyWeightAverage = (summaries) =>
  (Array.isArray(summaries) ? summaries : [])
    .map(normalizeWeeklyWeightAverage)
    .filter(Boolean)
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))[0] || null;
