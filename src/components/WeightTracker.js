import React, { useMemo, useState } from 'react';
import { daysBetween, parseLocalDate, todayKey } from '../utils/dates';
import { safeNumber } from '../utils/validation';
import EmptyStateIcon from './EmptyStateIcon';

const formatKg = (value) => {
  const number = safeNumber(value);
  return `${Number.isInteger(number) ? number : number.toFixed(1)} kg`;
};

const clampPercent = (value) => Math.max(0, Math.min(value, 100));

const arabicChartEmpty = '\u0633\u062c\u0644 \u0648\u0632\u0646\u0643 \u0639\u0634\u0627\u0646 \u064a\u0638\u0647\u0631 \u0644\u0643 \u0627\u0644\u0631\u0633\u0645 \u0627\u0644\u0628\u064a\u0627\u0646\u064a.';
const arabicMoreEntries = '\u0623\u0636\u0641 \u0642\u064a\u0627\u0633\u0627\u062a \u0623\u0643\u062b\u0631 \u0639\u0634\u0627\u0646 \u064a\u0638\u0647\u0631 \u0627\u0644\u0627\u062a\u062c\u0627\u0647.';

const toDate = (value) => parseLocalDate(value) || new Date(value);

const formatChartDate = (value, lang = 'en') => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return value || '';
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
};

const formatSignedKg = (value) => {
  if (!Number.isFinite(Number(value))) return '';
  const number = Number(value);
  const rounded = Number.isInteger(number) ? number : number.toFixed(1);
  return `${number > 0 ? '+' : ''}${rounded} kg`;
};

const getEntryKey = (item) => {
  if (item.key) return item.key;
  if (item.date && /^\d{4}-\d{2}-\d{2}/.test(item.date)) return item.date.slice(0, 10);
  if (item.createdAt) return String(item.createdAt).slice(0, 10);
  return '';
};

const getChartEntries = (history) => history
  .map((item, index) => {
    const key = getEntryKey(item);
    const value = safeNumber(item.value);
    return {
      id: item.id || `${key}-${value}-${index}`,
      key,
      createdAt: item.createdAt || key,
      value,
      originalIndex: index,
    };
  })
  .filter((item) => item.value > 0 && item.key)
  .sort((a, b) => {
    const dateDiff = new Date(a.createdAt || a.key) - new Date(b.createdAt || b.key);
    return dateDiff || a.originalIndex - b.originalIndex;
  });

