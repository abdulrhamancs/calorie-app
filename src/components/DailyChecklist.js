import React from 'react';

function ChecklistRow({ done, label, detail, bonus }) {
  return (
    <div className={`checklist-row ${done ? 'done' : ''}`}>
      <span className="check-indicator">{done ? '✓' : '○'}</span>
      <div>
        <strong>{label}</strong>
        <small>{detail}{bonus ? ` · ${bonus}` : ''}</small>
      </div>
    </div>
  );
}

function DailyChecklist({ t, checklist, waterTarget, waterMl, onAddWater, onResetWater, workoutDone, onToggleWorkout }) {
  return (
    <section className="card checklist-card">
      <div className="section-title">
        <p className="eyebrow">{t.today}</p>
        <h2>{t.dailyChecklist}</h2>
      </div>

      <p className="subtle-note">{checklist.coreDone}/4 {t.coreTasksCompleted}</p>

      <div className="checklist-list">
        <ChecklistRow done={checklist.mealLogged} label={t.caloriesLogged} detail={checklist.mealLogged ? t.eaten : t.emptyLog} />
        <ChecklistRow done={checklist.proteinHit} label={t.proteinTargetHit} detail={checklist.proteinText} />
        <ChecklistRow done={checklist.weightLogged} label={t.weightLogged} detail={checklist.weightLogged ? t.save : t.weightPlaceholder} />
        <ChecklistRow done={checklist.waterHit} label={t.waterLogged} detail={`${(waterMl / 1000).toFixed(2)} / ${waterTarget}L`} />
        <button className={`checklist-row workout-toggle ${workoutDone ? 'done' : ''}`} onClick={onToggleWorkout}>
          <span className="check-indicator">{workoutDone ? '✓' : '+'}</span>
          <div>
            <strong>{t.workoutDone}</strong>
            <small>{t.bonus}</small>
          </div>
        </button>
      </div>

      <div className="water-actions" aria-label={t.addWater}>
        <button onClick={() => onAddWater(-500)} aria-label={t.removeWater}>-500ml</button>
        <button onClick={() => onAddWater(-250)} aria-label={t.removeWater}>-250ml</button>
        <button onClick={() => onAddWater(250)}>+250ml</button>
        <button onClick={() => onAddWater(500)}>+500ml</button>
        <button onClick={() => onAddWater(1000)}>+1L</button>
        <button className="water-reset" onClick={onResetWater}>{t.resetWater}</button>
      </div>
    </section>
  );
}

export default DailyChecklist;
