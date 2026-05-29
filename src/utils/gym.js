export const WORKOUT_DAYS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Custom'];

export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Abs', 'Forearms', 'Other'];

const exercise = (id, englishName, arabicName, muscleGroup, aliases = []) => ({ id, englishName, arabicName, muscleGroup, aliases });

export const BUILT_IN_EXERCISES = [
  exercise('bench-press-barbell', 'Barbell Bench Press', 'بنش صدر بار', 'Chest', ['bench', 'bench press', 'chest bar', 'flat bench', 'صدر', 'صدر بار', 'بنش', 'بنش مستوي', 'صدر مستوي']),
  exercise('bench-press-dumbbell', 'Dumbbell Bench Press', 'بنش صدر دمبل', 'Chest', ['db bench', 'dumbbell chest', 'flat dumbbell press', 'صدر دمبل', 'دمبل صدر', 'صدر مستوي دمبل']),
  exercise('incline-barbell-press', 'Incline Barbell Press', 'بنش صدر علوي بار', 'Chest', ['incline chest', 'incline press', 'upper chest', 'incline bar', 'صدر علوي', 'بنش علوي', 'بار علوي', 'صدر علوي بار']),
  exercise('incline-dumbbell-press', 'Incline Dumbbell Press', 'بنش صدر علوي دمبل', 'Chest', ['incline chest', 'incline press', 'upper chest', 'db incline', 'incline db press', 'صدر علوي', 'دمبل علوي', 'بنش علوي', 'صدر علوي دمبل']),
  exercise('chest-press-machine', 'Chest Press Machine', 'جهاز صدر', 'Chest', ['machine chest', 'chest press', 'جهاز صدر', 'صدر جهاز']),
  exercise('incline-chest-press-machine', 'Incline Chest Press Machine', 'جهاز صدر علوي', 'Chest', ['incline machine', 'upper chest machine', 'جهاز صدر علوي', 'صدر علوي جهاز']),
  exercise('pec-deck-fly', 'Pec Deck Fly', 'تفتيح صدر جهاز', 'Chest', ['pec deck', 'machine fly', 'chest fly machine', 'تفتيح', 'تفتيح صدر', 'فلاي صدر', 'جهاز تفتيح']),
  exercise('cable-fly', 'Cable Fly', 'تفتيح صدر كيبل', 'Chest', ['cable crossover', 'cable chest fly', 'تفتيح كيبل', 'تفتيح صدر كيبل', 'كيبل صدر']),
  exercise('dips-chest', 'Dips Chest Focus', 'dips صدر', 'Chest', ['dips chest', 'chest dips', 'ديبس صدر', 'dips صدر']),
  exercise('lat-pulldown', 'Lat Pulldown', 'سحب علوي', 'Back', ['lat pull', 'pulldown', 'back pull', 'سحب', 'سحب ظهر', 'سحب علوي', 'ظهر علوي']),
  exercise('close-grip-pulldown', 'Close Grip Pulldown', 'سحب علوي قبضة ضيقة', 'Back', ['close grip lat', 'close pulldown', 'narrow pulldown', 'سحب ضيق', 'قبضة ضيقة', 'سحب علوي ضيق']),
  exercise('seated-cable-row', 'Seated Cable Row', 'سحب أرضي كيبل', 'Back', ['cable row', 'seated row', 'low row', 'سحب أرضي', 'سحب ارضي', 'تجديف كيبل', 'سحب ظهر']),
  exercise('barbell-row', 'Barbell Row', 'تجديف بار', 'Back', ['bb row', 'bent over row', 'row bar', 'تجديف', 'تجديف بار', 'ظهر بار']),
  exercise('dumbbell-row', 'Dumbbell Row', 'تجديف دمبل', 'Back', ['db row', 'one arm row', 'dumbbell back', 'تجديف دمبل', 'ظهر دمبل']),
  exercise('t-bar-row', 'T-Bar Row', 'تي بار رو', 'Back', ['tbar', 't bar', 't-bar', 'تي بار', 'تي بار رو']),
  exercise('machine-row', 'Machine Row', 'جهاز ظهر', 'Back', ['row machine', 'machine back', 'جهاز ظهر', 'تجديف جهاز']),
  exercise('pull-up', 'Pull Up', 'عقلة', 'Back', ['pullup', 'chin up', 'عقلة', 'سحب وزن الجسم']),
  exercise('deadlift', 'Deadlift', 'ديدلفت', 'Back', ['dead lift', 'dl', 'ديدلفت', 'رفعة ميتة']),
  exercise('shoulder-press-machine', 'Shoulder Press Machine', 'جهاز كتف', 'Shoulders', ['machine shoulder press', 'جهاز كتف', 'ضغط كتف جهاز']),
  exercise('dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 'كتف دمبل', 'Shoulders', ['db shoulder press', 'dumbbell press', 'كتف دمبل', 'ضغط كتف دمبل']),
  exercise('barbell-shoulder-press', 'Barbell Shoulder Press', 'كتف بار', 'Shoulders', ['overhead press', 'military press', 'bar shoulder', 'كتف بار', 'ضغط كتف بار']),
  exercise('lateral-raise', 'Lateral Raise', 'رفرفة جانبية', 'Shoulders', ['side raise', 'side delt', 'shoulder raise', 'رفرفة', 'رفرفة جانبية', 'كتف جانبي']),
  exercise('cable-lateral-raise', 'Cable Lateral Raise', 'رفرفة جانبية كيبل', 'Shoulders', ['cable side raise', 'cable lateral', 'رفرفة كيبل', 'رفرفة جانبية كيبل', 'كتف جانبي كيبل']),
  exercise('rear-delt-fly', 'Rear Delt Fly', 'رفرفة خلفية', 'Shoulders', ['rear delt', 'reverse fly', 'rear fly', 'رفرفة خلفية', 'كتف خلفي', 'خلفي']),
  exercise('face-pull', 'Face Pull', 'فيس بول', 'Shoulders', ['facepull', 'rear delt cable', 'فيس بول', 'سحب وجه']),
  exercise('front-raise', 'Front Raise', 'رفرفة أمامية', 'Shoulders', ['front delt', 'front shoulder raise', 'رفرفة أمامية', 'كتف أمامي']),
  exercise('barbell-curl', 'Barbell Curl', 'باي بار', 'Biceps', ['bb curl', 'biceps bar', 'باي', 'باي بار', 'بايسبس بار']),
  exercise('dumbbell-curl', 'Dumbbell Curl', 'باي دمبل', 'Biceps', ['db curl', 'biceps dumbbell', 'باي دمبل', 'بايسبس دمبل']),
  exercise('hammer-curl', 'Hammer Curl', 'هامر', 'Biceps', ['hammer', 'hammer curls', 'هامر', 'باي هامر']),
  exercise('preacher-curl', 'Preacher Curl', 'بريتشر', 'Biceps', ['preacher', 'preacher biceps', 'بريتشر', 'باي بريتشر']),
  exercise('cable-curl', 'Cable Curl', 'باي كيبل', 'Biceps', ['cable biceps', 'cable curl', 'باي كيبل', 'كيبل باي']),
  exercise('incline-dumbbell-curl', 'Incline Dumbbell Curl', 'باي دمبل علوي', 'Biceps', ['incline curl', 'incline db curl', 'باي علوي', 'باي دمبل علوي']),
  exercise('triceps-pushdown', 'Triceps Pushdown', 'تراي كيبل', 'Triceps', ['tricep pushdown', 'cable triceps', 'تراي', 'تراي كيبل', 'كيبل تراي']),
  exercise('rope-pushdown', 'Rope Pushdown', 'تراي حبل', 'Triceps', ['rope triceps', 'rope pushdown', 'تراي حبل', 'حبل تراي']),
  exercise('overhead-triceps-extension', 'Overhead Triceps Extension', 'تراي فوق الرأس', 'Triceps', ['overhead triceps', 'triceps extension', 'تراي فوق', 'تراي فوق الرأس']),
  exercise('skull-crushers', 'Skull Crushers', 'سكَل كراشر', 'Triceps', ['skullcrusher', 'lying triceps', 'سكَل كراشر', 'سكول كراشر']),
  exercise('close-grip-bench-press', 'Close Grip Bench Press', 'بنش قبضة ضيقة تراي', 'Triceps', ['close grip bench', 'triceps bench', 'بنش ضيق', 'بنش قبضة ضيقة', 'تراي بنش']),
  exercise('dips-triceps', 'Dips Triceps Focus', 'dips تراي', 'Triceps', ['triceps dips', 'dips tri', 'ديبس تراي', 'dips تراي']),
  exercise('leg-press', 'Leg Press', 'ليق برس', 'Legs', ['leg press', 'legs press', 'ليق برس', 'رجل جهاز']),
  exercise('squat', 'Squat', 'سكوات', 'Legs', ['barbell squat', 'squats', 'سكوات', 'قرفصاء']),
  exercise('hack-squat', 'Hack Squat', 'هاك سكوات', 'Legs', ['hack', 'hack squat machine', 'هاك', 'هاك سكوات']),
  exercise('leg-extension', 'Leg Extension', 'ليق اكستنشن', 'Legs', ['quad extension', 'leg extensions', 'رجل أمامية', 'امامية', 'ليق اكستنشن']),
  exercise('leg-curl', 'Leg Curl', 'ليق كيرل', 'Legs', ['hamstring curl', 'leg curls', 'رجل خلفية', 'خلفية', 'ليق كيرل']),
  exercise('romanian-deadlift', 'Romanian Deadlift', 'رومانيان ديدلفت', 'Legs', ['rdl', 'romanian', 'hamstring deadlift', 'رومانيان', 'رومانيان ديدلفت', 'رجل خلفية']),
  exercise('hip-thrust', 'Hip Thrust', 'هب ثرست', 'Glutes', ['glute thrust', 'hip thrusts', 'هب ثرست', 'ألوية']),
  exercise('lunges', 'Lunges', 'لانجز', 'Legs', ['lunge', 'walking lunges', 'لانجز', 'اندفاع']),
  exercise('bulgarian-split-squat', 'Bulgarian Split Squat', 'بلغاريان', 'Legs', ['bulgarian', 'split squat', 'بلغاريان', 'سكوات بلغاري']),
  exercise('calf-raise', 'Calf Raise', 'سمانة', 'Legs', ['calves', 'calf raises', 'سمانة', 'بطات']),
  exercise('adductor-machine', 'Adductor Machine', 'ادكشن', 'Legs', ['adductor', 'inner thigh', 'ادكشن', 'داخلية']),
  exercise('abductor-machine', 'Abductor Machine', 'ابدكشن', 'Glutes', ['abductor', 'outer thigh', 'ابدكشن', 'خارجية']),
  exercise('cable-crunch', 'Cable Crunch', 'بطن كيبل', 'Abs', ['cable abs', 'abs cable', 'بطن كيبل', 'كيبل بطن']),
  exercise('crunch', 'Crunch', 'كرنش', 'Abs', ['crunches', 'abs crunch', 'كرنش', 'بطن']),
  exercise('leg-raise', 'Leg Raise', 'رفع رجل', 'Abs', ['hanging leg raise', 'leg raises', 'رفع رجل', 'رفع أرجل', 'بطن']),
  exercise('plank', 'Plank', 'بلانك', 'Abs', ['planks', 'core plank', 'بلانك']),
  exercise('wrist-curl', 'Wrist Curl', 'سواعد', 'Forearms', ['forearm curl', 'wrist curls', 'سواعد', 'ساعد']),
  exercise('reverse-curl', 'Reverse Curl', 'عكسي باي', 'Forearms', ['reverse curls', 'forearm reverse', 'عكسي باي', 'باي عكسي']),
  exercise('farmer-walk', 'Farmer Walk', 'فارمر ووك', 'Forearms', ['farmers walk', 'farmer carry', 'فارمر ووك', 'حمل دمبل']),
];

const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const searchExerciseLibrary = (query, userExercises = []) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];
  const userItems = userExercises.map((item) => {
    const normalized = normalizeExercise(item);
    return {
      id: `user-${normalized.id}`,
      source: 'user',
      englishName: normalized.name,
      arabicName: normalized.name,
      muscleGroup: normalized.muscleGroup,
      workoutDay: normalized.workoutDay,
      aliases: [normalized.notes],
      exerciseId: normalized.id,
    };
  });

  return [...userItems, ...BUILT_IN_EXERCISES]
    .map((item) => {
      const haystack = normalizeSearchText([item.englishName, item.arabicName, item.muscleGroup, ...(item.aliases || [])].join(' '));
      const score = haystack.includes(normalizedQuery)
        ? haystack.startsWith(normalizedQuery) ? 3 : 2
        : normalizedQuery.split(' ').every((part) => haystack.includes(part)) ? 1 : 0;
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.englishName.localeCompare(b.englishName))
    .slice(0, 8);
};

