import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import SettingsModal from './components/SettingsModal';
import SetupFlow from './components/SetupFlow';
import TodayDashboard from './components/TodayDashboard';
import FoodEntry from './components/FoodEntry';
import AIResultConfirmation from './components/AIResultConfirmation';
import FoodLog from './components/FoodLog';
import WeightTracker from './components/WeightTracker';
import Archive from './components/Archive';
import BottomNavigation from './components/BottomNavigation';
import MyFoods from './components/MyFoods';
import DailyChecklist from './components/DailyChecklist';
import WeeklyReport from './components/WeeklyReport';
import ScanSourceSheet from './components/ScanSourceSheet';
import GymTracker from './components/GymTracker';
import FixMyDay from './components/FixMyDay';
import CoachSummary from './components/CoachSummary';
import FoodLibraryPicker from './components/FoodLibraryPicker';
import { translations } from './constants/translations';
import { useDailyRollover } from './hooks/useDailyRollover';
import { useLocalStorage } from './hooks/useLocalStorage';
import { analyzeFixMyDayIdeas, analyzeNutrition } from './services/geminiNutrition';
import { currentWeekDays, displayDate, lastLocalDays, parseLocalDate, todayKey } from './utils/dates';
import { estimateTargets, normalizeArchiveDay, normalizeMeal, normalizeProfile, sumMeals, toStoredMeal, uid } from './utils/nutrition';
import { exportAppData, importAppData, readJSON, safeArray, writeJSON } from './utils/storage';
import { safeNumber, validateMealValues } from './utils/validation';
import { buildWeeklyWeightAverages, latestWeeklyWeightAverage } from './utils/weight';
import { normalizeGymLog, normalizeWorkoutSession } from './utils/gym';

const createImagePreview = (dataUrl) =>
  new Promise((resolve) => {
    if (!dataUrl || typeof Image === 'undefined') {
      resolve('');
      return;
    }
    const image = new Image();
    image.onload = () => {
      try {
        const size = 220;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        resolve('');
      }
    };
    image.onerror = () => resolve('');
    image.src = dataUrl;
  });

const sameGymSets = (a = [], b = []) =>
  a.length === b.length && a.every((set, index) => Number(set.weight) === Number(b[index]?.weight) && Number(set.reps) === Number(b[index]?.reps));

const gymLogMatchesSession = (log, session) => {
  const cleanLog = normalizeGymLog(log);
  const cleanSession = normalizeWorkoutSession(session);
  return cleanLog.date === cleanSession.date && cleanSession.exercises.some((exercise) => (
    exercise.exerciseId === cleanLog.exerciseId && sameGymSets(exercise.sets, cleanLog.sets)
  ));
};

