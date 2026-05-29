import React from 'react';

const round = (value) => Math.round(Number(value) || 0);

const statusLine = (used, target, unit, t) => {
  const diff = round(target) - round(used);
  if (diff === 0) return t.targetHit;
  return diff > 0 ? `${Math.abs(diff)}${unit} ${t.left}` : `${Math.abs(diff)}${unit} ${t.over}`;
};

const buildFixMyDay = ({ t, totals, targets, waterMl, waterTarget, checklist, workoutDone, meals }) => {
  const calories = round(totals.calories ?? totals.cal);
  const protein = round(totals.protein ?? totals.p);
  const carbs = round(totals.carbs ?? totals.c);
  const fat = round(totals.fat ?? totals.f);
  const calorieTarget = round(targets?.calories);
  const proteinTarget = round(targets?.protein);
  const carbsTarget = round(targets?.carbs);
  const fatTarget = round(targets?.fat);
  const caloriesLeft = calorieTarget - calories;
  const waterLeftMl = Math.max(0, Math.round((Number(waterTarget) || 0) * 1000 - Number(waterMl || 0)));

  const proteinLow = proteinTarget > 0 && protein < proteinTarget * 0.8;
  const proteinHit = proteinTarget > 0 && protein >= proteinTarget;
  const fatHigh = fatTarget > 0 && fat >= fatTarget * 0.9;
  const fatOver = fatTarget > 0 && fat > fatTarget;
  const carbsOver = carbsTarget > 0 && carbs > carbsTarget;
  const waterLow = waterLeftMl > 0;
  const caloriesOver = calorieTarget > 0 && calories > calorieTarget;
  const caloriesHeavilyOver = calorieTarget > 0 && calories > calorieTarget + Math.max(150, calorieTarget * 0.08);
  const caloriesNearFull = calorieTarget > 0 && caloriesLeft <= Math.max(150, calorieTarget * 0.08) && caloriesLeft >= 0;
  const noMeals = !meals?.length;
  const proteinClose = proteinTarget > 0 && protein >= proteinTarget * 0.9;
  const dayComplete = Boolean(
    checklist?.mealLogged
    && (checklist?.proteinHit || proteinClose)
    && checklist?.waterHit
    && checklist?.weightLogged
    && !caloriesHeavilyOver
  );

  let badge = t.onTrack;
  let badgeKey = 'on-track';
  if (caloriesOver) {
    badge = t.caloriesHigh;
    badgeKey = 'calories-high';
  }
  else if (proteinLow) {
    badge = t.needsProtein;
    badgeKey = 'needs-protein';
  }
  else if (waterLow) {
    badge = t.waterLow;
    badgeKey = 'water-low';
  }
  else if (dayComplete) {
    badge = t.dayComplete;
    badgeKey = 'day-complete';
  }

  let overall = t.fixOverallOnTrack;
  if (noMeals) overall = t.fixOverallNoMeals;
  else if (caloriesOver) overall = t.fixOverallCaloriesHigh;
  else if (proteinLow) overall = t.fixOverallProteinLow;
  else if (dayComplete) overall = t.fixOverallComplete;
  else if (proteinHit && !caloriesNearFull && !fatOver) overall = t.fixOverallStrong;
  else if (caloriesNearFull && !proteinHit) overall = t.fixOverallLightProtein;

  const observations = [
    statusLine(calories, calorieTarget, '', t).replace(/^/, `${t.calories}: `),
    statusLine(protein, proteinTarget, 'g', t).replace(/^/, `${t.protein}: `),
  ];
  if (fatOver || fatHigh) observations.push(`${t.fat}: ${statusLine(fat, fatTarget, 'g', t)}`);
  if (carbsOver) observations.push(`${t.carbs}: ${statusLine(carbs, carbsTarget, 'g', t)}`);
  if (waterLow) observations.push(`${t.water}: ${Math.ceil(waterLeftMl / 250) * 250}ml ${t.left}`);

  const suggestions = [];
  if (noMeals) suggestions.push(t.fixSuggestionLogMeal);
  if (caloriesOver) suggestions.push(t.fixSuggestionOverCalories);
  if (!caloriesOver && proteinLow && caloriesLeft > 100) suggestions.push(t.fixSuggestionLeanProtein);
  if (fatOver || fatHigh) suggestions.push(t.fixSuggestionAvoidFat);
  if (caloriesNearFull && !proteinHit) suggestions.push(t.fixSuggestionLightProtein);
  if (proteinHit && !caloriesOver && !fatOver) suggestions.push(t.fixSuggestionOnTrack);
  if (waterLow) suggestions.push(t.fixSuggestionWater);
  if (!workoutDone) suggestions.push(t.fixSuggestionWorkout);

  const missing = [];
  if (!checklist?.mealLogged) missing.push(t.caloriesLogged);
  if (!checklist?.proteinHit) missing.push(t.proteinTargetHit);
  if (!checklist?.weightLogged) missing.push(t.weightLogged);
  if (!checklist?.waterHit) missing.push(t.waterLogged);

  let mealIdea = t.fixMealIdeaBalanced;
  if (caloriesOver) mealIdea = t.fixMealIdeaOver;
  else if (fatOver || fatHigh) mealIdea = t.fixMealIdeaLowFat;
  else if (proteinLow) mealIdea = t.fixMealIdeaProtein;

  return {
    badge,
    badgeKey,
    overall,
    observations: observations.slice(0, 4),
    suggestions: suggestions.slice(0, 4),
    missing,
    mealIdea,
  };
};

