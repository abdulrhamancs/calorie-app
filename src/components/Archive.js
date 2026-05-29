import React from 'react';
import { normalizeArchiveDay } from '../utils/nutrition';
import EmptyStateIcon from './EmptyStateIcon';

function Archive({ t, history = [], foodLog = [], onArchiveToday, onRemove }) {
  return (
    <section className="card">
      <div className="section-title">
        <p className="eyebrow">{t.archive}</p>
        <h2>{t.history || t.archive}</h2>
      </div>

      {foodLog.length > 0 && <button className="archive-button" onClick={onArchiveToday}>{t.archiveToday}</button>}

      {history.length === 0 && <div className="empty-state"><EmptyStateIcon type="history" /><p>{t.emptyArchive}</p></div>}

      <div className="list-stack">
        {history.map((day, index) => {
          const normalized = normalizeArchiveDay(day);
          const key = day?.id || `${normalized.date}-${index}`;

          return (
            <article className="archive-card" key={key}>
              <div className="food-main">
                <div className="food-copy" dir="auto">
                  <strong>{normalized.date || t.archive}</strong>
                  <span>{t.target}: {normalized.goal}</span>
                </div>
                <b dir="ltr">{normalized.calories}</b>
              </div>
              <div className="macro-pills">
                <span dir="ltr">{normalized.protein}g {t.protein}</span>
                <span dir="ltr">{normalized.carbs}g {t.carbs}</span>
                <span dir="ltr">{normalized.fat}g {t.fat}</span>
              </div>

              {normalized.items.length > 0 && (
                <div className="archive-items">
                  {normalized.items.map((item, itemIndex) => (
                    <span key={item.id || `${key}-${itemIndex}`} dir="auto">{item.name || item.label || item.food || t.eaten}</span>
                  ))}
                </div>
              )}

              <div className="inline-actions">
                <button onClick={() => onRemove(day?.id, index)}>{t.remove}</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Archive;