function WeightProgressChart({ history, goalWeight, lang, t }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [range, setRange] = useState('30');
  const isArabic = lang === 'ar';

  const chart = useMemo(() => {
    const entries = getChartEntries(history);
    const today = toDate(todayKey());
    const filtered = entries.filter((entry) => {
      if (range === 'all') return true;
      const date = toDate(entry.key);
      if (Number.isNaN(date.getTime()) || Number.isNaN(today.getTime())) return true;
      return daysBetween(entry.key, todayKey()) <= Number(range) - 1;
    });

    if (filtered.length === 0) return { points: [], labels: [], path: '', target: null, high: null, low: null, yTicks: [] };

    const goal = safeNumber(goalWeight);
    const values = filtered.map((item) => item.value);
    const includeTarget = goal > 0 && filtered.length > 1;
    const scaleValues = includeTarget ? [...values, goal] : values;
    const minValue = Math.min(...scaleValues);
    const maxValue = Math.max(...scaleValues);
    const padding = Math.max((maxValue - minValue) * 0.2, 1);
    const min = minValue - padding;
    const max = maxValue + padding;
    const rangeValue = max - min || 1;
    const toY = (value) => 100 - ((value - min) / rangeValue) * 100;
    const points = filtered.map((item, index) => {
      const x = filtered.length === 1 ? 50 : (index / (filtered.length - 1)) * 100;
      const previous = index > 0 ? filtered[index - 1] : null;
      return {
        ...item,
        index,
        x,
        y: toY(item.value),
        change: previous ? item.value - previous.value : null,
      };
    });
    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const labelIndexes = new Set();
    const uniqueDates = new Set(points.map((point) => point.key));
    const maxLabels = Math.min(4, uniqueDates.size);
    const step = Math.max(1, Math.ceil(points.length / maxLabels));
    points.forEach((point, index) => {
      if (uniqueDates.size === 1) {
        if (index === 0) labelIndexes.add(point.index);
      } else if (index === 0 || index === points.length - 1 || index % step === 0) {
        labelIndexes.add(point.index);
      }
    });
    const high = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
    const low = points.reduce((best, point) => (point.value < best.value ? point : best), points[0]);
    const yTicks = [max, (max + min) / 2, min].map((value) => ({ value, y: toY(value) }));

    return {
      points,
      labels: points.filter((point) => labelIndexes.has(point.index)),
      path,
      target: includeTarget ? { value: goal, y: toY(goal) } : null,
      high,
      low,
      yTicks,
    };
  }, [goalWeight, history, range]);

  const activePoint = activeIndex === null ? null : chart.points[activeIndex];
  const tooltipStyle = activePoint
    ? {
        left: `${Math.min(Math.max(activePoint.x, 16), 84)}%`,
        top: `${Math.min(Math.max(activePoint.y, 14), 86)}%`,
      }
    : undefined;
  const rangeOptions = [
    { key: '7', label: isArabic ? '\u0667 \u0623\u064a\u0627\u0645' : '7D' },
    { key: '30', label: isArabic ? '\u0663\u0660 \u064a\u0648\u0645' : '30D' },
    { key: 'all', label: isArabic ? '\u0627\u0644\u0643\u0644' : 'All' },
  ];
  const targetLabel = isArabic ? '\u0627\u0644\u0647\u062f\u0641' : 'Target';
  const highestLabel = isArabic ? '\u0623\u0639\u0644\u0649' : 'Highest';
  const lowestLabel = isArabic ? '\u0623\u0642\u0644' : 'Lowest';
  const changeLabel = isArabic ? '\u0627\u0644\u062a\u063a\u064a\u0631' : 'Change';

  return (
    <div className="weight-chart-card">
      <div className="weight-chart-head">
        <div>
          <span>{t.trend}</span>
          <strong>{isArabic ? '\u062a\u0637\u0648\u0631 \u0627\u0644\u0648\u0632\u0646' : 'Weight trend'}</strong>
        </div>
        <div className="weight-range-tabs" aria-label={t.trend}>
          {rangeOptions.map((option) => (
            <button key={option.key} type="button" className={range === option.key ? 'active' : ''} onClick={() => { setRange(option.key); setActiveIndex(null); }}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {chart.points.length === 0 ? (
        <div className="empty-state compact-empty">
          <EmptyStateIcon type="chart" />
          <p>{isArabic ? arabicChartEmpty : 'Log weight entries to see your progress chart.'}</p>
        </div>
      ) : (
        <>
          <div className="weight-chart-plot" onMouseLeave={() => setActiveIndex(null)}>
            <div className="weight-y-axis" aria-hidden="true">
              {chart.yTicks.map((tick) => <span key={tick.y} style={{ top: `${tick.y}%` }}>{formatKg(tick.value).replace(' kg', '')}</span>)}
            </div>
            <div className="weight-plot-area">
              <svg className="weight-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={t.trend}>
                {chart.yTicks.map((tick) => <line key={tick.y} className="chart-grid-line" x1="0" x2="100" y1={tick.y} y2={tick.y} />)}
                {chart.target && (
                  <line className="weight-target-line" x1="0" x2="100" y1={chart.target.y} y2={chart.target.y} />
                )}
                {chart.points.length > 1 && <path className="weight-chart-line-shadow" d={chart.path} />}
                {chart.points.length > 1 && <path className="weight-chart-line" d={chart.path} />}
              </svg>
              {chart.target && (
                <span className="weight-target-label" style={{ top: `${Math.min(Math.max(chart.target.y, 10), 90)}%` }}>
                  {targetLabel} {formatKg(chart.target.value)}
                </span>
              )}
              {chart.points.map((point) => {
                const isHigh = chart.points.length > 1 && chart.high?.index === point.index && chart.high?.index !== chart.low?.index;
                const isLow = chart.points.length > 1 && chart.low?.index === point.index && chart.high?.index !== chart.low?.index;
                return (
                  <button
                    key={point.id}
                    type="button"
                    className={`weight-chart-dot ${activeIndex === point.index ? 'active' : ''} ${isHigh ? 'high' : ''} ${isLow ? 'low' : ''}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    aria-label={`${formatKg(point.value)} ${point.key}`}
                    onMouseEnter={() => setActiveIndex(point.index)}
                    onFocus={() => setActiveIndex(point.index)}
                    onClick={() => setActiveIndex(activeIndex === point.index ? null : point.index)}
                  />
                );
              })}
              {activePoint && (
                <div className="weight-chart-tooltip" style={tooltipStyle}>
                  <strong>{formatKg(activePoint.value)}</strong>
                  <span>{activePoint.key}</span>
                  {activePoint.change !== null && <small>{changeLabel}: {formatSignedKg(activePoint.change)}</small>}
                </div>
              )}
              <div className="weight-chart-labels" aria-hidden="true">
                {chart.labels.map((point) => (
                  <span key={`${point.id}-label`} style={{ left: `${point.x}%` }}>{formatChartDate(point.key, lang)}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="weight-chart-summary">
            {chart.points.length === 1 ? (
              <span>{isArabic ? arabicMoreEntries : 'Add more entries to see your trend.'}</span>
            ) : (
              <>
                <span>{highestLabel}: {formatKg(chart.high.value)}</span>
                <span>{lowestLabel}: {formatKg(chart.low.value)}</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const formatWeekRange = (startKey, endKey, lang = 'en') => {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  const options = { month: 'short', day: 'numeric' };
  const start = parseLocalDate(startKey);
  const end = parseLocalDate(endKey);
  if (!start || !end) return startKey || '';
  return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
};

const formatWeeklyChange = (change, t) => {
  if (change === null || change === undefined || !Number.isFinite(Number(change))) return t.noPreviousWeekData;
  const value = Number(change);
  return `${value > 0 ? '+' : ''}${value.toFixed(1)} kg ${t.fromPreviousWeek}`;
};

function WeightTracker({ t, history, profile, weeklyAverages = [], lang = 'en', onLog, onRemove }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const sorted = [...history].sort((a, b) => new Date(b.createdAt || b.key) - new Date(a.createdAt || a.key));
    const latest = sorted[0];
    const current = latest ? safeNumber(latest.value) : safeNumber(profile?.currentWeight);
    const starting = history.length > 0 ? safeNumber([...history].sort((a, b) => new Date(a.createdAt || a.key) - new Date(b.createdAt || b.key))[0].value) : safeNumber(profile?.currentWeight);
    const goal = safeNumber(profile?.goalWeight);
    const goalType = profile?.goal || 'maintain';
    const weekCompare = sorted.find((entry) => Math.abs(daysBetween(entry.key || entry.createdAt, todayKey())) >= 7) || sorted[Math.min(sorted.length - 1, 6)];
    const weeklyChange = weekCompare && latest ? current - safeNumber(weekCompare.value) : null;
    const totalChange = current - starting;
    const validWeights = current > 0 && starting > 0 && goal > 0;
    const hasGoalDistance = Math.abs(starting - goal) > 0.05;
    let percent = null;
    let remaining = null;
    const isMaintain = goalType === 'maintain';

    if (validWeights && isMaintain) {
      const drift = Math.abs(current - starting);
      percent = clampPercent(100 - Math.min((drift / Math.max(starting * 0.03, 1)) * 100, 100));
      remaining = Math.abs(current - goal);
    } else if (validWeights && hasGoalDistance && goalType === 'lose' && starting > goal) {
      percent = clampPercent(((starting - current) / (starting - goal)) * 100);
      remaining = Math.max(current - goal, 0);
    } else if (validWeights && hasGoalDistance && goalType === 'gain' && goal > starting) {
      percent = clampPercent(((current - starting) / (goal - starting)) * 100);
      remaining = Math.max(goal - current, 0);
    }

    return { current, starting, goal, weeklyChange, totalChange, percent, remaining, isMaintain, hasData: validWeights && (history.length > 0 || Boolean(profile)) };
  }, [history, profile]);

  const submit = () => {
    if (onLog(value)) {
      setValue('');
      setError('');
    } else {
      setError(t.validationError);
    }
  };

  return (
    <section className="card">
      <div className="section-title">
        <p className="eyebrow">{t.progress}</p>
        <h2>{t.logWeight}</h2>
      </div>

      {stats.hasData ? (
        <>
          <div className="progress-grid">
            <div className="metric-strip"><span>{t.currentWeight}</span><strong>{formatKg(stats.current)}</strong></div>
            <div className="metric-strip"><span>{t.startingWeight}</span><strong>{formatKg(stats.starting)}</strong></div>
            <div className="metric-strip"><span>{t.goalWeight}</span><strong>{formatKg(stats.goal)}</strong></div>
            <div className="metric-strip"><span>{t.weeklyChange}</span><strong>{stats.weeklyChange === null ? '-' : `${stats.weeklyChange > 0 ? '+' : ''}${stats.weeklyChange.toFixed(1)} kg`}</strong></div>
            <div className="metric-strip"><span>{t.totalChange}</span><strong>{stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)} kg</strong></div>
            <div className="metric-strip"><span>{t.remaining}</span><strong>{stats.remaining === null ? '-' : formatKg(stats.remaining)}</strong></div>
          </div>
          {stats.percent === null ? (
            <div className="empty-state compact-empty"><EmptyStateIcon type="chart" /><p>{t.notEnoughData}</p></div>
          ) : (
            <div className="metric-strip progress-estimate"><span>{stats.isMaintain ? t.maintain : t.estimatedProgress}</span><strong>{Math.round(stats.percent)}%</strong></div>
          )}
        </>
      ) : (
        <div className="empty-state"><EmptyStateIcon type="chart" /><p>{t.notEnoughData}</p></div>
      )}

      <div className="input-row">
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={t.weightPlaceholder} />
        <button className="primary-action" onClick={submit}>{t.save}</button>
      </div>
      {error && <p className="error-text">{error}</p>}

      <WeightProgressChart history={history} goalWeight={profile?.goalWeight} lang={lang} t={t} />

      <div className="weekly-average-section">
        <div className="section-title compact-title">
          <p className="eyebrow">{t.weight}</p>
          <h2>{t.weeklyWeightAverages}</h2>
        </div>
        {weeklyAverages.length > 0 ? (
          <div className="weekly-average-list">
            {weeklyAverages.map((week) => (
              <article className="weekly-average-card" key={week.id || week.weekStartDate}>
                <div className="weekly-average-top">
                  <div>
                    <strong>{formatWeekRange(week.weekStartDate, week.weekEndDate, lang)}</strong>
                    <span>{week.daysLogged}/7 {t.daysLogged}</span>
                  </div>
                  <b>{Number(week.averageWeight).toFixed(1)} kg</b>
                </div>
                <div className="weekly-average-meta">
                  <span className={week.isCompleteWeek ? 'complete' : ''}>{week.isCompleteWeek ? t.completeWeek : t.partialWeek}</span>
                  <span>{formatWeeklyChange(week.weightChangeFromPreviousWeek, t)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty"><EmptyStateIcon type="stats" /><p>{t.noWeeklyAveragesYet}</p></div>
        )}
      </div>

      <div className="list-stack">
        {history.map((item) => (
          <article className="history-row" key={item.id}>
            <div><strong>{item.value} kg</strong><span>{item.date}</span></div>
            <button onClick={() => onRemove(item.id)}>{t.remove}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default WeightTracker;
