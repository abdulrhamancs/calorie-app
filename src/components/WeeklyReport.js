import React from 'react';

function MetricCard({ label, value }) {
  return (
    <div className="metric-strip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WeeklyReport({ t, report }) {
  if (!report) return null;
  const latestWeeklyAverage = report.latestWeeklyAverage;
  const weeklyTrend = report.weeklyTrend ? t[report.weeklyTrend] : t.noPreviousWeekData;

  return (
    <section className="card weekly-report">
      <div className="section-title">
        <p className="eyebrow">{t.progress}</p>
        <h2>{t.weeklyReport}</h2>
      </div>

      <article className="calories-card report-score-card">
        <div className="calories-copy">
          <span>{t.consistencyScore}</span>
          <strong>{report.consistencyScore}%</strong>
          <small>{report.daysLogged}/7 {t.daysLogged}</small>
        </div>
        <div className="weekly-dots">
          {report.days.map((day) => (
            <span key={day.key} title={day.key} style={{ height: `${Math.max(12, day.score)}%` }} className={day.score > 0 ? 'active' : ''} />
          ))}
        </div>
      </article>

      <div className="progress-grid">
        <MetricCard label={t.averageCalories} value={report.daysLogged ? Math.round(report.averageCalories) : '-'} />
        <MetricCard label={t.averageProtein} value={report.daysLogged ? `${Math.round(report.averageProtein)}g` : '-'} />
        <MetricCard label={t.proteinHitDays} value={`${report.proteinHitDays}/7`} />
        <MetricCard label={t.averageWater} value={`${report.averageWater.toFixed(1)}L`} />
        <MetricCard label={t.weightChange} value={report.weightChange === null ? '-' : `${report.weightChange > 0 ? '+' : ''}${report.weightChange.toFixed(1)} kg`} />
        <MetricCard label={t.bestDay} value={report.bestDay || '-'} />
        <MetricCard label={t.averageWeight} value={latestWeeklyAverage ? `${latestWeeklyAverage.averageWeight.toFixed(1)} kg` : '-'} />
        <MetricCard label={t.trend} value={weeklyTrend} />
      </div>

      {report.daysLogged < 3 && <p className="helper-text">{t.partialData}</p>}
    </section>
  );
}

export default WeeklyReport;
