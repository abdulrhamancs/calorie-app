import React, { useEffect, useState } from 'react';

const maskApiKey = (key = '') => {
  const trimmed = key.trim();
  if (!trimmed) return '';
  return `${trimmed.slice(0, 4)}${'•'.repeat(8)}`;
};

function SettingsModal({ t, lang, darkMode, apiKey, aiUsage, aiLimit, waterTarget, onApiKey, onAiLimit, onWaterTarget, onLanguage, onTheme, onClose, onEditProfile, onExportData, onImportData }) {
  const [apiKeyDraft, setApiKeyDraft] = useState(apiKey || '');
  const [apiStatus, setApiStatus] = useState('');
  const [includeApiKeyBackup, setIncludeApiKeyBackup] = useState(false);

  useEffect(() => {
    setApiKeyDraft(apiKey || '');
  }, [apiKey]);

  const saveApiKey = () => {
    const trimmed = apiKeyDraft.trim();
    if (!trimmed) return;
    onApiKey(trimmed);
    setApiKeyDraft(trimmed);
    setApiStatus(t.apiKeySaved);
  };

  const clearApiKey = () => {
    if (!apiKey || !window.confirm(t.clearApiKeyConfirm)) return;
    onApiKey('');
    setApiKeyDraft('');
    setApiStatus('');
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={t.settings}>
        <div className="modal-header">
          <h2>{t.settings}</h2>
          <button className="icon-button" onClick={onClose} aria-label={t.cancel}>×</button>
        </div>

        <label className="field">
          <span>{t.apiKey}</span>
          <input type="password" value={apiKeyDraft} onChange={(event) => { setApiKeyDraft(event.target.value); setApiStatus(''); }} placeholder="AIza..." autoComplete="off" />
          <small className="api-key-helper">
            {t.apiKeyHelper}{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
              {t.getApiKey}
            </a>
          </small>
          <small className="api-key-helper">{t.apiKeyDeviceOnly}</small>
          {apiKey && <small className="api-key-status">{t.saved}: {maskApiKey(apiKey)}</small>}
          {apiStatus && <small className="api-key-success">{apiStatus}</small>}
          <div className="api-key-actions">
            <button className="secondary-action" type="button" onClick={saveApiKey} disabled={!apiKeyDraft.trim()}>{t.saveApiKey}</button>
            <button className="secondary-action" type="button" onClick={clearApiKey} disabled={!apiKey}>{t.clearApiKey}</button>
          </div>
        </label>

        <div className="setting-group">
          <span>{t.aiRequestsUsed}: {aiUsage} / {aiLimit}</span>
          <label className="field">
            <span>{t.aiDailyLimit}</span>
            <input type="number" min="1" max="999" value={aiLimit} onChange={(event) => onAiLimit(event.target.value)} />
          </label>
        </div>

        <div className="setting-group">
          <label className="field">
            <span>{t.waterTarget}</span>
            <input type="number" min="0.5" max="8" step="0.1" value={waterTarget} onChange={(event) => onWaterTarget(event.target.value)} />
          </label>
        </div>

        <div className="setting-group">
          <span>{t.language}</span>
          <div className="segmented">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => onLanguage('en')}>English</button>
            <button className={lang === 'ar' ? 'active' : ''} onClick={() => onLanguage('ar')}>العربية</button>
          </div>
        </div>

        <div className="setting-group">
          <span>{t.theme}</span>
          <div className="segmented">
            <button className={!darkMode ? 'active' : ''} onClick={() => onTheme(false)}>{t.light}</button>
            <button className={darkMode ? 'active' : ''} onClick={() => onTheme(true)}>{t.dark}</button>
          </div>
        </div>

        <div className="setting-group">
          <span>{t.exportData}</span>
          <label className="setting-toggle">
            <input type="checkbox" checked={includeApiKeyBackup} onChange={(event) => setIncludeApiKeyBackup(event.target.checked)} />
            <span>{t.includeApiKeyBackup}</span>
          </label>
          <small className="api-key-helper">{t.includeApiKeyWarning}</small>
          <div className="action-row">
            <button className="secondary-action" onClick={() => onExportData({ includeApiKey: includeApiKeyBackup })}>{t.exportData}</button>
            <label className="secondary-action import-action">
              {t.importData}
              <input type="file" accept="application/json,.json" onChange={onImportData} />
            </label>
          </div>
        </div>

        <button className="secondary-action" onClick={onEditProfile}>{t.editProfile}</button>
      </section>
    </div>
  );
}

export default SettingsModal;
