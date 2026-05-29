import React from 'react';
import { parseLocalDate, todayKey } from '../utils/dates';

const macroConfig = [
  ['protein', 'p', 'protein'],
  ['carbs', 'c', 'carbs'],
  ['fat', 'f', 'fat'],
];

function ringStyle(percent) {
  const safe = Math.min(Math.max(percent, 0), 100);
  const color = percent > 100 ? 'color-mix(in srgb, var(--danger) 76%, var(--track))' : 'var(--accent)';
  return { background: `conic-gradient(${color} ${safe}%, var(--track) ${safe}% 100%)` };
}

const dayLabel = (key, lang) => {
  const date = parseLocalDate(key);
  if (!date) return '';
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'narrow' });
};

const dayNumber = (key) => {
  const date = parseLocalDate(key);
  return date ? date.getDate() : '';
};

const rounded = (value) => Math.round(Number(value) || 0);

const balanceText = (used, target, unit, t) => {
  const difference = rounded(used) - rounded(target);
  if (difference === 0) return t.targetHit;
  const label = difference > 0 ? (t.over || 'over') : (t.left === 'lft' ? 'left' : t.left || 'left');
  const amount = Math.abs(difference);
  return `${amount}${unit} ${label}`;
};

function TodayDashboard({ t, totals, targets, streak, weekDays = [], selectedDay, today = todayKey(), lang = 'en', onSelectDay }) {
  const caloriesTarget = Number(targets?.calories || 0);
  const caloriesEaten = Number(totals.cal || 0);
  const percent = caloriesTarget ? (caloriesEaten / caloriesTarget) * 100 : 0;
  const activeDay = selectedDay || today;

  return (
    <section className="home-dashboard">
      <div className="week-strip" role="tablist" aria-label="Week">
        {weekDays.map((key) => (
          <button
            key={key}
            className={`${activeDay === key ? 'active' : ''} ${key === today ? 'today-dot' : ''}`}
            type="button"
            role="tab"
            onClick={() => onSelectDay?.(key)}
            aria-selected={activeDay === key}
          >
            <span>{dayLabel(key, lang)}</span>
            <strong>{dayNumber(key)}</strong>
          </button>
        ))}
      </div>

      <article className="calories-card">
        <div className="calories-copy">
          <span>{t.caloriesEaten}</span>
          <strong>{rounded(caloriesEaten)}</strong>
          <small>{rounded(caloriesEaten)} / {rounded(caloriesTarget)} {t.calories}</small>
          <small>{balanceText(caloriesEaten, caloriesTarget, '', t)}</small>
        </div>
        <div className="mini-ring" style={ringStyle(percent)}>
          <div>{Math.round(percent)}%</div>
        </div>
      </article>

      <div className="macro-card-grid">
        {macroConfig.map(([labelKey, valueKey, color]) => {
          const target = Number(targets[labelKey] || 0);
          const used = Number(totals[valueKey] || 0);
          const macroPercent = target ? Math.min((used / target) * 100, 100) : 0;

          return (
            <article className="macro-card" key={labelKey}>
              <div>
                <span>{t[labelKey]}</span>
                <strong>{rounded(used)}g</strong>
                <small>{balanceText(used, target, 'g', t)}</small>
              </div>
              <div className="micro-track">
                <div className={color} style={{ width: `${macroPercent}%` }} />
              </div>
            </article>
          );
        })}
      </div>

      {streak > 0 && <p className="subtle-note">{streak} {t.streak}</p>}
    </section>
  );
}

export default TodayDashboard;
