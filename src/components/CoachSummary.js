import React, { useMemo } from 'react';
import EmptyStateIcon from './EmptyStateIcon';

const capList = (items) => items.filter(Boolean).slice(0, 3);

function CoachSummary({ t, totals, targets, checklist, workoutDone, mealsLogged }) {
  const summary = useMemo(() => {
    const calories = Number(totals?.calories || 0);
    const protein = Number(totals?.protein || 0);
    const calorieTarget = Number(targets?.calories || 0);
    const proteinTarget = Number(targets?.protein || 0);
    const proteinLeft = Math.max(0, Math.round(proteinTarget - protein));
    const caloriesControlled = calorieTarget > 0 && calories > 0 && calories <= calorieTarget * 1.05;
    const proteinClose = proteinTarget > 0 && protein >= proteinTarget * 0.9;

    const score = Math.min(100,
      (caloriesControlled ? 25 : 0)
      + (proteinClose ? 25 : 0)
      + (checklist?.waterHit ? 15 : 0)
      + (checklist?.weightLogged ? 10 : 0)
      + (workoutDone ? 15 : 0)
      + (mealsLogged ? 10 : 0));

    const good = capList([
      caloriesControlled && t.coachGoodCalories,
      proteinClose && t.coachGoodProtein,
      checklist?.waterHit && t.coachGoodWater,
      checklist?.weightLogged && t.coachGoodWeight,
      workoutDone && t.coachGoodWorkout,
      mealsLogged && t.coachGoodMeals,
    ]);

    const needsWork = capList([
      !mealsLogged && t.coachNeedMeals,
      calorieTarget > 0 && calories > calorieTarget * 1.05 && t.coachNeedCalories,
      proteinTarget > 0 && !proteinClose && `${t.coachNeedProtein} ${proteinLeft}g`,
      !checklist?.waterHit && t.coachNeedWater,
      !checklist?.weightLogged && t.coachNeedWeight,
      !workoutDone && t.coachNeedWorkout,
    ]);

    let tomorrow = t.coachTomorrowLogBasics;
    if (proteinTarget > 0 && !proteinClose) tomorrow = t.coachTomorrowProtein;
    else if (!checklist?.waterHit) tomorrow = t.coachTomorrowWater;
    else if (!checklist?.weightLogged) tomorrow = t.coachTomorrowWeight;
    else if (calorieTarget > 0 && calories > calorieTarget * 1.05) tomorrow = t.coachTomorrowCalories;

    return { score, good, needsWork, tomorrow, hasData: mealsLogged || checklist?.waterHit || checklist?.weightLogged || workoutDone };
  }, [checklist, mealsLogged, t, targets, totals, workoutDone]);

  return (
    <section className="card coach-card">
      <div className="section-title compact-title">
        <p className="eyebrow">{t.progress}</p>
        <h2>{t.coach}</h2>
      </div>
      {!summary.hasData ? (
        <div className="empty-state compact-empty">
          <EmptyStateIcon type="insight" />
          <p>{t.coachEmpty}</p>
        </div>
      ) : (
        <>
          <div className="coach-score">
            <span>{t.todayScore}</span>
            <strong>{summary.score}/100</strong>
          </div>
          <div className="coach-columns">
            <div>
              <h3>{t.good}</h3>
              {summary.good.length ? summary.good.map((item) => <p key={item}>{item}</p>) : <p>{t.coachGoodNone}</p>}
            </div>
            <div>
              <h3>{t.needsWork}</h3>
              {summary.needsWork.length ? summary.needsWork.map((item) => <p key={item}>{item}</p>) : <p>{t.coachNeedNone}</p>}
            </div>
          </div>
          <div className="coach-tomorrow">
            <span>{t.tomorrow}</span>
            <strong>{summary.tomorrow}</strong>
          </div>
        </>
      )}
    </section>
  );
}

export default CoachSummary;
