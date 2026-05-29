import React, { useMemo, useState } from 'react';
import { UNITS } from '../utils/nutrition';
import { clamp } from '../utils/validation';

function AIResultConfirmation({ t, result, onAnalyze, onCancel, onConfirm }) {
  const [draft, setDraft] = useState(result);
  const [clarification, setClarification] = useState('');
  const [editing, setEditing] = useState(false);
  const mealName = draft.items.map((item) => item.name).filter(Boolean).join(', ') || draft.sourceDescription || t.aiScan;
  const primaryNote = draft.items.map((item) => item.notes || item.reasoningNote).filter(Boolean)[0];
  const resultTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const invalid = useMemo(
    () =>
      draft.items.length === 0 ||
      draft.totals.calories < 0 ||
      draft.totals.calories > 5000 ||
      ['protein', 'carbs', 'fat'].some((key) => draft.totals[key] < 0 || draft.totals[key] > 500),
    [draft]
  );

  const recalcTotals = (items) =>
    items.reduce(
      (sum, item) => ({
        calories: sum.calories + Number(item.calories || 0),
        protein: sum.protein + Number(item.protein || 0),
        carbs: sum.carbs + Number(item.carbs || 0),
        fat: sum.fat + Number(item.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const updateItem = (id, key, value) => {
    const nextItems = draft.items.map((item) => {
      if (item.id !== id) return item;
      if (key === 'name') return { ...item, name: value };
      if (key === 'unit') return { ...item, unit: value };
      if (key === 'quantity') return { ...item, quantity: clamp(value, 0, 5000) };
      const max = key === 'calories' ? 5000 : 500;
      return { ...item, [key]: clamp(value, 0, max) };
    });
    const totals = recalcTotals(nextItems);
    setDraft((current) => ({ ...current, items: nextItems, totals: { ...totals, cal: totals.calories, p: totals.protein, c: totals.carbs, f: totals.fat } }));
  };

  const askAgain = () => {
    onAnalyze({
      description: draft.sourceDescription,
      imageBase64: draft.sourceImageBase64,
      imageType: draft.sourceImageType,
      mealType: draft.category,
      clarification,
      mode: draft.mode,
    });
  };

  return (
    <section className={`card confirmation-card ${draft.confidence === 'low' ? 'uncertain-card' : ''}`}>
      <div className="ai-result-hero">
        {draft.sourceImageBase64 ? (
          <img className="ai-result-photo" src={draft.sourceImageBase64} alt="" />
        ) : (
          <div className="ai-result-placeholder" aria-hidden="true">
            <span>+</span>
          </div>
        )}
        <div className="ai-result-overlay">
          <p className={`confidence ${draft.confidence}`}>{t.confidence}: {draft.confidence}</p>
        </div>
      </div>

      <div className="ai-result-summary">
        <div>
          <p className="eyebrow">{resultTime}</p>
          <h2 dir="auto">{mealName}</h2>
        </div>
        <div className="ai-calorie-total">
          <strong>{draft.totals.calories}</strong>
          <span>{t.calories}</span>
        </div>
      </div>

      {draft.needsUserClarification && draft.clarifyingQuestion && (
        <div className="clarification-box">
          <strong>{t.question}</strong>
          <p>{draft.clarifyingQuestion}</p>
          <input dir="auto" value={clarification} onChange={(e) => setClarification(e.target.value)} placeholder={t.clarificationPlaceholder} />
          <button className="secondary-action compact" onClick={askAgain}>{t.analyzeMeal}</button>
        </div>
      )}

      <div className="ai-macro-grid">
        <div><span>{t.protein}</span><strong>{draft.totals.protein}g</strong></div>
        <div><span>{t.carbs}</span><strong>{draft.totals.carbs}g</strong></div>
        <div><span>{t.fat}</span><strong>{draft.totals.fat}g</strong></div>
      </div>

      {primaryNote && (
        <div className="reasoning-card">
          <span>{t.reasoning}</span>
          <p>{primaryNote}</p>
        </div>
      )}

      {editing && (
        <div className="result-items edit-result-panel">
          {draft.items.map((item) => (
            <article key={item.id} className="result-item">
              <label className="field"><span>{t.name}</span><input dir="auto" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} /></label>
              <div className="two-column">
                <label className="field"><span>{t.quantity}</span><input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} /></label>
                <label className="field"><span>{t.unit}</span>
                  <select value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)}>
                    {UNITS.map((unit) => <option value={unit} key={unit}>{unit}</option>)}
                  </select>
                </label>
              </div>
              <div className="macro-editor compact-grid">
                <label><span>{t.calories}</span><input type="number" value={item.calories} onChange={(e) => updateItem(item.id, 'calories', e.target.value)} /></label>
                <label><span>{t.protein}</span><input type="number" value={item.protein} onChange={(e) => updateItem(item.id, 'protein', e.target.value)} /></label>
                <label><span>{t.carbs}</span><input type="number" value={item.carbs} onChange={(e) => updateItem(item.id, 'carbs', e.target.value)} /></label>
                <label><span>{t.fat}</span><input type="number" value={item.fat} onChange={(e) => updateItem(item.id, 'fat', e.target.value)} /></label>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft.warnings.length > 0 && <p className="warning-text">{t.warnings}: {draft.warnings.join(' ')}</p>}
      {invalid && <p className="error-text">{t.validationError}</p>}

      <div className="action-row">
        <button className="secondary-action" onClick={onCancel}>{t.cancel}</button>
        <button className="secondary-action" onClick={() => setEditing((value) => !value)}>{editing ? t.done : t.fixResults}</button>
        <button className="primary-action" disabled={invalid} onClick={() => onConfirm(draft)}>{t.done || t.confirm}</button>
      </div>
    </section>
  );
}

export default AIResultConfirmation;