function FixMyDay({ t, open, totals, targets, waterMl, waterTarget, checklist, workoutDone, meals, aiIdeas, aiLoading, aiError, onOpen, onClose, onAskAI }) {
  const analysis = buildFixMyDay({ t, totals, targets, waterMl, waterTarget, checklist, workoutDone, meals });

  return (
    <>
      <article className="fix-day-card">
        <div>
          <strong>{t.fixMyDay}</strong>
          <small className={`day-status-badge ${analysis.badgeKey}`}>{analysis.badge}</small>
          <span>{t.fixMyDayHint}</span>
        </div>
        <button type="button" onClick={onOpen}>{t.fixMyDay}</button>
      </article>

      {open && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card fix-day-modal" role="dialog" aria-modal="true" aria-label={t.fixMyDay}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">{analysis.badge}</p>
                <h2>{t.fixMyDay}</h2>
              </div>
              <button className="icon-button" type="button" onClick={onClose} aria-label={t.cancel}>×</button>
            </div>
            <small className={`day-status-badge ${analysis.badgeKey}`}>{analysis.badge}</small>

            <div className="fix-day-summary">
              <strong>{t.overall}: {analysis.overall}</strong>
            </div>

            <div className="fix-day-section">
              <h3>{t.observations}</h3>
              {analysis.observations.map((item) => <p key={item}>{item}</p>)}
              {analysis.missing.length > 0 && <p>{t.missing}: {analysis.missing.join(', ')}</p>}
            </div>

            <div className="fix-day-section">
              <h3>{t.suggestions}</h3>
              {analysis.suggestions.map((item) => <p key={item}>{item}</p>)}
            </div>

            <div className="fix-day-section meal-idea">
              <h3>{t.mealIdea}</h3>
              <p>{analysis.mealIdea}</p>
            </div>

            <button className="primary-action" type="button" onClick={() => onAskAI(analysis)} disabled={aiLoading}>
              {aiLoading ? t.analyzing : t.askAiMealIdeas}
            </button>
            {aiError && <p className="error-text">{aiError}</p>}
            {aiIdeas && <div className="fix-day-ai" dir="auto">{aiIdeas}</div>}
          </section>
        </div>
      )}
    </>
  );
}

export default FixMyDay;