export const normalizeExercise = (exercise = {}) => ({
  id: String(exercise.id || Date.now()),
  name: String(exercise.name || '').trim(),
  muscleGroup: MUSCLE_GROUPS.includes(exercise.muscleGroup) ? exercise.muscleGroup : 'Other',
  workoutDay: WORKOUT_DAYS.includes(exercise.workoutDay) ? exercise.workoutDay : 'Custom',
  notes: String(exercise.notes || ''),
  createdAt: exercise.createdAt || new Date().toISOString(),
});

export const normalizeGymLog = (log = {}) => ({
  id: String(log.id || Date.now()),
  sessionId: log.sessionId ? String(log.sessionId) : '',
  exerciseId: String(log.exerciseId || ''),
  date: String(log.date || new Date().toISOString().slice(0, 10)),
  sets: Array.isArray(log.sets)
    ? log.sets
        .map((set) => ({
          weight: Math.max(0, Number(set?.weight) || 0),
          reps: Math.max(1, Number(set?.reps) || 1),
        }))
        .filter((set) => set.weight <= 500 && set.reps <= 100)
        .slice(0, 20)
    : [],
  notes: String(log.notes || ''),
  createdAt: log.createdAt || new Date().toISOString(),
});

export const normalizeTemplate = (template = {}) => ({
  id: String(template.id || Date.now()),
  name: String(template.name || 'Custom').trim(),
  order: Number.isFinite(Number(template.order)) ? Number(template.order) : 0,
  exercises: Array.isArray(template.exercises)
    ? template.exercises
        .map((exercise, index) => ({
          exerciseId: String(exercise?.exerciseId || ''),
          exerciseName: String(exercise?.exerciseName || ''),
          muscleGroup: MUSCLE_GROUPS.includes(exercise?.muscleGroup) ? exercise.muscleGroup : 'Other',
          order: Number.isFinite(Number(exercise?.order)) ? Number(exercise.order) : index,
          defaultSets: Math.min(Math.max(Number(exercise?.defaultSets) || 3, 1), 8),
        }))
        .filter((exercise) => exercise.exerciseId && exercise.exerciseName)
        .sort((a, b) => a.order - b.order)
    : [],
  createdAt: template.createdAt || new Date().toISOString(),
  updatedAt: template.updatedAt || template.createdAt || new Date().toISOString(),
});

