import React, { useState } from 'react';
import EmptyStateIcon from './EmptyStateIcon';

const validNumber = (value, max) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= max;
};

const isDraftValid = (draft) =>
  Boolean(String(draft.name || '').trim()) &&
  validNumber(draft.calories, 5000) &&
  validNumber(draft.protein, 500) &&
  validNumber(draft.carbs, 500) &&
  validNumber(draft.fat, 500);

function FoodLibraryCard({ t, food, canEdit, onAdd, onFavorite, onEdit, onDelete }) {
  return (
    <article className={`food-card ${food.imagePreview ? 'with-thumbnail' : ''}`}>
      {food.imagePreview && <img className="meal-thumb" src={food.imagePreview} alt="" onError={(event) => event.currentTarget.remove()} />}
      <div className="food-main">
        <div className="food-copy" dir="auto">
          <strong>{food.name}</strong>
          <div className="meal-meta-row">
            <span className="meal-source">{food.source === 'recent' ? 'Recent' : 'Saved'}</span>
          </div>
        </div>
        <b dir="ltr">{food.calories}</b>
      </div>
      <div className="macro-pills">
        <span className="protein">{food.protein}g {t.protein}</span>
        <span className="carbs">{food.carbs}g {t.carbs}</span>
        <span className="fat">{food.fat}g {t.fat}</span>
      </div>
      <div className="inline-actions">
        <button className="library-add" onClick={() => onAdd(food)}>{t.add}</button>
        <button onClick={() => onFavorite(food)}>{food.favorite ? t.unfavorite : t.favorite}</button>
        {canEdit && <button onClick={() => onEdit(food)}>{t.edit}</button>}
        {canEdit && <button onClick={() => onDelete(food.id)}>{t.remove}</button>}
      </div>
    </article>
  );
}

function MyFoods({ t, savedFoods, recentMeals, onAdd, onSave, onUpdate, onDelete, onFavorite }) {
  const [tab, setTab] = useState('myFoods');
  const [draft, setDraft] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const sortedFoods = [...savedFoods].sort((a, b) => Number(b.favorite) - Number(a.favorite));
  const favorites = sortedFoods.filter((food) => food.favorite);
  const list = tab === 'favorites' ? favorites : tab === 'recentMeals' ? recentMeals : sortedFoods;
  const draftValid = isDraftValid(draft);

  const saveDraft = () => {
    if (!draftValid) {
      setError(t.validationError);
      return;
    }
    const payload = { ...draft, id: editingId };
    if (editingId) onUpdate(payload);
    else onSave(payload);
    setDraft({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setEditingId(null);
    setError('');
  };

  const edit = (food) => {
    setEditingId(food.id);
    setDraft(food);
    setTab('myFoods');
  };

  return (
    <section className="card">
      <div className="section-title">
        <p className="eyebrow">{t.libraries}</p>
        <h2>{t.myFoods}</h2>
      </div>

      <div className="segmented">
        {['myFoods', 'favorites', 'recentMeals'].map((key) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{t[key]}</button>
        ))}
      </div>

      {tab === 'myFoods' && (
        <div className="library-editor">
          <label className="field"><span>{t.name}</span><input dir="auto" placeholder="Chicken rice bowl" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <div className="macro-editor compact-grid">
            <label><span>{t.calories}</span><input type="number" placeholder="650" value={draft.calories} onChange={(e) => setDraft({ ...draft, calories: e.target.value })} /></label>
            <label><span>{t.protein} (g)</span><input type="number" placeholder="45" value={draft.protein} onChange={(e) => setDraft({ ...draft, protein: e.target.value })} /></label>
            <label><span>{t.carbs} (g)</span><input type="number" placeholder="70" value={draft.carbs} onChange={(e) => setDraft({ ...draft, carbs: e.target.value })} /></label>
            <label><span>{t.fat} (g)</span><input type="number" placeholder="18" value={draft.fat} onChange={(e) => setDraft({ ...draft, fat: e.target.value })} /></label>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="secondary-action" disabled={!draftValid} onClick={saveDraft}>{editingId ? t.save : t.saveFood}</button>
        </div>
      )}

      <div className="list-stack">
        {list.length === 0 ? (
          <div className="empty-state compact-empty"><EmptyStateIcon type="library" /><p>{t.emptyLog}</p></div>
        ) : (
          list.map((food) => (
            <FoodLibraryCard
              key={food.id}
              t={t}
              food={food}
              canEdit={tab !== 'recentMeals'}
              onAdd={onAdd}
              onFavorite={onFavorite}
              onEdit={edit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default MyFoods;
