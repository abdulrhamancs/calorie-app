import React, { useMemo, useState } from 'react';
import { estimateTargets, normalizeProfile } from '../utils/nutrition';
import { validateProfile } from '../utils/validation';

const defaultProfile = normalizeProfile({});

function SetupFlow({ t, lang, darkMode, initialProfile, onToggleTheme, onLanguage, onComplete }) {
  const [profile, setProfile] = useState(normalizeProfile(initialProfile || defaultProfile));
  const [error, setError] = useState('');
  const suggested = useMemo(() => estimateTargets(profile), [profile]);

  const update = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const submit = () => {
    const normalized = normalizeProfile(profile);
    if (!validateProfile(normalized)) {
      setError(t.profileValidationError);
      return;
    }
    setError('');
    onComplete(normalized);
  };

  return (
    <main className="setup-screen">
      <div className="setup-top">
        <div>
          <p className="eyebrow">{t.appName}</p>
          <h1>{t.onboardingTitle}</h1>
        </div>
        <div className="setup-switches">
          <button onClick={() => onLanguage(lang === 'en' ? 'ar' : 'en')}>{lang === 'en' ? 'ع' : 'EN'}</button>
          <button onClick={() => onToggleTheme(!darkMode)}>{darkMode ? t.light : t.dark}</button>
        </div>
      </div>

      <section className="setup-card">
        <div className="two-column">
          <label className="field"><span>{t.age}</span><input type="number" value={profile.age} onChange={(e) => update('age', e.target.value)} /></label>
          <label className="field"><span>{t.height}</span><input type="number" value={profile.height} onChange={(e) => update('height', e.target.value)} /></label>
          <label className="field"><span>{t.currentWeight}</span><input type="number" value={profile.currentWeight} onChange={(e) => update('currentWeight', e.target.value)} /></label>
          <label className="field"><span>{t.goalWeight}</span><input type="number" value={profile.goalWeight} onChange={(e) => update('goalWeight', e.target.value)} /></label>
        </div>

        <div className="setting-group">
          <span>{t.activity}</span>
          <div className="segmented">
            {['low', 'moderate', 'high'].map((level) => <button key={level} className={profile.activity === level ? 'active' : ''} onClick={() => update('activity', level)}>{t[level]}</button>)}
          </div>
        </div>

        <div className="setting-group">
          <span>{t.goal}</span>
          <div className="segmented">
            <button className={profile.goal === 'lose' ? 'active' : ''} onClick={() => update('goal', 'lose')}>{t.lose}</button>
            <button className={profile.goal === 'maintain' ? 'active' : ''} onClick={() => update('goal', 'maintain')}>{t.maintain}</button>
            <button className={profile.goal === 'gain' ? 'active' : ''} onClick={() => update('goal', 'gain')}>{t.gain}</button>
          </div>
        </div>

        <div className="two-column">
          <label className="field target-field">
            <span>{t.calorieTarget}</span>
            <input type="number" value={profile.calorieTarget} onChange={(e) => update('calorieTarget', e.target.value)} />
            <small>{t.suggested}: {suggested.suggestedCalories}</small>
          </label>
          <label className="field target-field">
            <span>{t.proteinTarget}</span>
            <input type="number" value={profile.proteinTarget} onChange={(e) => update('proteinTarget', e.target.value)} />
            <small>{t.suggested}: {suggested.suggestedProtein}g</small>
          </label>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="primary-action" onClick={submit}>{t.finishSetup}</button>
      </section>
    </main>
  );
}

export default SetupFlow;