export const latestLogForExercise = (logs = [], exerciseId) =>
  logs
    .map(normalizeGymLog)
    .filter((log) => log.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))[0] || null;

export const normalizeWorkoutSession = (session = {}) => ({
  id: String(session.id || Date.now()),
  templateId: String(session.templateId || ''),
  templateName: String(session.templateName || 'Workout'),
  date: String(session.date || new Date().toISOString().slice(0, 10)),
  notes: String(session.notes || ''),
  exercises: Array.isArray(session.exercises)
    ? session.exercises.map((exercise, index) => ({
        exerciseId: String(exercise?.exerciseId || ''),
        exerciseName: String(exercise?.exerciseName || ''),
        muscleGroup: MUSCLE_GROUPS.includes(exercise?.muscleGroup) ? exercise.muscleGroup : 'Other',
        order: Number.isFinite(Number(exercise?.order)) ? Number(exercise.order) : index,
        sets: Array.isArray(exercise?.sets)
          ? exercise.sets
              .map((set) => ({ weight: Number(set?.weight), reps: Number(set?.reps) }))
              .filter((set) => Number.isFinite(set.weight) && Number.isFinite(set.reps) && set.weight >= 0 && set.weight <= 500 && set.reps >= 1 && set.reps <= 100)
              .slice(0, 20)
          : [],
      })).filter((exercise) => exercise.exerciseId && exercise.sets.length)
    : [],
  createdAt: session.createdAt || new Date().toISOString(),
});

