import React from 'react';

function EmptyStateIcon({ type = 'info' }) {
  const icons = {
    gym: (
      <>
        <path d="M5 9v6" />
        <path d="M8 7v10" />
        <path d="M16 7v10" />
        <path d="M19 9v6" />
        <path d="M8 12h8" />
      </>
    ),
    chart: (
      <>
        <path d="M4 18h16" />
        <path d="M5 14.5 9 11l3 2.5L19 7" />
        <path d="M15.8 7H19v3.2" />
      </>
    ),
    stats: (
      <>
        <path d="M5 17V11" />
        <path d="M12 17V7" />
        <path d="M19 17v-4" />
        <path d="M4 19h16" />
      </>
    ),
    insight: (
      <>
        <path d="M12 4v2" />
        <path d="M12 18v2" />
        <path d="M4 12h2" />
        <path d="M18 12h2" />
        <path d="m7.8 7.8 1.4 1.4" />
        <path d="m14.8 14.8 1.4 1.4" />
        <path d="m16.2 7.8-1.4 1.4" />
        <path d="m9.2 14.8-1.4 1.4" />
      </>
    ),
    food: (
      <>
        <path d="M7 4v16" />
        <path d="M5 4v5a2 2 0 0 0 4 0V4" />
        <path d="M16 4c1.7 1.4 2.5 3.1 2.5 5.2 0 2-1 3.5-2.5 4.1V20" />
      </>
    ),
    library: (
      <>
        <path d="M5 6.5h14" />
        <path d="M5 12h14" />
        <path d="M5 17.5h14" />
        <path d="M8 6.5v11" />
      </>
    ),
    history: (
      <>
        <path d="M12 6v6l4 2" />
        <path d="M5 6a9 9 0 1 1-1.5 9" />
        <path d="M5 6H2.5V3.5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="7" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),
  };

  return (
    <strong className="empty-state-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {icons[type] || icons.info}
      </svg>
    </strong>
  );
}

export default EmptyStateIcon;
