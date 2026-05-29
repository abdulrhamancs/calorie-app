import React, { useEffect, useRef, useState } from 'react';
import { MEAL_TYPES } from '../utils/nutrition';

function FoodEntry({ t, loading, error, sourceIntent, onAnalyze, onManualAdd }) {
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('Breakfast');
  const [imageBase64, setImageBase64] = useState('');
  const [imageType, setImageType] = useState('');
  const [imageName, setImageName] = useState('');
  const [mode, setMode] = useState('quick');
  const [entryMode, setEntryMode] = useState('ai');
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const fileInputRef = useRef(null);
  const canAnalyze = Boolean(description.trim() || imageBase64);

  useEffect(() => {
    if (!sourceIntent?.type) return;
    setEntryMode('ai');
    if (sourceIntent.type === 'label') {
      setDescription(t.foodLabelPrompt);
      window.setTimeout(() => fileInputRef.current?.click(), 80);
    }
    if (sourceIntent.type === 'gallery' || sourceIntent.type === 'camera') {
      window.setTimeout(() => fileInputRef.current?.click(), 80);
    }
  }, [sourceIntent, t.foodLabelPrompt]);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    setImageType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const submitAI = () => {
    onAnalyze({ description, imageBase64, imageType, mealType, mode });
  };

  const submitManual = () => {
    if (onManualAdd({ ...manual, category: mealType })) {
      setManual({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    }
  };

  const mealLabel = (meal) => t[meal.toLowerCase()] || meal;

  return (
    <>
      <section className="card scan-card">
        <div className="section-title">
          <p className="eyebrow">{t.aiScan}</p>
          <h2>{t.scan}</h2>
        </div>

        <div className="segmented">
          <button className={entryMode === 'ai' ? 'active' : ''} onClick={() => setEntryMode('ai')}>{t.aiScan}</button>
          <button className={entryMode === 'manual' ? 'active' : ''} onClick={() => setEntryMode('manual')}>{t.manualEntry}</button>
        </div>

        <div className="meal-tabs">
          {MEAL_TYPES.map((meal) => <button key={meal} className={mealType === meal ? 'active' : ''} onClick={() => setMealType(meal)}>{mealLabel(meal)}</button>)}
        </div>

        {entryMode === 'ai' ? (
          <>
            <div className="segmented">
              <button className={mode === 'quick' ? 'active' : ''} onClick={() => setMode('quick')}>{t.quickEstimate}</button>
              <button className={mode === 'strict' ? 'active' : ''} onClick={() => setMode('strict')}>{t.strictEstimate}</button>
            </div>

            <textarea rows="4" dir="auto" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.mealDescription} />

            <div className={`upload-row ${imageBase64 ? 'has-image' : ''}`}>
              <label className="upload-button scan-upload-tile">
                <input ref={fileInputRef} type="file" accept="image/*" capture={sourceIntent?.type === 'camera' ? 'environment' : undefined} onChange={handleUpload} />
                <span>□</span>
                {t.uploadPhoto}
              </label>
              {imageName && <span className="file-name">{imageName}</span>}
            </div>

            {imageBase64 && <img className="scan-preview" src={imageBase64} alt="" />}
            {!canAnalyze && <p className="helper-text">Enter a meal description or upload a photo to analyze.</p>}
            {error && <p className="error-text">{error}</p>}

            <button className={`primary-action ${loading ? 'is-loading' : ''}`} disabled={loading || !canAnalyze} onClick={submitAI}>
              {loading ? t.analyzing : t.analyzeMeal}
            </button>
            {loading && (
              <div className="ai-loading-panel" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
          </>
        ) : (
          <>
            <label className="field"><span>{t.name}</span><input dir="auto" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} /></label>
            <div className="macro-editor compact-grid">
              <label><span>{t.calories}</span><input type="number" value={manual.calories} onChange={(e) => setManual({ ...manual, calories: e.target.value })} /></label>
              <label><span>{t.protein}</span><input type="number" value={manual.protein} onChange={(e) => setManual({ ...manual, protein: e.target.value })} /></label>
              <label><span>{t.carbs}</span><input type="number" value={manual.carbs} onChange={(e) => setManual({ ...manual, carbs: e.target.value })} /></label>
              <label><span>{t.fat}</span><input type="number" value={manual.fat} onChange={(e) => setManual({ ...manual, fat: e.target.value })} /></label>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="primary-action" onClick={submitManual}>{t.confirm}</button>
          </>
        )}
      </section>
    </>
  );
}

export default FoodEntry;
