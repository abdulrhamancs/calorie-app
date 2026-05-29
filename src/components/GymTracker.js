import React, { useEffect, useMemo, useState } from 'react';
import { todayKey } from '../utils/dates';
import { calculateExercisePR, estimatedOneRepMax, latestLogForExercise, MUSCLE_GROUPS, normalizeExercise, normalizeGymLog, normalizeTemplate, normalizeWorkoutSession, searchExerciseLibrary, validateExercise, validateGymLog, WORKOUT_DAYS } from '../utils/gym';
import { uid } from '../utils/nutrition';
import EmptyStateIcon from './EmptyStateIcon';

const emptyExercise = { name: '', muscleGroup: 'Chest', workoutDay: 'Custom', notes: '' };
const emptyTemplate = { id: '', name: 'Upper A', exercises: [] };
const formatNumber = (value, digits = 1) => {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(digits);
};

const makeSets = (count = 3) => Array.from({ length: Math.max(1, Math.min(Number(count) || 3, 8)) }, () => ({ weight: '', reps: '' }));
const countSessionSets = (workout) => workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
const firstSetText = (exercise) => {
  const set = exercise.sets[0];
  return set ? `${formatNumber(set.weight)}kg x ${set.reps}` : '-';
};
const nameParts = (name) => String(name || '').split(' / ').filter(Boolean);

