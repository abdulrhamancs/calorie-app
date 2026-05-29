import React from 'react';

function NavIcon({ children }) {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function HomeIcon() {
  return (
    <NavIcon>
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M9.5 20v-6h5v6" />
    </NavIcon>
  );
}

function DumbbellIcon() {
  return (
    <NavIcon>
      <path d="M5 8v8" />
      <path d="M8 6v12" />
      <path d="M16 6v12" />
      <path d="M19 8v8" />
      <path d="M8 12h8" />
      <path d="M3 10v4" />
      <path d="M21 10v4" />
    </NavIcon>
  );
}

function CheckIcon() {
  return (
    <NavIcon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.2 2.2 4.8-5" />
    </NavIcon>
  );
}

function ProgressIcon() {
  return (
    <NavIcon>
      <path d="M4 19h16" />
      <path d="M5 15.5 9.2 11l3.4 3.1L19 7.5" />
      <path d="M15.8 7.5H19v3.2" />
    </NavIcon>
  );
}

function PlusIcon() {
  return (
    <svg
      className="plus-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function BottomNavigation({ t, activeView, onChange, onAdd }) {
  return (
    <nav className="bottom-nav five-item-nav" aria-label="Primary">
      <button className={activeView === 'today' ? 'active' : ''} onClick={() => onChange('today')}>
        <span className="nav-item-content">
          <HomeIcon />
          <small>{t.home}</small>
        </span>
      </button>
      <button className={activeView === 'gym' ? 'active' : ''} onClick={() => onChange('gym')}>
        <span className="nav-item-content">
          <DumbbellIcon />
          <small>{t.gym}</small>
        </span>
      </button>
      <button className="floating-add" onClick={onAdd || (() => onChange('scan'))} aria-label={t.addMealSource || t.aiScan}>
        <PlusIcon />
      </button>
      <button className={activeView === 'checklist' ? 'active' : ''} onClick={() => onChange('checklist')}>
        <span className="nav-item-content">
          <CheckIcon />
          <small>{t.checklist || t.dailyChecklist}</small>
        </span>
      </button>
      <button className={activeView === 'weight' ? 'active' : ''} onClick={() => onChange('weight')}>
        <span className="nav-item-content">
          <ProgressIcon />
          <small>{t.progress}</small>
        </span>
      </button>
    </nav>
  );
}

export default BottomNavigation;
