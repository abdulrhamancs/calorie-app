import React from 'react';

function ProgressBar({ label, value, target, color = 'primary' }) {
  const percent = target > 0 ? Math.min((Number(value) / Number(target)) * 100, 140) : 0;

  return (
    <div className="progress-row">
      <div className="progress-copy">
        <span>{label}</span>
        <strong>{Math.round(value)} / {Math.round(target || 0)}</strong>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className={`progress-fill ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
