export const todayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const dateKeyFromDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const displayDate = (lang = 'en', date = new Date()) =>
  date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const daysBetween = (a, b) => {
  const start = parseLocalDate(a);
  const end = parseLocalDate(b);
  if (!start || !end) return 0;
  return Math.round((end - start) / 86400000);
};

export const addDays = (dateKey, offset) => {
  const date = parseLocalDate(dateKey) || new Date();
  date.setDate(date.getDate() + offset);
  return dateKeyFromDate(date);
};

export const lastLocalDays = (count, endKey = todayKey()) =>
  Array.from({ length: count }, (_, index) => addDays(endKey, index - (count - 1)));

export const currentWeekDays = (dateKey = todayKey()) => {
  const date = parseLocalDate(dateKey) || new Date();
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => dateKeyFromDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)));
};

export const saturdayWeekRange = (value) => {
  const date = parseLocalDate(value);
  if (!date) return null;
  const start = new Date(date);
  const daysSinceSaturday = (start.getDay() + 1) % 7;
  start.setDate(start.getDate() - daysSinceSaturday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    weekStartDate: dateKeyFromDate(start),
    weekEndDate: dateKeyFromDate(end),
  };
};
