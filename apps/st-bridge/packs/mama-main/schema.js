import { registerMvuSchema } from "https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js";
const MAMA_TIME_PHASES = ["morning", "noon", "dusk", "night"];
const MAMA_MASCOT_EXPRESSIONS = {
  neruru_default: "Cute, neutral smiling mascot.",
  neruru_happy: "Big happy smile, radiating joyful energy.",
  neruru_laughing: "Laughing out loud with (> <) eyes and crossed arms.",
  neruru_playful: "Cheeky wink with a star popping out. Playful and energetic.",
  neruru_confident: "Eyes closed, chin up, shining with sparkles. Very proud.",
  neruru_shy: "Heavy blush, holding hands together with floating hearts.",
  neruru_starstruck: "Starry eyes and hearts. Mesmerized by food, shiny things, or extreme excitement.",
  neruru_eating: "Munching happily on a cookie.",
  neruru_sad: "Tearing up with a small raincloud 🌧️ overhead. Very sad or feeling pitiful.",
  neruru_angry: "Pouting with arms crossed and a red anger mark 💢. Cute but mad.",
  neruru_shock: "Blank white eyes, jaw dropped with an exclamation mark ❗. Total shock.",
  neruru_nervous: "Sweating profusely 💧, looking worried or guilty.",
  neruru_confused: "Tilting head with a question mark ❓. Not understanding the situation.",
  neruru_sleepy: "Dozing off while standing, featuring a classic sleepy snot bubble.",
  neruru_charge: "Zooming forward with speed lines, looking brave and determined to protect.",
  neruru_exhausted: "Melted flat on the ground, dizzy eyes with gloomy vertical lines. Out of energy."
};
const DEFAULT_MAMA_MASCOT_EXPRESSION = "neruru_default";
const MASCOT_EXPRESSION_ALIASES = {
  default: "neruru_default",
  neutral: "neruru_default"
};
const DEFAULT_MAMA_STATE = {
  affection: 0,
  week: 1,
  day: 1,
  timePhase: "morning",
  location: "unknown",
  outfit: "streetwear_full",
  mascotEmotion: DEFAULT_MAMA_MASCOT_EXPRESSION,
  mascotComment: "唔噜噜，绘奈今天还撑得住噜。别太欺负她，涅露露可是在看着的噜。"
};
function normalizeMamaState(value) {
  const source = isRecord(value) ? value : {};
  return {
    affection: clampNumber(source.affection, 0, 255, DEFAULT_MAMA_STATE.affection),
    week: clampNumber(source.week, 1, 9999, DEFAULT_MAMA_STATE.week),
    day: clampNumber(source.day, 1, 9999, DEFAULT_MAMA_STATE.day),
    timePhase: normalizeTimePhase(source.timePhase, DEFAULT_MAMA_STATE.timePhase),
    location: normalizeString(source.location, DEFAULT_MAMA_STATE.location),
    outfit: normalizeString(source.outfit, DEFAULT_MAMA_STATE.outfit),
    mascotEmotion: normalizeMascotExpression(source.mascotEmotion, DEFAULT_MAMA_STATE.mascotEmotion),
    mascotComment: normalizeString(source.mascotComment, DEFAULT_MAMA_STATE.mascotComment)
  };
}
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function clampNumber(value, min, max, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}
function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function normalizeTimePhase(value, fallback = DEFAULT_MAMA_STATE.timePhase) {
  return typeof value === "string" && MAMA_TIME_PHASES.includes(value) ? value : fallback;
}
function normalizeMascotExpression(value, fallback = DEFAULT_MAMA_MASCOT_EXPRESSION) {
  if (typeof value !== "string") return fallback;
  const key = value.trim();
  if (key in MAMA_MASCOT_EXPRESSIONS) return key;
  return MASCOT_EXPRESSION_ALIASES[key] || fallback;
}
function cloneJson(value, fallback) {
  if (value === void 0 || value === null) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}
(function() {
  const CURRENT_ROOT = typeof window !== "undefined" ? window : globalThis;
  const PLUGIN_NAME = "[MAMA Schema]";
  function resolveBridgeHost() {
    try {
      if (CURRENT_ROOT.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST;
    } catch (_) {
    }
    try {
      if (CURRENT_ROOT.MAMA_ST_HOST_ROOT?.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST_ROOT.MAMA_ST_HOST;
    } catch (_) {
    }
    try {
      if (CURRENT_ROOT.parent?.MAMA_ST_HOST) return CURRENT_ROOT.parent.MAMA_ST_HOST;
    } catch (_) {
    }
    try {
      if (CURRENT_ROOT.top?.MAMA_ST_HOST) return CURRENT_ROOT.top.MAMA_ST_HOST;
    } catch (_) {
    }
    return {};
  }
  const BRIDGE_HOST = resolveBridgeHost();
  const ROOT = BRIDGE_HOST.apiRoot || CURRENT_ROOT.MAMA_ST_API_ROOT || CURRENT_ROOT.MAMA_ST_HOST_ROOT || CURRENT_ROOT;
  const DEFAULT_MAMA_STATE$1 = DEFAULT_MAMA_STATE;
  function clone(value, fallback = null) {
    return cloneJson(value, fallback);
  }
  function makeDefaultMamaState() {
    return clone(DEFAULT_MAMA_STATE$1, DEFAULT_MAMA_STATE$1);
  }
  function normalizeMamaState$1(value = {}) {
    return normalizeMamaState(value);
  }
  function resolveZod() {
    return ROOT.z || ROOT.zod || ROOT.Zod || null;
  }
  function createStatDataSchema() {
    const zod = resolveZod();
    if (!zod || typeof zod.object !== "function" || typeof zod.any !== "function") return null;
    const mamaSchema = zod.any().default({}).transform((value) => normalizeMamaState$1(value));
    const statDataSchema = zod.object({
      mama: mamaSchema
    }).passthrough().transform((statData) => ({
      ...statData,
      mama: normalizeMamaState$1(statData.mama)
    }));
    return { mamaSchema, statDataSchema };
  }
  const schemas = createStatDataSchema();
  ROOT.MAMASchemaRuntime = {
    product: "mama-ena",
    DEFAULT_MAMA_STATE: DEFAULT_MAMA_STATE$1,
    makeDefaultMamaState,
    normalizeMamaState: normalizeMamaState$1,
    MamaSchema: schemas?.mamaSchema || null,
    MAMAStatDataSchema: schemas?.statDataSchema || null
  };
  function registerSchemaWhenReady() {
    try {
      ROOT.STBridge?.mvuz?.registerSchema?.("mama", {
        version: "0.1.0",
        rootKey: "stat_data",
        makeDefaultState: makeDefaultMamaState,
        normalize: normalizeMamaState$1
      });
    } catch (error) {
      console.warn(`${PLUGIN_NAME} STBridge schema registration skipped:`, error);
    }
    if (!schemas?.statDataSchema) {
      console.warn(`${PLUGIN_NAME} MVU-zod schema skipped: zod runtime unavailable`);
      return;
    }
    if (typeof registerMvuSchema !== "function") {
      console.warn(`${PLUGIN_NAME} registerMvuSchema unavailable`);
      return;
    }
    registerMvuSchema(schemas.statDataSchema);
    console.info(`${PLUGIN_NAME} MVU-zod schema registered: stat_data.mama`);
  }
  if (typeof ROOT.$ === "function") {
    ROOT.$(() => registerSchemaWhenReady());
  } else {
    registerSchemaWhenReady();
  }
})();
