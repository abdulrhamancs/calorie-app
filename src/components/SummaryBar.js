import React from 'react';
import ProgressBar from './ProgressBar';

function SummaryBar({ t, totals, targets }) {
  if (!targets) return null;

  return (
    <aside className="summary-bar">
      <ProgressBar label={t.calories} value={totals.cal} target={targets.calories} color={totals.cal > targets.calories ? 'danger' : 'calories'} />
      <div className="macro-mini-grid">
        <ProgressBar label={t.protein} value={totals.p} target={targets.protein} color="protein" />
        <ProgressBar label={t.carbs} value={totals.c} target={targets.carbs} color="carbs" />
        <ProgressBar label={t.fat} value={totals.f} target={targets.fat} color="fat" />
      </div>
    </aside>
  );
}

export default SummaryBar;
