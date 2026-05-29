import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeAIResult } from '../utils/nutrition';
import { clamp } from '../utils/validation';

const JSON_SHAPE = `{
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit": "g | ml | piece | serving | tbsp | tsp | cup | unknown",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "confidence": "high | medium | low",
      "reasoningNote": "short explanation of assumptions"
    }
  ],
  "totals": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "needsUserClarification": boolean,
  "clarifyingQuestion": "string or null",
  "warnings": ["string"]
}`;

const CLARIFICATION_SHAPE = `{
  "items": [],
  "totals": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0
  },
  "needsUserClarification": true,
  "clarifyingQuestion": "one clear grouped question",
  "warnings": ["Strict estimate needs more details for better accuracy."]
}`;

const SYSTEM_INSTRUCTIONS = `You are a careful nutrition estimator for a daily calorie tracking app.
Return only valid JSON. Do not return markdown, code fences, comments, explanations outside JSON, or trailing commas.
Estimate calories and macros for foods, drinks, mixed dishes, packaged foods, restaurant foods, and nutrition labels.
Understand English and Arabic food input, including common Middle Eastern foods such as رز أبيض مطبوخ, تونة مصفاة, ملعقة زيت زيتون, اندومي, شاورما, كبسة, بروست, بيض, لبن, زبادي, صوص, جبن, and صدر دجاج.

Core nutrition rules:
- Account for cooked vs raw weights, grams, ml, cups, pieces, serving sizes, brand/package labels, and drained vs non-drained canned foods.
- Account for oil absorption and added fats: olive oil, butter, cream, mayo, dressing, cheese, sauces, fried cooking, sugar drinks, and condiments.
- For packaged foods, use label values when visible/provided. If label/brand/size is missing, use a range-informed estimate and lower confidence.
- For homemade mixed dishes, estimate ingredients separately when possible and lower confidence when quantities are unknown.
- Do not fake precision: round calories to the nearest 5-10 unless a nutrition label is provided; round macros to the nearest 1g.
- Never return negative values. Calories must be 0-5000. Protein/carbs/fat must be 0-500g.

Confidence rules:
- high: exact grams/ml or nutrition label, cooked/raw state clear, and oil/sauce/brand/package details clear when relevant.
- medium: clear food description/photo and portion somewhat known, but some assumptions needed.
- low: vague food, image-only unclear portion, mixed dish without quantities, restaurant/fast food without brand/size, or missing oil/sauce details.
- Never claim high confidence without strong quantity and preparation details.

Average serving guidance:
- cooked white rice serving: 150-250g.
- cooked chicken breast serving: 120-200g.
- drained tuna can: 100-160g depending on can size.
- olive oil tablespoon: about 120 calories and 14g fat.
- one large egg: about 70 calories and 6g protein.
- one Indomie pack: use a typical packaged noodle range and mark medium/low confidence unless label is given.
- cheese slice: 50-80 calories depending on type.
- burger/fries/restaurant food: mark low/medium confidence unless brand and size are given.`;

const OUTPUT_RULES = `Output contract:
- Always return this exact JSON shape:
${JSON_SHAPE}
- If a strict estimate needs clarification, return:
${CLARIFICATION_SHAPE}
- Use only these units: g, ml, piece, serving, tbsp, tsp, cup, unknown.
- If input is impossible to identify, return low confidence, needsUserClarification true, and one useful question.
- If Arabic input is vague, ask the follow-up in Arabic when possible.`;

const EXAMPLES = `Examples:
Input: "230g cooked white rice, 218g drained tuna, 1 tbsp olive oil"
Behavior: estimate directly with high confidence because grams, drained state, and oil amount are clear.

Input: "rice and chicken"
Strict behavior: ask "How many grams of cooked rice and chicken did you eat? Was any oil, sauce, or butter used?"
Quick behavior: estimate with average serving sizes, low/medium confidence, and state assumptions in reasoningNote.

Input: "اندومي مع جبن"
Strict behavior: ask "كم كيس اندومي؟ وكم كمية الجبن أو عدد الشرائح؟ وهل أضفت زيت أو بيض أو أي شيء ثاني؟"

Input: "tuna sandwich"
Strict behavior: ask about bread type/size, tuna grams, drained or not, mayo, cheese, and sauce.`;

const userInputBlock = ({ description, clarification }) => `User meal input:
${description || 'Food photo or nutrition label attached.'}

User follow-up answer:
${clarification || 'none'}`;

const buildBasePrompt = ({ description, clarification, modeInstructions }) => `${SYSTEM_INSTRUCTIONS}

${modeInstructions}

${OUTPUT_RULES}

${EXAMPLES}

${userInputBlock({ description, clarification })}`;

