export const readJSON = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const safeArray = (value) => (Array.isArray(value) ? value : []);

export const APP_STORAGE_KEYS = [
  'appLang',
  'darkMode',
  'geminiApiKey',
  'aiDailyLimit',
  'aiRequestCounter',
  'waterTargetLiters',
  'waterLog',
  'workoutLog',
  'activeDay',
  'profile',
  'targets',
  'foods',
  'history',
  'weightHistory',
  'weeklyWeightAverages',
  'gymExercises',
  'gymLogs',
  'gymTemplates',
  'gymSessions',
  'gymDraftSession',
  'savedFoods',
  'recentMeals',
];

export const exportAppData = ({ includeApiKey = false } = {}) => {
  const data = {};
  APP_STORAGE_KEYS.forEach((key) => {
    if (key === 'geminiApiKey' && !includeApiKey) return;
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });

  return {
    app: 'Kit',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
};

export const importAppData = (payload) => {
  if (!payload || typeof payload !== 'object' || !payload.data || typeof payload.data !== 'object') {
    throw new Error('Invalid Kit backup file.');
  }

  APP_STORAGE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload.data, key)) {
      localStorage.setItem(key, String(payload.data[key]));
    }
  });
};