export const estimatedOneRepMax = (weight, reps) => Number(weight) * (1 + Number(reps) / 30);

export const calculateExercisePR = (logs = []) => {
  const sets = logs.flatMap((log) => normalizeGymLog(log).sets.map((set) => ({ ...set, date: log.date, createdAt: log.createdAt })));
  if (sets.length === 0) return null;

  const sortedByDate = [...sets].sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
  const ranked = sortedByDate.map((set) => ({
    ...set,
    oneRm: estimatedOneRepMax(set.weight, set.reps),
    volume: set.weight * set.reps,
  }));
  const current = ranked.reduce((best, set) => (set.oneRm > best.oneRm ? set : best), ranked[0]);
  const previousCandidates = ranked.filter((set) => set !== current && new Date(set.createdAt || set.date) <= new Date(current.createdAt || current.date));
  const previous = previousCandidates.length
    ? previousCandidates.reduce((best, set) => (set.oneRm > best.oneRm ? set : best), previousCandidates[0])
    : null;
  const highestWeight = ranked.reduce((best, set) => (set.weight > best.weight ? set : best), ranked[0]);
  const bestVolume = ranked.reduce((best, set) => (set.volume > best.volume ? set : best), ranked[0]);

  return {
    current,
    previous,
    highestWeight,
    bestVolume,
    improvement: previous ? current.oneRm - previous.oneRm : null,
  };
};

export const validateExercise = (exercise) => Boolean(String(exercise?.name || '').trim());

export const validateGymLog = (log) => {
  const normalized = normalizeGymLog(log);
  return normalized.exerciseId && normalized.sets.length >= 1 && normalized.sets.length <= 20
    && normalized.sets.every((set) => set.weight >= 0 && set.weight <= 500 && set.reps >= 1 && set.reps <= 100);
};