export const buildQuickEstimatePrompt = ({ description, clarification } = {}) =>
  buildBasePrompt({
    description,
    clarification,
    modeInstructions: `Mode: Quick Estimate.
- Give a fast useful daily estimate.
- If quantity is missing, use reasonable average serving assumptions.
- Do not ask too many questions; only ask if the food is impossible to identify or the portion is unusably vague.
- Mark confidence honestly. Use medium for clear meals without exact quantity and low for unclear portions, mixed dishes, restaurant foods, or missing oil/sauce details.
- Mention the main assumptions in each reasoningNote.
- Average serving assumptions are allowed in Quick Estimate.`,
  });

export const buildStrictEstimatePrompt = ({ description, clarification } = {}) =>
  buildBasePrompt({
    description,
    clarification,
    modeInstructions: `Mode: Strict Estimate.
- Do not guess silently when important details are missing.
- Ask one clear grouped follow-up question before finalizing if grams, cooked/raw state, oil, sauces, cheese, drinks, brand/package size, or serving size materially affect the estimate.
- If the user provides enough details, estimate directly.
- High confidence is only allowed when grams/labels/brand/cooked/raw/oil details are clear.
- If details are missing, prefer the clarification JSON shape instead of estimating.`,
  });

export const buildFollowUpPrompt = ({ description, clarification, mode = 'strict' } = {}) =>
  buildBasePrompt({
    description,
    clarification,
    modeInstructions: `Mode: Follow-up ${mode === 'quick' ? 'Quick Estimate' : 'Strict Estimate'}.
- Re-analyze the original meal using the user's follow-up answer.
- Preserve relevant context from the original input/photo.
- If the answer now gives enough detail, return a finalized estimate.
- If strict mode still lacks critical details, ask one clearer grouped question.
- Do not auto-save; this JSON will be shown to the user for confirmation.`,
  });

export const buildNutritionPrompt = ({ description, clarification, mode = 'quick' } = {}) => {
  if (clarification) return buildFollowUpPrompt({ description, clarification, mode });
  if (mode === 'strict') return buildStrictEstimatePrompt({ description, clarification });
  return buildQuickEstimatePrompt({ description, clarification });
};

const cleanJSONText = (text) =>
  String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

const parseRawJSON = (text) => {
  const cleaned = cleanJSONText(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        throw new Error('The AI response was not valid nutrition JSON.');
      }
    }
    throw new Error('The AI response was not valid nutrition JSON.');
  }
};

const enforceNutritionBounds = (result) => {
  const warnings = [...(Array.isArray(result.warnings) ? result.warnings : [])];
  let adjusted = false;
  const clampCalories = (value) => {
    const next = clamp(value, 0, 5000);
    if (Number(value) !== next) adjusted = true;
    return next;
  };
  const clampMacro = (value) => {
    const next = clamp(value, 0, 500);
    if (Number(value) !== next) adjusted = true;
    return next;
  };

  const items = result.items.map((item) => ({
    ...item,
    calories: clampCalories(item.calories),
    protein: clampMacro(item.protein),
    carbs: clampMacro(item.carbs),
    fat: clampMacro(item.fat),
  }));
  const totals = {
    ...result.totals,
    calories: clampCalories(result.totals.calories),
    protein: clampMacro(result.totals.protein),
    carbs: clampMacro(result.totals.carbs),
    fat: clampMacro(result.totals.fat),
    cal: clampCalories(result.totals.calories ?? result.totals.cal),
    p: clampMacro(result.totals.protein ?? result.totals.p),
    c: clampMacro(result.totals.carbs ?? result.totals.c),
    f: clampMacro(result.totals.fat ?? result.totals.f),
  };

  if (adjusted) {
    warnings.push('Some nutrition values were outside safe app limits and were capped. Please review before saving.');
  }

  return { ...result, items, totals, warnings };
};

export const parseGeminiJSON = (text) => enforceNutritionBounds(normalizeAIResult(parseRawJSON(text)));

export const analyzeNutrition = async ({ apiKey, description, imageBase64, imageType, clarification, mode }) => {
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTIONS,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: mode === 'strict' ? 0.15 : 0.25,
    },
  });
  const prompt = buildNutritionPrompt({ description, clarification, mode });
  const parts = imageBase64
    ? [prompt, { inlineData: { data: imageBase64.split(',')[1], mimeType: imageType || 'image/jpeg' } }]
    : prompt;
  const response = await model.generateContent(parts);
  return parseGeminiJSON(response.response.text());
};

export const analyzeFixMyDayIdeas = async ({ apiKey, lang = 'en', context }) => {
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.35,
    },
  });
  const prompt = `You are a practical nutrition coach inside a calorie tracking app.
Suggest up to 3 realistic meal ideas for the rest of today.
Use the user's remaining calories/macros. Prefer simple foods.
Prioritize protein if protein is low. Avoid high-fat ideas if fat is over target.
Do not shame the user. Do not suggest logging food automatically.
Include estimated calories, protein, carbs, and fat for each option.
Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.
Keep it concise and easy to follow.

Today's context:
${JSON.stringify(context, null, 2)}`;
  const response = await model.generateContent(prompt);
  return response.response.text().trim();
};
