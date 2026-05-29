import React, { useState } from 'react';
import EmptyStateIcon from './EmptyStateIcon';

const meals = [
  ['Breakfast', 'breakfast'],
  ['Lunch', 'lunch'],
  ['Dinner', 'dinner'],
  ['Snack', 'snack'],
];

const formatMealTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sourceLabel = (food) => {
  if (food.source === 'ai') return 'AI';
  if (food.source === 'manual') return 'Manual';
  if (food.source === 'saved') return 'Saved';
  if (food.source === 'recent') return 'Recent';
  return '';
};

function FoodLog({ t, foodLog, selectedLabel, readOnly = false, onUpdate, onRemove, onArchive }) {
  const [editing, setEditing] = useState(null);

  const startEdit = (food) => setEditing({ ...food });
  const update = (key, value) => setEditing((current) => ({ ...current, [key]: value }));
  const save = () => {
    onUpdate(editing);
    setEditing(null);
  };

  return (
    <section className="recent-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.today}</p>
          <h2>{selectedLabel ? `${t.recentlyEaten} - ${selectedLabel}` : t.recentlyEaten}</h2>
        </div>
        {!readOnly && <button type="button" onClick={onArchive}>{t.archive}</button>}
      </div>

      {foodLog.length === 0 && (
        <div className="empty-state">
          <EmptyStateIcon type="food" />
          <p>{t.emptyLog}</p>
        </div>
      )}

      {meals.map(([meal, key]) => {
        const foods = foodLog.filter((food) => food.category === meal);
        if (foods.length === 0) return null;

        return (
          <div key={meal} className="meal-group">
            <h3>{t[key]}</h3>
            {foods.map((food) => (
              <article key={food.id} className={`food-card ${food.imagePreview ? 'with-thumbnail' : ''}`}>
                {editing?.id === food.id && !readOnly ? (
                  <>
                    <input dir="auto" value={editing.name} onChange={(e) => update('name', e.target.value)} />
                    <div className="macro-editor compact-grid">
                      <label><span>{t.calories}</span><input type="number" value={editing.calories} onChange={(e) => update('calories', e.target.value)} /></label>
                      <label><span>{t.protein}</span><input type="number" value={editing.protein} onChange={(e) => update('protein', e.target.value)} /></label>
                      <label><span>{t.carbs}</span><input type="number" value={editing.carbs} onChange={(e) => update('carbs', e.target.value)} /></label>
                      <label><span>{t.fat}</span><input type="number" value={editing.fat} onChange={(e) => update('fat', e.target.value)} /></label>
                    </div>
                    <div className="action-row">
                      <button className="secondary-action" onClick={() => setEditing(null)}>{t.cancel}</button>
                      <button className="primary-action" onClick={save}>{t.save}</button>
                    </div>
                  </>
                ) : (
                  <>
                    {food.imagePreview && <img className="meal-thumb" src={food.imagePreview} alt="" onError={(event) => event.currentTarget.remove()} />}
                    <div className="food-main">
                      <div className="food-copy" dir="auto">
                        <strong>{food.name}</strong>
                        <div className="meal-meta-row">
                          {food.confidence && food.confidence !== 'manual' && <span className={`meal-confidence ${food.confidence}`}>{food.confidence}</span>}
                          {sourceLabel(food) && <span className="meal-source">{sourceLabel(food)}</span>}
                          {formatMealTime(food.createdAt) && <small>{formatMealTime(food.createdAt)}</small>}
                        </div>
                      </div>
                      <b dir="ltr">{food.calories}</b>
                    </div>
                    <div className="macro-pills">
                      <span className="protein" dir="ltr">{food.protein}g {t.protein}</span>
                      <span className="carbs" dir="ltr">{food.carbs}g {t.carbs}</span>
                      <span className="fat" dir="ltr">{food.fat}g {t.fat}</span>
                    </div>
                    {!readOnly && (
                      <div className="inline-actions">
                        <button onClick={() => startEdit(food)}>{t.edit}</button>
                        <button onClick={() => onRemove(food.id)}>{t.remove}</button>
                      </div>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        );
      })}
    </section>
  );
}

export default FoodLog;