function App() {
  const initialData = useDailyRollover();
  const [lang, setLang] = useState(localStorage.getItem('appLang') || 'en');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [apiKey, setApiKey] = useState(localStorage.getItem('geminiApiKey') || '');
  const [aiLimit, setAiLimit] = useState(() => Number(localStorage.getItem('aiDailyLimit') || 30));
  const [waterTarget, setWaterTarget] = useState(() => Math.min(Math.max(Number(localStorage.getItem('waterTargetLiters') || 2.5), 0.5), 8));
  const [aiCounter, setAiCounter] = useState(() => {
    const stored = readJSON('aiRequestCounter', null);
    return stored?.date === todayKey() ? stored : { date: todayKey(), count: 0 };
  });
  const [profile, setProfile] = useState(() => {
    const saved = readJSON('profile', null);
    return saved ? normalizeProfile(saved) : null;
  });
  const [targets, setTargets] = useState(() => {
    const savedTargets = readJSON('targets', null);
    return savedTargets && typeof savedTargets === 'object' ? savedTargets : null;
  });
  const [foodLog, setFoodLog] = useState(() => initialData.foods.map((food) => normalizeMeal(food)));
  const [weightHistory, setWeightHistory] = useState(() => safeArray(readJSON('weightHistory', [])));
  const [weeklyWeightAverages, setWeeklyWeightAverages] = useState(() => safeArray(readJSON('weeklyWeightAverages', [])));
  const [history, setHistory] = useState(() => safeArray(initialData.history));
  const [savedFoods, setSavedFoods] = useLocalStorage('savedFoods', []);
  const [recentMeals, setRecentMeals] = useLocalStorage('recentMeals', []);
  const [waterLog, setWaterLog] = useLocalStorage('waterLog', {});
  const [workoutLog, setWorkoutLog] = useLocalStorage('workoutLog', {});
  const [gymExercises, setGymExercises] = useLocalStorage('gymExercises', []);
  const [gymLogs, setGymLogs] = useLocalStorage('gymLogs', []);
  const [gymTemplates, setGymTemplates] = useLocalStorage('gymTemplates', []);
  const [gymSessions, setGymSessions] = useLocalStorage('gymSessions', []);
  const [currentDay, setCurrentDay] = useState(todayKey());
  const currentDayRef = useRef(currentDay);
  const [activeView, setActiveView] = useState('today');
  const [selectedHomeDay, setSelectedHomeDay] = useState(todayKey());
  const [scanSheetOpen, setScanSheetOpen] = useState(false);
  const [foodLibraryOpen, setFoodLibraryOpen] = useState(false);
  const [scanIntent, setScanIntent] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [scanState, setScanState] = useState({ loading: false, error: '' });
  const [fixDayOpen, setFixDayOpen] = useState(false);
  const [fixDayAi, setFixDayAi] = useState({ loading: false, error: '', ideas: '' });
  const [toast, setToast] = useState(initialData.note);

  const t = translations[lang];
  const isSetupDone = Boolean(profile && targets) && !editingProfile;

  useEffect(() => {
    currentDayRef.current = currentDay;
  }, [currentDay]);

  useEffect(() => {
    localStorage.setItem('appLang', lang);
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('geminiApiKey', apiKey);
    localStorage.setItem('aiDailyLimit', String(aiLimit));
    localStorage.setItem('waterTargetLiters', String(waterTarget));
    writeJSON('aiRequestCounter', aiCounter.date === todayKey() ? aiCounter : { date: todayKey(), count: 0 });
    writeJSON('foods', foodLog);
    writeJSON('weightHistory', weightHistory);
    writeJSON('weeklyWeightAverages', weeklyWeightAverages);
    writeJSON('history', history);
    if (profile) writeJSON('profile', profile);
    if (targets) writeJSON('targets', targets);
    localStorage.setItem('activeDay', currentDayRef.current);
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    document.body.dataset.theme = darkMode ? 'dark' : 'light';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang, darkMode, apiKey, aiLimit, waterTarget, aiCounter, foodLog, weightHistory, weeklyWeightAverages, history, profile, targets]);

  useEffect(() => {
    setWeeklyWeightAverages((current) => {
      const next = buildWeeklyWeightAverages(weightHistory, current);
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [weightHistory]);

  useEffect(() => {
    const refreshCurrentDay = () => setCurrentDay(todayKey());
    const interval = window.setInterval(refreshCurrentDay, 60000);
    window.addEventListener('focus', refreshCurrentDay);
    document.addEventListener('visibilitychange', refreshCurrentDay);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshCurrentDay);
      document.removeEventListener('visibilitychange', refreshCurrentDay);
    };
  }, []);

  useEffect(() => {
    const activeDay = localStorage.getItem('activeDay');
    if (!activeDay || activeDay === currentDay) return;

    setHistory((currentHistory) => {
      const alreadyArchived = safeArray(currentHistory).some((entry) => entry?.key === activeDay || entry?.date === activeDay);
      if (foodLog.length === 0 || alreadyArchived) return currentHistory;
      setToast(t.newDayArchived);
      return [
        {
          id: uid(),
          key: activeDay,
          date: displayDate(lang, parseLocalDate(activeDay) || new Date()),
          totals: sumMeals(foodLog),
          target: targets?.calories || targets?.calorieTarget || 0,
          items: foodLog,
          autoArchived: true,
        },
        ...safeArray(currentHistory),
      ];
    });
    setFoodLog([]);
    setSelectedHomeDay(currentDay);
    localStorage.setItem('activeDay', currentDay);
  }, [currentDay, foodLog, lang, targets, t.newDayArchived]);

  useEffect(() => {
    setSelectedHomeDay(currentDay);
  }, [currentDay]);

  useEffect(() => {
    if (aiCounter.date !== todayKey()) {
      setAiCounter({ date: todayKey(), count: 0 });
    }
  }, [aiCounter.date]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totals = useMemo(() => sumMeals(foodLog), [foodLog]);
  const homeWeekDays = useMemo(() => currentWeekDays(currentDay), [currentDay]);
  const normalizedSavedFoods = useMemo(() => safeArray(savedFoods).map((food) => ({ ...normalizeMeal(food, { source: 'saved' }), favorite: Boolean(food.favorite) })), [savedFoods]);
  const normalizedRecentMeals = useMemo(() => safeArray(recentMeals).map((food) => normalizeMeal(food, { source: 'recent' })), [recentMeals]);

  const selectedHomeData = useMemo(() => {
    const archiveByKey = new Map(safeArray(history).map((day) => [day?.key || day?.date, normalizeArchiveDay(day)]));
    const isToday = selectedHomeDay === currentDay;
    const archived = archiveByKey.get(selectedHomeDay);
    const items = isToday ? foodLog : safeArray(archived?.items);
    const dayTotals = isToday ? totals : archived ? { ...archived, cal: archived.calories, p: archived.protein, c: archived.carbs, f: archived.fat } : sumMeals(items);
    return {
      isToday,
      items,
      totals: dayTotals,
      label: isToday ? t.today : selectedHomeDay.slice(5),
    };
  }, [currentDay, foodLog, history, selectedHomeDay, t.today, totals]);

  const streak = useMemo(() => {
    const dates = [...new Set(safeArray(history).map((item) => item?.key).filter(Boolean))].sort().reverse();
    if (dates.length === 0) return 0;
    const today = new Date(todayKey());
    const first = new Date(dates[0]);
    if ((today - first) / 86400000 > 1) return 0;
    let count = 1;
    for (let i = 0; i < dates.length - 1; i += 1) {
      if ((new Date(dates[i]) - new Date(dates[i + 1])) / 86400000 === 1) count += 1;
      else break;
    }
    return count;
  }, [history]);

  const todayWaterMl = Number(waterLog?.[todayKey()] || 0);
  const workoutDone = Boolean(workoutLog?.[todayKey()]);
  const weightLoggedToday = safeArray(weightHistory).some((entry) => entry?.key === todayKey());
  const checklist = useMemo(() => {
    const mealLogged = foodLog.length > 0;
    const proteinTarget = Number(targets?.protein || profile?.proteinTarget || 0);
    const proteinHit = proteinTarget > 0 && totals.protein >= proteinTarget;
    const waterHit = todayWaterMl >= waterTarget * 1000;
    const coreDone = [mealLogged, proteinHit, weightLoggedToday, waterHit].filter(Boolean).length;
    return {
      mealLogged,
      proteinHit,
      weightLogged: weightLoggedToday,
      waterHit,
      coreDone,
      proteinText: `${Math.round(totals.protein)} / ${Math.round(proteinTarget)}g`,
    };
  }, [foodLog.length, profile?.proteinTarget, targets?.protein, todayWaterMl, totals.protein, waterTarget, weightLoggedToday]);

  const weeklyReport = useMemo(() => {
    const days = lastLocalDays(7);
    const archiveByKey = new Map(safeArray(history).map((day) => [day?.key || day?.date, normalizeArchiveDay(day)]));
    const proteinTarget = Number(targets?.protein || profile?.proteinTarget || 0);
    const waterTargetMl = waterTarget * 1000;
    let loggedDays = 0;
    let calorieSum = 0;
    let proteinSum = 0;
    let proteinHitDays = 0;
    let waterSumMl = 0;
    let best = { label: '', score: -1 };

    const dayRows = days.map((key) => {
      const archived = archiveByKey.get(key);
      const isToday = key === todayKey();
      const dayTotals = isToday ? totals : archived || { calories: 0, protein: 0, items: [] };
      const hasMeals = isToday ? foodLog.length > 0 : (archived?.items?.length || archived?.calories || 0) > 0;
      const protein = Number(dayTotals.protein || dayTotals.p || 0);
      const calories = Number(dayTotals.calories || dayTotals.cal || 0);
      const waterMl = Number(waterLog?.[key] || 0);
      const weightLogged = safeArray(weightHistory).some((entry) => entry?.key === key);
      const proteinHit = proteinTarget > 0 && protein >= proteinTarget;
      const waterHit = waterTargetMl > 0 && waterMl >= waterTargetMl;
      const workoutBonus = workoutLog?.[key] ? 5 : 0;
      const score = Math.min(100, (hasMeals ? 25 : 0) + (proteinHit ? 30 : 0) + (weightLogged ? 20 : 0) + (waterHit ? 25 : 0) + workoutBonus);

      if (hasMeals) {
        loggedDays += 1;
        calorieSum += calories;
        proteinSum += protein;
      }
      if (proteinHit) proteinHitDays += 1;
      waterSumMl += waterMl;
      if (score > best.score) best = { label: key.slice(5), score };

      return { key, score, hasMeals };
    });

    const sortedWeights = safeArray(weightHistory).sort((a, b) => new Date(b.createdAt || b.key) - new Date(a.createdAt || a.key));
    const latestWeight = sortedWeights[0];
    const compareWeight = sortedWeights.find((entry) => days.includes(entry?.key) && entry?.key !== latestWeight?.key) || sortedWeights[Math.min(sortedWeights.length - 1, 6)];
    const weightChange = latestWeight && compareWeight ? Number(latestWeight.value) - Number(compareWeight.value) : null;

    const latestWeekly = latestWeeklyWeightAverage(weeklyWeightAverages);
    const weeklyTrend =
      latestWeekly?.weightChangeFromPreviousWeek === null || latestWeekly?.weightChangeFromPreviousWeek === undefined
        ? null
        : Math.abs(latestWeekly.weightChangeFromPreviousWeek) < 0.1
          ? 'stable'
          : latestWeekly.weightChangeFromPreviousWeek < 0
            ? 'down'
            : 'up';

    return {
      days: dayRows,
      daysLogged: loggedDays,
      averageCalories: loggedDays ? calorieSum / loggedDays : 0,
      averageProtein: loggedDays ? proteinSum / loggedDays : 0,
      proteinHitDays,
      averageWater: waterSumMl / 7 / 1000,
      weightChange: Number.isFinite(weightChange) ? weightChange : null,
      latestWeeklyAverage: latestWeekly,
      weeklyTrend,
      bestDay: best.score > 0 ? best.label : '',
      consistencyScore: Math.round(dayRows.reduce((sum, day) => sum + day.score, 0) / 7),
    };
  }, [foodLog.length, history, profile?.proteinTarget, targets?.protein, totals, waterLog, waterTarget, weightHistory, weeklyWeightAverages, workoutLog]);

  const updateRecentMeals = (meal) => {
    const recent = normalizeMeal(meal, { source: 'recent' });
    const key = `${recent.name.toLowerCase()}-${recent.calories}-${recent.protein}-${recent.carbs}-${recent.fat}`;
    const deduped = safeArray(recentMeals).map((item) => normalizeMeal(item, { source: 'recent' })).filter((item) => `${item.name.toLowerCase()}-${item.calories}-${item.protein}-${item.carbs}-${item.fat}` !== key);
    setRecentMeals([{ ...recent, id: uid(), source: 'recent' }, ...deduped].slice(0, 20));
  };

  const addMealToToday = (meal, defaults = {}) => {
    const normalized = {
      ...normalizeMeal(meal, { ...defaults, dateKey: todayKey() }),
      id: uid(),
      createdAt: new Date().toISOString(),
      dateKey: todayKey(),
    };
    if (!validateMealValues(normalized)) {
      setScanState({ loading: false, error: t.validationError });
      return false;
    }
    setFoodLog([normalized, ...foodLog]);
    updateRecentMeals(normalized);
    setActiveView('today');
    return true;
  };

  const handleSetup = (nextProfile) => {
    const normalizedProfile = normalizeProfile(nextProfile);
    const nextTargets = estimateTargets(normalizedProfile);
    setProfile(normalizedProfile);
    setTargets(nextTargets);
    setEditingProfile(false);
    setActiveView('today');
  };

  const analyzeMeal = async ({ description, imageBase64, imageType, mealType, clarification, mode = 'quick' }) => {
    if (!description && !imageBase64) return;
    if (!apiKey.trim()) {
      setScanState({ loading: false, error: t.missingKey });
      setSettingsOpen(true);
      return;
    }
    const normalizedCounter = aiCounter.date === todayKey() ? aiCounter : { date: todayKey(), count: 0 };
    const normalizedLimit = Math.max(1, Number(aiLimit) || 30);
    if (normalizedCounter.count >= normalizedLimit) {
      setAiCounter(normalizedCounter);
      setScanState({ loading: false, error: t.aiLimitReached });
      return;
    }
    setScanState({ loading: true, error: '' });
    try {
      const parsed = await analyzeNutrition({ apiKey, description, imageBase64, imageType, clarification, mode });
      setAiCounter({ date: todayKey(), count: normalizedCounter.count + 1 });
      setAiResult({
        ...parsed,
        id: uid(),
        category: mealType,
        sourceDescription: description,
        sourceImageBase64: imageBase64,
        sourceImageType: imageType,
        mode,
      });
      setActiveView('scan');
      setScanState({ loading: false, error: '' });
    } catch (error) {
      console.error('AI nutrition analysis failed.');
      setScanState({ loading: false, error: error.message || t.aiError });
    }
  };

  const askFixMyDayAI = async (analysis) => {
    if (!apiKey.trim()) {
      setFixDayAi({ loading: false, error: t.missingKey, ideas: '' });
      setSettingsOpen(true);
      return;
    }
    const normalizedCounter = aiCounter.date === todayKey() ? aiCounter : { date: todayKey(), count: 0 };
    const normalizedLimit = Math.max(1, Number(aiLimit) || 30);
    if (normalizedCounter.count >= normalizedLimit) {
      setAiCounter(normalizedCounter);
      setFixDayAi({ loading: false, error: t.aiLimitReached, ideas: '' });
      return;
    }
    setFixDayAi({ loading: true, error: '', ideas: '' });
    try {
      const ideas = await analyzeFixMyDayIdeas({
        apiKey,
        lang,
        context: {
          caloriesEaten: Math.round(totals.calories),
          calorieTarget: targets?.calories || 0,
          proteinEaten: Math.round(totals.protein),
          proteinTarget: targets?.protein || 0,
          carbsEaten: Math.round(totals.carbs),
          carbsTarget: targets?.carbs || 0,
          fatEaten: Math.round(totals.fat),
          fatTarget: targets?.fat || 0,
          waterMl: todayWaterMl,
          waterTargetLiters: waterTarget,
          workoutDone,
          mealsLogged: foodLog.map((meal) => ({ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat })),
          deterministicAnalysis: analysis,
        },
      });
      setAiCounter({ date: todayKey(), count: normalizedCounter.count + 1 });
      setFixDayAi({ loading: false, error: '', ideas });
    } catch (error) {
      console.error('Fix My Day AI ideas failed.');
      setFixDayAi({ loading: false, error: error.message || t.aiError, ideas: '' });
    }
  };

  const confirmAIResult = async (result) => {
    const mealName = result.items.map((item) => item.name).join(', ') || result.sourceDescription || 'AI meal';
    const firstItem = result.items[0] || {};
    const imagePreview = result.imagePreview || await createImagePreview(result.sourceImageBase64);
    const meal = toStoredMeal(
      {
        name: mealName,
        category: result.category,
        calories: result.totals.calories,
        protein: result.totals.protein,
        carbs: result.totals.carbs,
        fat: result.totals.fat,
        quantity: firstItem.quantity || 1,
        unit: firstItem.unit || 'serving',
        confidence: result.confidence,
        source: 'ai',
        notes: result.items.map((item) => item.notes).filter(Boolean).join(' '),
        items: result.items,
        imagePreview,
      },
      { source: 'ai', confidence: result.confidence }
    );

    if (addMealToToday(meal)) {
      setAiResult(null);
    }
  };

  const updateFood = (food) => {
    const clean = normalizeMeal(food);
    if (!validateMealValues(clean)) {
      setScanState({ loading: false, error: t.validationError });
      return;
    }
    setFoodLog(foodLog.map((item) => (item.id === food.id ? clean : item)));
  };

  const logWeight = (value) => {
    const weight = safeNumber(value);
    if (weight < 20 || weight > 300) return false;
    setWeightHistory([
      {
        id: uid(),
        key: todayKey(),
        date: new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB'),
        value: weight,
        createdAt: new Date().toISOString(),
      },
      ...weightHistory,
    ]);
    return true;
  };

  const archiveToday = () => {
    if (foodLog.length === 0 || !targets) return;
    setHistory([
      {
        id: uid(),
        key: todayKey(),
        date: displayDate(lang),
        totals,
        target: targets.calories,
        items: foodLog,
      },
      ...history,
    ]);
    setFoodLog([]);
    setActiveView('archive');
  };

  const saveFood = (meal) => {
    const normalized = normalizeMeal(meal, { source: 'saved', confidence: 'manual' });
    if (!validateMealValues(normalized)) return false;
    setSavedFoods([{ ...normalized, favorite: Boolean(meal.favorite) }, ...safeArray(savedFoods)]);
    return true;
  };

  const updateSavedFood = (meal) => {
    const normalized = normalizeMeal(meal, { source: 'saved', confidence: 'manual' });
    if (!validateMealValues(normalized)) return false;
    setSavedFoods(safeArray(savedFoods).map((item) => (item.id === meal.id ? { ...item, ...normalized, favorite: item.favorite } : item)));
    return true;
  };

  const toggleFavorite = (food) => {
    const safeSavedFoods = safeArray(savedFoods);
    const exists = safeSavedFoods.some((item) => item.id === food.id);
    if (exists) {
      setSavedFoods(safeSavedFoods.map((item) => (item.id === food.id ? { ...item, favorite: !item.favorite } : item)));
    } else {
      setSavedFoods([{ ...normalizeMeal(food, { source: 'saved', confidence: 'manual' }), favorite: true }, ...safeSavedFoods]);
    }
  };

  const handleExportData = (options) => {
    const payload = exportAppData(options);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kit-backup-${todayKey()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm(t.importWarning)) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (payload?.data && Object.prototype.hasOwnProperty.call(payload.data, 'geminiApiKey') && apiKey) {
        const importedKey = String(payload.data.geminiApiKey || '');
        if (importedKey !== apiKey && !window.confirm(t.replaceApiKeyWarning)) {
          payload.data = { ...payload.data };
          delete payload.data.geminiApiKey;
        }
      }
      importAppData(payload);
      window.location.reload();
    } catch (error) {
      console.error('Kit data import failed.');
      setToast(t.importError);
    }
  };

  const openScanSource = () => setScanSheetOpen(true);

  const selectScanSource = (type) => {
    setScanSheetOpen(false);
    if (type === 'library') {
      setActiveView('scan');
      setFoodLibraryOpen(true);
      return;
    }
    setActiveView('scan');
    setScanIntent({ type, id: uid() });
  };

  return (
    <div className={`app-shell ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      {toast && <div className="toast-note">{toast}</div>}
      {!isSetupDone ? (
        <SetupFlow
          t={t}
          lang={lang}
          darkMode={darkMode}
          initialProfile={profile}
          onToggleTheme={setDarkMode}
          onLanguage={setLang}
          onComplete={handleSetup}
        />
      ) : (
        <>
          <main className="mobile-frame">
            <header className="topbar">
              <div>
                <p className="eyebrow">{t.greeting}</p>
                <h1>{t.appName}</h1>
              </div>
              <div className="topbar-actions">
                {streak > 0 && <span className="streak">{streak} {t.streak}</span>}
                <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label={t.settings}>⚙</button>
              </div>
            </header>

            {activeView === 'today' && (
              <>
                <TodayDashboard
                  t={t}
                  totals={selectedHomeData.totals}
                  targets={targets}
                  streak={selectedHomeData.isToday ? streak : 0}
                  weekDays={homeWeekDays}
                  selectedDay={selectedHomeDay}
                  today={currentDay}
                  lang={lang}
                  onSelectDay={setSelectedHomeDay}
                />
                {selectedHomeData.isToday && (
                  <FixMyDay
                    t={t}
                    open={fixDayOpen}
                    totals={totals}
                    targets={targets}
                    waterMl={todayWaterMl}
                    waterTarget={waterTarget}
                    checklist={checklist}
                    workoutDone={workoutDone}
                    meals={foodLog}
                    aiIdeas={fixDayAi.ideas}
                    aiLoading={fixDayAi.loading}
                    aiError={fixDayAi.error}
                    onOpen={() => setFixDayOpen(true)}
                    onClose={() => setFixDayOpen(false)}
                    onAskAI={askFixMyDayAI}
                  />
                )}
                <FoodLog
                  t={t}
                  foodLog={selectedHomeData.items}
                  selectedLabel={selectedHomeData.label}
                  readOnly={!selectedHomeData.isToday}
                  onUpdate={updateFood}
                  onRemove={(id) => setFoodLog(foodLog.filter((item) => item.id !== id))}
                  onArchive={() => setActiveView('archive')}
                />
              </>
            )}

            {activeView === 'checklist' && (
              <div className="checklist-screen">
                <DailyChecklist
                  t={t}
                  checklist={checklist}
                  waterTarget={waterTarget}
                  waterMl={todayWaterMl}
                  workoutDone={workoutDone}
                  onAddWater={(ml) => setWaterLog({ ...(waterLog || {}), [todayKey()]: Math.max(0, todayWaterMl + ml) })}
                  onResetWater={() => {
                    if (window.confirm(t.resetWaterConfirm)) {
                      setWaterLog({ ...(waterLog || {}), [todayKey()]: 0 });
                    }
                  }}
                  onToggleWorkout={() => setWorkoutLog({ ...(workoutLog || {}), [todayKey()]: !workoutDone })}
                />
              </div>
            )}

            {activeView === 'scan' && (
              <>
                <FoodEntry t={t} loading={scanState.loading} error={scanState.error} sourceIntent={scanIntent} onAnalyze={analyzeMeal} onManualAdd={(meal) => addMealToToday(meal, { source: 'manual', confidence: 'manual' })} />
                {aiResult && (
                  <AIResultConfirmation
                    t={t}
                    result={aiResult}
                    onAnalyze={analyzeMeal}
                    onCancel={() => setAiResult(null)}
                    onConfirm={confirmAIResult}
                  />
                )}
                <MyFoods
                  t={t}
                  savedFoods={normalizedSavedFoods}
                  recentMeals={normalizedRecentMeals}
                  onAdd={(meal) => addMealToToday(meal, { source: meal.source === 'recent' ? 'recent' : 'saved', confidence: meal.confidence || 'manual' })}
                  onSave={saveFood}
                  onUpdate={updateSavedFood}
                  onDelete={(id) => setSavedFoods(safeArray(savedFoods).filter((item) => item.id !== id))}
                  onFavorite={toggleFavorite}
                />
              </>
            )}

            {activeView === 'weight' && (
              <div className="progress-screen">
                <WeightTracker t={t} profile={profile} history={weightHistory} weeklyAverages={weeklyWeightAverages} lang={lang} onLog={logWeight} onRemove={(id) => setWeightHistory(weightHistory.filter((item) => item.id !== id))} />
                <CoachSummary
                  t={t}
                  totals={totals}
                  targets={targets}
                  checklist={checklist}
                  workoutDone={workoutDone}
                  mealsLogged={foodLog.length > 0}
                />
                <WeeklyReport t={t} report={weeklyReport} />
              </div>
            )}

            {activeView === 'gym' && (
              <GymTracker
                t={t}
                exercises={safeArray(gymExercises)}
                logs={safeArray(gymLogs)}
                templates={safeArray(gymTemplates)}
                sessions={safeArray(gymSessions)}
                onSaveExercise={(exercise) => setGymExercises([exercise, ...safeArray(gymExercises)])}
                onRemoveExercise={(id) => {
                  setGymExercises(safeArray(gymExercises).filter((exercise) => exercise.id !== id));
                  setGymLogs(safeArray(gymLogs).filter((log) => log.exerciseId !== id));
                  setGymTemplates(safeArray(gymTemplates).map((template) => ({
                    ...template,
                    exercises: safeArray(template.exercises).filter((exercise) => exercise.exerciseId !== id),
                    updatedAt: new Date().toISOString(),
                  })));
                }}
                onSaveLog={(log) => setGymLogs((current) => [log, ...safeArray(current)])}
                onRemoveLog={(id) => setGymLogs(safeArray(gymLogs).filter((log) => log.id !== id))}
                onSaveTemplate={(template) => setGymTemplates((current) => [template, ...safeArray(current).filter((item) => item.id !== template.id)])}
                onRemoveTemplate={(id) => setGymTemplates(safeArray(gymTemplates).filter((template) => template.id !== id))}
                onSaveSession={(session) => setGymSessions((current) => [session, ...safeArray(current)])}
                onRemoveSession={(session) => {
                  setGymSessions((current) => safeArray(current).filter((item) => item.id !== session.id));
                  setGymLogs((current) => safeArray(current).filter((log) => {
                    const cleanLog = normalizeGymLog(log);
                    return cleanLog.sessionId ? cleanLog.sessionId !== session.id : !gymLogMatchesSession(log, session);
                  }));
                }}
              />
            )}

            {activeView === 'archive' && <Archive t={t} history={history} foodLog={foodLog} onArchiveToday={archiveToday} onRemove={(id, index) => setHistory(history.filter((item, itemIndex) => (id ? item.id !== id : itemIndex !== index)))} />}
          </main>

          <BottomNavigation t={t} activeView={activeView} onChange={setActiveView} onAdd={openScanSource} />
          {scanSheetOpen && <ScanSourceSheet t={t} onClose={() => setScanSheetOpen(false)} onSelect={selectScanSource} />}
          {foodLibraryOpen && (
            <FoodLibraryPicker
              t={t}
              savedFoods={normalizedSavedFoods}
              recentMeals={normalizedRecentMeals}
              onClose={() => setFoodLibraryOpen(false)}
              onAdd={(meal) => addMealToToday(meal, { source: meal.source || 'saved', confidence: 'manual' })}
              onSave={saveFood}
              onFavorite={toggleFavorite}
            />
          )}
        </>
      )}

      {settingsOpen && (
        <SettingsModal
          t={t}
          lang={lang}
          darkMode={darkMode}
          apiKey={apiKey}
          aiUsage={aiCounter.date === todayKey() ? aiCounter.count : 0}
          aiLimit={aiLimit}
          waterTarget={waterTarget}
          onApiKey={setApiKey}
          onAiLimit={(value) => setAiLimit(Math.max(1, Number(value) || 30))}
          onWaterTarget={(value) => setWaterTarget(Math.min(Math.max(Number(value) || 2.5, 0.5), 8))}
          onLanguage={setLang}
          onTheme={setDarkMode}
          onClose={() => setSettingsOpen(false)}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onEditProfile={() => {
            setSettingsOpen(false);
            setEditingProfile(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