function ExerciseChart({ logs }) {
  const points = useMemo(() => {
    const rows = logs.flatMap((log) => normalizeGymLog(log).sets.map((set) => ({ date: log.date, value: estimatedOneRepMax(set.weight, set.reps) }))).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (rows.length < 2) return '';
    const values = rows.map((row) => row.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return rows.map((row, index) => `${(index / Math.max(rows.length - 1, 1)) * 100},${46 - ((row.value - min) / range) * 38}`).join(' ');
  }, [logs]);
  return points ? <svg className="gym-chart" viewBox="0 0 100 52" preserveAspectRatio="none"><polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg> : null;
}

function GymTracker({ t, exercises, logs, templates, sessions = [], onSaveExercise, onRemoveExercise, onSaveLog, onRemoveLog, onSaveTemplate, onRemoveTemplate, onSaveSession, onRemoveSession }) {
  const normalizedExercises = useMemo(() => exercises.map(normalizeExercise).filter((exercise) => exercise.name), [exercises]);
  const normalizedLogs = useMemo(() => logs.map(normalizeGymLog).filter((log) => log.exerciseId && log.sets.length), [logs]);
  const normalizedTemplates = useMemo(() => templates
    .map((template, index) => normalizeTemplate({ ...template, order: Number.isFinite(Number(template?.order)) ? Number(template.order) : index }))
    .filter((template) => template.name)
    .sort((a, b) => a.order - b.order || new Date(a.createdAt) - new Date(b.createdAt)), [templates]);
  const normalizedSessions = useMemo(() => sessions.map(normalizeWorkoutSession).filter((session) => session.exercises.length).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)), [sessions]);

  const [tab, setTab] = useState('start');
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [templateSearch, setTemplateSearch] = useState('');
  const [exerciseForm, setExerciseForm] = useState(emptyExercise);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [session, setSession] = useState(() => {
    try {
      const draft = JSON.parse(localStorage.getItem('gymDraftSession') || 'null');
      return draft && Array.isArray(draft.exercises) ? draft : null;
    } catch {
      return null;
    }
  });
  const [draftRestored, setDraftRestored] = useState(() => Boolean(localStorage.getItem('gymDraftSession')));
  const [showSession, setShowSession] = useState(false);
  const [detailExerciseId, setDetailExerciseId] = useState('');
  const [exerciseReturnTab, setExerciseReturnTab] = useState('exercises');
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [openSessionId, setOpenSessionId] = useState('');
  const [error, setError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem('gymDraftSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('gymDraftSession');
    }
  }, [session]);

  const exerciseResults = useMemo(() => searchExerciseLibrary(exerciseSearch, normalizedExercises), [exerciseSearch, normalizedExercises]);
  const templateResults = useMemo(() => searchExerciseLibrary(templateSearch, normalizedExercises), [templateSearch, normalizedExercises]);
  const detailExercise = normalizedExercises.find((exercise) => exercise.id === detailExerciseId) || null;
  const detailLogs = normalizedLogs.filter((log) => log.exerciseId === detailExercise?.id).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  const detailPr = calculateExercisePR(detailLogs);
  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();
    if (!query) return normalizedExercises;
    return normalizedExercises.filter((exercise) => (
      `${exercise.name} ${exercise.muscleGroup} ${exercise.workoutDay} ${exercise.notes}`.toLowerCase().includes(query)
    ));
  }, [exerciseSearch, normalizedExercises]);
  const countLabel = (count, singularKey, pluralKey, singularFallback, pluralFallback) =>
    `${count} ${count === 1 ? (t[singularKey] || singularFallback) : (t[pluralKey] || pluralFallback)}`;
  const helpSteps = [
    t.gymHelpCreatePlan,
    t.gymHelpAddExercises,
    t.gymHelpStartWorkout,
    t.gymHelpSets,
    t.gymHelpUsePrevious,
    t.gymHelpSaveWorkout,
    t.gymHelpHistoryPr,
    t.gymHelpDrafts,
  ];
  const isArabic = t.workoutTab !== 'Workout';
  const gymCopy = {
    draftSaved: t.draftSaved || (isArabic ? 'مسودة محفوظة' : 'Draft saved'),
    lastTrained: t.lastTrained || (isArabic ? 'آخر تمرين' : 'Last'),
    lastSession: t.lastSession || (isArabic ? 'آخر جلسة' : 'Last session'),
    noSessionsYet: t.noSessionsYet || (isArabic ? 'لا توجد جلسات بعد' : 'No sessions yet'),
    prsTracked: t.prsTracked || (isArabic ? 'أرقام PR متتبعة' : 'PRs tracked'),
  };
  const getTemplateSummary = (template) => {
    const setCount = template.exercises.reduce((sum, exercise) => sum + (Number(exercise.defaultSets) || 0), 0);
    const latestSession = normalizedSessions.find((workout) => workout.templateId === template.id || workout.templateName === template.name);
    const prCount = template.exercises.filter((exercise) => calculateExercisePR(normalizedLogs.filter((log) => log.exerciseId === exercise.exerciseId))).length;
    return {
      exerciseCount: template.exercises.length,
      setCount,
      latestSession,
      prCount,
      hasDraft: session?.templateId === template.id,
    };
  };
  const confirmLeave = () => window.confirm(`${t.leaveWithoutSaving}\n${t.unsavedChangesLost}`);
  const hasCustomExerciseDraft = Boolean(exerciseForm.name.trim() || exerciseForm.notes.trim() || exerciseForm.muscleGroup !== emptyExercise.muscleGroup || exerciseForm.workoutDay !== emptyExercise.workoutDay);
  const hasTemplateDraft = Boolean(templateForm.id || templateForm.name !== emptyTemplate.name || templateForm.exercises.length || templateSearch.trim());

  const closeTemplateForm = () => {
    if (hasTemplateDraft && !confirmLeave()) return;
    setTemplateForm(emptyTemplate);
    setTemplateSearch('');
  };

  const closeCustomExerciseForm = () => {
    if (hasCustomExerciseDraft && !confirmLeave()) return;
    setShowExerciseForm(false);
    setExerciseForm(emptyExercise);
  };

  const openExerciseDetail = (exerciseId, returnTab = 'exercises') => {
    setDetailExerciseId(exerciseId);
    setExerciseReturnTab(returnTab);
    setTab('exercises');
  };

  const closeExerciseDetail = () => {
    const returnTab = exerciseReturnTab;
    setDetailExerciseId('');
    if (returnTab === 'start') {
      setShowSession(true);
      setTab('start');
    } else if (returnTab === 'history') {
      setTab('history');
    } else {
      setTab('exercises');
    }
  };

  const saveExerciseFromLibrary = (item, target = 'exercise') => {
    if (item.source === 'user' && item.exerciseId) {
      if (target === 'template') addTemplateExercise(normalizedExercises.find((exercise) => exercise.id === item.exerciseId));
      else setDetailExerciseId(item.exerciseId);
      return item.exerciseId;
    }
    const next = normalizeExercise({
      id: uid(),
      name: `${item.englishName} / ${item.arabicName}`,
      muscleGroup: item.muscleGroup,
      workoutDay: 'Custom',
      notes: item.aliases?.slice(0, 4).join(', ') || '',
      createdAt: new Date().toISOString(),
    });
    onSaveExercise(next);
    if (target === 'template') addTemplateExercise(next);
    else setDetailExerciseId(next.id);
    return next.id;
  };

  const addTemplateExercise = (exercise) => {
    if (!exercise) return;
    setTemplateForm((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          order: current.exercises.length,
          defaultSets: 3,
        },
      ],
    }));
    setTemplateSearch('');
  };

  const saveTemplate = () => {
    const next = normalizeTemplate({
      ...templateForm,
      id: templateForm.id || uid(),
      order: Number.isFinite(Number(templateForm.order)) ? Number(templateForm.order) : normalizedTemplates.length,
      createdAt: templateForm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (!next.name || next.exercises.length === 0) {
      setError(t.gymValidation);
      return;
    }
    onSaveTemplate(next);
    setTemplateForm(emptyTemplate);
    setTemplateSearch('');
    setError('');
  };

  const moveTemplate = (templateIndex, direction) => {
    const targetIndex = templateIndex + direction;
    if (targetIndex < 0 || targetIndex >= normalizedTemplates.length) return;
    const current = normalizedTemplates[templateIndex];
    const target = normalizedTemplates[targetIndex];
    onSaveTemplate({ ...current, order: target.order, updatedAt: new Date().toISOString() });
    onSaveTemplate({ ...target, order: current.order, updatedAt: new Date().toISOString() });
  };

  const startWorkout = (template) => {
    const clean = normalizeTemplate(template);
    if (session?.templateId === clean.id) {
      setShowSession(true);
      setDraftRestored(true);
      setTab('start');
      return;
    }
    if (session && !confirmLeave()) return;
    setSession({
      templateId: clean.id,
      templateName: clean.name,
      date: todayKey(),
      notes: '',
      exercises: clean.exercises.map((exercise) => ({
        ...exercise,
        sets: makeSets(exercise.defaultSets),
      })),
    });
    setDraftRestored(false);
    setShowSession(true);
    setTab('start');
  };

  const clearDraft = () => {
    setSession(null);
    setDraftRestored(false);
    setShowSession(false);
    localStorage.removeItem('gymDraftSession');
  };

  const updateSessionSet = (exerciseIndex, setIndex, field, value) => {
    setSession((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) => index === exerciseIndex
        ? { ...exercise, sets: exercise.sets.map((set, nextSetIndex) => (nextSetIndex === setIndex ? { ...set, [field]: value } : set)) }
        : exercise),
    }));
  };

  const addSessionSet = (exerciseIndex) => {
    setSession((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) => index === exerciseIndex ? { ...exercise, sets: [...exercise.sets, { weight: '', reps: '' }] } : exercise),
    }));
  };

  const removeSessionSet = (exerciseIndex, setIndex) => {
    setSession((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) => index === exerciseIndex
        ? { ...exercise, sets: exercise.sets.length <= 1 ? [{ weight: '', reps: '' }] : exercise.sets.filter((_, nextSetIndex) => nextSetIndex !== setIndex) }
        : exercise),
    }));
  };

  const removeSessionExercise = (exerciseIndex) => {
    if (!window.confirm(t.removeFromTodayQuestion)) return;
    setSession((current) => ({
      ...current,
      exercises: current.exercises.filter((_, index) => index !== exerciseIndex),
    }));
  };

  const applyPreviousSets = (exerciseIndex, previous) => {
    if (!previous?.sets?.length) return;
    setSession((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) => index === exerciseIndex
        ? { ...exercise, sets: previous.sets.map((set) => ({ weight: String(set.weight), reps: String(set.reps) })) }
        : exercise),
    }));
  };

  const saveSession = () => {
    const createdAt = new Date().toISOString();
    const sessionExercises = session.exercises
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets
          .filter((set) => set.weight !== '' && set.reps !== '')
          .map((set) => ({ weight: Number(set.weight), reps: Number(set.reps) }))
          .filter((set) => set.weight >= 0 && set.weight <= 500 && set.reps >= 1 && set.reps <= 100),
      }))
      .filter((exercise) => exercise.sets.length);
    const nextSession = normalizeWorkoutSession({
      ...session,
      id: uid(),
      createdAt,
      exercises: sessionExercises,
    });
    const nextLogs = nextSession.exercises
      .map((exercise) => normalizeGymLog({
        id: uid(),
        sessionId: nextSession.id,
        exerciseId: exercise.exerciseId,
        date: nextSession.date,
        notes: nextSession.notes,
        createdAt,
        sets: exercise.sets,
      }))
      .filter(validateGymLog);
    if (nextLogs.length === 0) {
      setError(t.gymValidation);
      return;
    }
    onSaveSession(nextSession);
    nextLogs.forEach(onSaveLog);
    clearDraft();
    setError('');
  };

  const deleteSession = (workout) => {
    if (window.confirm(`${t.deleteSessionQuestion} ${t.cannotUndo}`)) {
      onRemoveSession(workout);
      if (openSessionId === workout.id) setOpenSessionId('');
    }
  };

  const submitCustomExercise = () => {
    const next = normalizeExercise({ ...exerciseForm, id: uid(), createdAt: new Date().toISOString() });
    if (!validateExercise(next)) {
      setError(t.gymValidation);
      return;
    }
    onSaveExercise(next);
    setDetailExerciseId(next.id);
    setShowExerciseForm(false);
    setExerciseForm(emptyExercise);
    setError('');
  };

  const renderStart = () => (
    <>
      {!session || !showSession ? (
        <div className="gym-form">
          <div className="section-title compact-title"><p className="eyebrow">{t.today}</p><h2>{t.startWorkout}</h2></div>
          {normalizedTemplates.length === 0 ? (
            <div className="empty-state compact-empty"><EmptyStateIcon type="gym" /><p>{t.noTemplatesYet}</p></div>
          ) : (
            <div className="template-grid">
              {normalizedTemplates.map((template) => {
                const summary = getTemplateSummary(template);
                return (
                  <button type="button" key={template.id} onClick={() => startWorkout(template)}>
                    <strong dir="auto">{template.name}</strong>
                    <span className="template-card-meta">
                      {countLabel(summary.exerciseCount, 'exerciseSingular', 'exercisePlural', 'exercise', 'exercises')} · {countLabel(summary.setCount, 'setSingular', 'setPlural', 'set', 'sets')}
                    </span>
                    <span className="template-card-meta">{summary.latestSession ? `${gymCopy.lastTrained}: ${summary.latestSession.date}` : gymCopy.noSessionsYet}</span>
                    {summary.latestSession ? (
                      <span className="template-card-meta">
                        {gymCopy.lastSession}: {countLabel(summary.latestSession.exercises.length, 'exerciseSingular', 'exercisePlural', 'exercise', 'exercises')} · {countLabel(countSessionSets(summary.latestSession), 'setSingular', 'setPlural', 'set', 'sets')}
                      </span>
                    ) : summary.prCount > 0 ? (
                      <span className="template-card-meta">{gymCopy.prsTracked}: {summary.prCount}</span>
                    ) : null}
                    {summary.hasDraft && <span className="template-card-badge">{gymCopy.draftSaved}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="gym-session">
          <div className="gym-subview-header">
            <button className="back-action" type="button" onClick={() => setShowSession(false)}>← {t.back}</button>
            <div className="section-title compact-title"><p className="eyebrow">{session.date}</p><h2 dir="auto">{session.templateName}</h2></div>
          </div>
          {draftRestored && <p className="gym-status-badge">{t.draftRestored}</p>}
          {session.exercises.map((exercise, exerciseIndex) => {
            const previous = latestLogForExercise(normalizedLogs, exercise.exerciseId);
            const pr = calculateExercisePR(normalizedLogs.filter((log) => log.exerciseId === exercise.exerciseId));
            return (
              <article className="session-exercise" key={`${exercise.exerciseId}-${exerciseIndex}`}>
                <div className="session-exercise-head">
                  <div>
                    <button type="button" onClick={() => openExerciseDetail(exercise.exerciseId, 'start')} dir="auto">{exercise.exerciseName}</button>
                    <small>{previous ? `${t.previous}: ${previous.sets[0]?.weight || 0}kg x ${previous.sets[0]?.reps || 0}` : t.noPreviousLog}</small>
                    {pr && <small>{t.pr}: {formatNumber(pr.current.oneRm)}kg e1RM</small>}
                  </div>
                  <button className="remove-from-today" type="button" onClick={() => removeSessionExercise(exerciseIndex)}>{t.removeFromToday}</button>
                </div>
                <div className="gym-sets-list">
                  {exercise.sets.map((set, setIndex) => (
                    <div className="gym-set-row" key={`${exercise.exerciseId}-${setIndex}`}>
                      <span>{t.sets} {setIndex + 1}</span>
                      <input type="number" min="0" max="500" value={set.weight} onChange={(event) => updateSessionSet(exerciseIndex, setIndex, 'weight', event.target.value)} placeholder={t.weight} />
                      <input type="number" min="1" max="100" value={set.reps} onChange={(event) => updateSessionSet(exerciseIndex, setIndex, 'reps', event.target.value)} placeholder={t.reps} />
                      <button type="button" onClick={() => removeSessionSet(exerciseIndex, setIndex)} aria-label={t.removeSet}>x</button>
                    </div>
                  ))}
                </div>
                <div className="action-row compact-session-actions">
                  <button className="secondary-action compact-action" type="button" onClick={() => addSessionSet(exerciseIndex)}>{t.addSet}</button>
                  {previous && <button className="secondary-action compact-action" type="button" onClick={() => applyPreviousSets(exerciseIndex, previous)}>{t.usePrevious}</button>}
                </div>
              </article>
            );
          })}
          <label className="field"><span>{t.notes}</span><input value={session.notes} onChange={(event) => setSession({ ...session, notes: event.target.value })} placeholder={t.notes} /></label>
          <div className="action-row sticky-session-actions">
            <button className="secondary-action" onClick={clearDraft}>{t.clearDraft}</button>
            <button className="primary-action" onClick={saveSession}>{t.saveWorkout}</button>
          </div>
        </div>
      )}
    </>
  );

  const renderTemplates = () => (
    <div className="gym-form">
      <div className={hasTemplateDraft ? 'gym-subview-header' : ''}>
        {hasTemplateDraft && <button className="back-action" type="button" onClick={closeTemplateForm}>← {t.back}</button>}
        <div className="section-title compact-title"><p className="eyebrow">{t.gym}</p><h2>{t.workoutTemplates}</h2></div>
      </div>
      <label className="field"><span>{t.templateName}</span><input value={templateForm.name} onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })} /></label>
      <label className="field"><span>{t.addExercise}</span><input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder={t.exerciseSearchPlaceholder} /></label>
      {templateResults.length > 0 && (
        <div className="exercise-suggestions">
          {templateResults.map((item) => (
            <button type="button" key={item.id} onClick={() => saveExerciseFromLibrary(item, 'template')}>
              <strong dir="auto">{item.englishName}</strong><span dir="auto">{item.arabicName}</span><small>{t[item.muscleGroup] || item.muscleGroup}</small>
            </button>
          ))}
        </div>
      )}
      <div className="template-builder-list">
        {templateForm.exercises.map((exercise, index) => (
          <div className="template-exercise-row" key={`${exercise.exerciseId}-${index}`}>
            <strong dir="auto">{exercise.exerciseName}</strong>
            <input type="number" min="1" max="8" value={exercise.defaultSets} onChange={(event) => setTemplateForm((current) => ({ ...current, exercises: current.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, defaultSets: event.target.value } : item) }))} aria-label={t.defaultSets} />
            <button type="button" onClick={() => setTemplateForm((current) => ({ ...current, exercises: current.exercises.filter((_, itemIndex) => itemIndex !== index).map((item, order) => ({ ...item, order })) }))}>{t.removeExercise}</button>
          </div>
        ))}
      </div>
      <button className="primary-action" onClick={saveTemplate}>{t.save}</button>
      <div className="template-list">
        {normalizedTemplates.map((template, index) => (
          <article className="history-row" key={template.id}>
            <div><strong dir="auto">{template.name}</strong><span>{template.exercises.length} {t.exercises}</span></div>
            <div className="inline-actions">
              <button onClick={() => moveTemplate(index, -1)} disabled={index === 0} aria-label={t.moveUp}>↑</button>
              <button onClick={() => moveTemplate(index, 1)} disabled={index === normalizedTemplates.length - 1} aria-label={t.moveDown}>↓</button>
              <button onClick={() => setTemplateForm(template)}>{t.edit}</button>
              <button onClick={() => onRemoveTemplate(template.id)}>{t.remove}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  const renderExerciseDetail = () => (
    <div className="gym-exercises-view">
      <div className="gym-subview-header">
        <button className="back-action" type="button" onClick={closeExerciseDetail}>← {t.back}</button>
        <div className="section-title compact-title"><p className="eyebrow">{t.exercises}</p><h2 dir="auto">{detailExercise.name}</h2></div>
      </div>
      <article className="gym-exercise-card">
        <div className="gym-exercise-top">
          <div>
            {nameParts(detailExercise.name).map((part, index) => index === 0
              ? <strong dir="auto" key={part}>{part}</strong>
              : <em dir="auto" key={part}>{part}</em>)}
            <span>{t[detailExercise.workoutDay] || detailExercise.workoutDay} - {t[detailExercise.muscleGroup] || detailExercise.muscleGroup}</span>
          </div>
          <button onClick={() => onRemoveExercise(detailExercise.id)}>{t.remove}</button>
        </div>
        <div className="progress-grid gym-pr-grid">
          <div className="metric-strip"><span>{t.currentPr}</span><strong>{detailPr ? `${formatNumber(detailPr.current.oneRm)} kg` : '-'}</strong></div>
          <div className="metric-strip"><span>{t.previousPr}</span><strong>{detailPr?.previous ? `${formatNumber(detailPr.previous.oneRm)} kg` : '-'}</strong></div>
          <div className="metric-strip"><span>{t.highestWeight}</span><strong>{detailPr ? `${formatNumber(detailPr.highestWeight.weight)}kg x ${detailPr.highestWeight.reps}` : '-'}</strong></div>
          <div className="metric-strip"><span>{t.bestVolumeSet}</span><strong>{detailPr ? `${formatNumber(detailPr.bestVolume.volume, 0)} kg` : '-'}</strong></div>
        </div>
        {detailPr && <p className="helper-text">{t.prDate}: {detailPr.current.date} - {t.improvement}: {detailPr.improvement === null ? '-' : `${detailPr.improvement > 0 ? '+' : ''}${formatNumber(detailPr.improvement)} kg`}</p>}
        <ExerciseChart logs={detailLogs} />
      </article>
      <div className="list-stack">
        {detailLogs.length === 0 ? <div className="empty-state compact-empty"><strong>-</strong><p>{t.noGymLogsYet}</p></div> : detailLogs.map((log) => (
          <article className="history-row gym-log-row" key={log.id}><div><strong>{log.date}</strong><span>{log.sets.map((set) => `${formatNumber(set.weight)}kg x ${set.reps}`).join(' - ')}</span></div><button onClick={() => onRemoveLog(log.id)}>{t.remove}</button></article>
        ))}
      </div>
    </div>
  );

  const renderExercises = () => {
    if (detailExercise) return renderExerciseDetail();
    return (
      <div className="gym-exercises-view">
        <div className="gym-form">
          <label className="field"><span>{t.searchExercise}</span><input value={exerciseSearch} onChange={(event) => setExerciseSearch(event.target.value)} placeholder={t.exerciseSearchPlaceholder} /></label>
          {exerciseResults.length > 0 && (
            <div className="exercise-suggestions">
              {exerciseResults.slice(0, 6).map((item) => (
                <button type="button" key={item.id} onClick={() => saveExerciseFromLibrary(item, 'exercise')}>
                  <strong dir="auto">{item.englishName}</strong><span dir="auto">{item.arabicName}</span><small>{t[item.muscleGroup] || item.muscleGroup}</small>
                </button>
              ))}
            </div>
          )}
          {!showExerciseForm ? (
            <button className="secondary-action add-custom-exercise" type="button" onClick={() => setShowExerciseForm(true)}>+ {t.addCustomExercise || t.addExercise}</button>
          ) : (
            <div className="custom-exercise-panel">
              <div className="gym-subview-header">
                <button className="back-action" type="button" onClick={closeCustomExerciseForm}>← {t.back}</button>
                <div className="section-title compact-title"><p className="eyebrow">{t.exercises}</p><h2>{t.addCustomExercise || t.addExercise}</h2></div>
              </div>
              <label className="field"><span>{t.addExercise}</span><input value={exerciseForm.name} onChange={(event) => setExerciseForm({ ...exerciseForm, name: event.target.value })} placeholder="Bench Press" /></label>
              <div className="compact-grid">
                <label className="field"><span>{t.workoutPlan}</span><select value={exerciseForm.workoutDay} onChange={(event) => setExerciseForm({ ...exerciseForm, workoutDay: event.target.value })}>{WORKOUT_DAYS.map((day) => <option key={day} value={day}>{t[day] || day}</option>)}</select></label>
                <label className="field"><span>{t.muscleGroup}</span><select value={exerciseForm.muscleGroup} onChange={(event) => setExerciseForm({ ...exerciseForm, muscleGroup: event.target.value })}>{MUSCLE_GROUPS.map((group) => <option key={group} value={group}>{t[group] || group}</option>)}</select></label>
              </div>
              <label className="field"><span>{t.notes}</span><input value={exerciseForm.notes} onChange={(event) => setExerciseForm({ ...exerciseForm, notes: event.target.value })} placeholder={t.notes} /></label>
              <div className="action-row compact-session-actions">
                <button className="primary-action compact-action" disabled={!exerciseForm.name.trim()} onClick={submitCustomExercise}>{t.save}</button>
              </div>
            </div>
          )}
        </div>
        <div className="exercise-list">
          {filteredExercises.length === 0 ? (
            <div className="empty-state compact-empty"><strong>-</strong><p>{t.noExercisesYet}</p></div>
          ) : filteredExercises.map((exercise) => {
            const exerciseLogs = normalizedLogs.filter((log) => log.exerciseId === exercise.id);
            const pr = calculateExercisePR(exerciseLogs);
            return (
              <article className="exercise-list-card" key={exercise.id}>
                <div className="exercise-list-copy">
                  {nameParts(exercise.name).map((part, index) => index === 0
                    ? <strong dir="auto" key={part}>{part}</strong>
                    : <em dir="auto" key={part}>{part}</em>)}
                  <span>{t[exercise.muscleGroup] || exercise.muscleGroup}</span>
                  <small>{pr ? `${t.pr}: ${formatNumber(pr.current.oneRm)}kg e1RM` : t.noGymLogsYet}</small>
                </div>
                <div className="exercise-list-actions">
                  <button type="button" onClick={() => openExerciseDetail(exercise.id, 'exercises')}>{t.open}</button>
                  <button className="subtle-delete" type="button" onClick={() => onRemoveExercise(exercise.id)}>{t.remove}</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    const openedSession = normalizedSessions.find((item) => item.id === openSessionId);
    return (
      <div className="gym-form">
        <div className="section-title compact-title"><p className="eyebrow">{t.savedWorkouts}</p><h2>{t.workoutHistory}</h2></div>
        {normalizedSessions.length === 0 ? (
          <div className="empty-state compact-empty"><strong>-</strong><p>{t.noGymLogsYet}</p></div>
        ) : (
          <div className="session-history-list">
            {normalizedSessions.map((workout) => (
              <article className="session-history-card" key={workout.id}>
                <div className="session-history-top">
                  <div>
                    <strong dir="auto">{workout.templateName}</strong>
                    <span>{workout.date}</span>
                    <small>{countLabel(workout.exercises.length, 'exerciseSingular', 'exercisePlural', 'exercise', 'exercises')} · {countLabel(countSessionSets(workout), 'setSingular', 'setPlural', 'set', 'sets')}</small>
                  </div>
                  <div className="session-history-actions">
                    <button onClick={() => setOpenSessionId(openSessionId === workout.id ? '' : workout.id)}>{openSessionId === workout.id ? t.clear : t.open}</button>
                    <button className="subtle-delete" onClick={() => deleteSession(workout)}>{t.deleteSession}</button>
                  </div>
                </div>
                <div className="session-preview">
                  {workout.exercises.slice(0, 4).map((exercise) => (
                    <div className="session-preview-item" key={`${workout.id}-${exercise.exerciseId}`}>
                      <strong dir="auto">{exercise.exerciseName}</strong>
                      <span dir="auto">{firstSetText(exercise)}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
        {openedSession && (
          <div className="past-session-view full-session-view">
            <div className="session-detail-header">
              <button className="back-action" type="button" onClick={() => setOpenSessionId('')}>← {t.back}</button>
              <div className="section-title compact-title">
                <p className="eyebrow">{openedSession.date}</p>
                <h2 dir="auto">{openedSession.templateName}</h2>
              </div>
            </div>
            {openedSession.exercises.map((exercise) => (
              <article className="session-exercise" key={`${openedSession.id}-${exercise.exerciseId}`}>
                <div className="session-exercise-head">
                  <button type="button" onClick={() => openExerciseDetail(exercise.exerciseId, 'history')} dir="auto">{exercise.exerciseName}</button>
                </div>
                <div className="session-set-readonly">
                  {exercise.sets.map((set, index) => (
                    <span key={`${exercise.exerciseId}-${index}`}>{t.sets} {index + 1}: {formatNumber(set.weight)}kg x {set.reps}</span>
                  ))}
                </div>
              </article>
            ))}
            {openedSession.notes && <p className="helper-text">{t.notes}: {openedSession.notes}</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="card gym-card">
      <div className="gym-main-header">
        <div className="section-title"><p className="eyebrow">{t.gym}</p><h2>{t.gym}</h2></div>
        <button className="gym-help-button" type="button" onClick={() => setHelpOpen(true)} aria-label={t.gymHelp}>
          {t.gymHelp}
        </button>
      </div>
      <div className="gym-section-tabs">
        {['start', 'templates', 'exercises', 'history'].map((key) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {key === 'start' ? t.workoutTab : key === 'templates' ? t.templatesTab : key === 'exercises' ? t.exercises : t.history}
          </button>
        ))}
      </div>
      {error && <p className="error-text">{error}</p>}
      {tab === 'start' && renderStart()}
      {tab === 'templates' && renderTemplates()}
      {tab === 'exercises' && renderExercises()}
      {tab === 'history' && renderHistory()}
      {helpOpen && (
        <div className="modal-backdrop gym-help-backdrop" role="presentation">
          <section className="modal-card gym-help-modal" role="dialog" aria-modal="true" aria-label={t.gymHelpTitle}>
            <div className="modal-header">
              <h2>{t.gymHelpTitle}</h2>
              <button className="icon-button" type="button" onClick={() => setHelpOpen(false)} aria-label={t.close}>×</button>
            </div>
            <ol className="gym-help-list">
              {helpSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>
        </div>
      )}
    </section>
  );
}

export default GymTracker;
