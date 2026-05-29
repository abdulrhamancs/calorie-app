import React from 'react';

const options = [
  { key: 'scan', icon: '⌕', labelKey: 'scanFood', descriptionKey: 'scanFoodHint' },
  { key: 'library', icon: '▦', labelKey: 'foodLibrary', descriptionKey: 'foodLibraryHint' },
  { key: 'label', icon: '▤', labelKey: 'foodLabel', descriptionKey: 'foodLabelHint' },
  { key: 'gallery', icon: '□', labelKey: 'gallery', descriptionKey: 'galleryHint' },
  { key: 'camera', icon: '◉', labelKey: 'camera', descriptionKey: 'cameraHint' },
];

function ScanSourceSheet({ t, onClose, onSelect }) {
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="scan-source-sheet" role="dialog" aria-modal="true" aria-label={t.addMealSource} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">{t.aiScan}</p>
            <h2>{t.addMealSource}</h2>
          </div>
          <button className="icon-button sheet-close" type="button" onClick={onClose} aria-label={t.cancel}>×</button>
        </div>

        <div className="scan-source-grid">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              className="scan-source-tile"
              onClick={() => onSelect(option.key)}
            >
              <span className="source-icon" aria-hidden="true">{option.icon}</span>
              <strong>{t[option.labelKey]}</strong>
              <small>{t[option.descriptionKey]}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ScanSourceSheet;
