const MAMA_TIME_PHASES = ["morning", "noon", "dusk", "night"];
const MAMA_MONSTER_ALERT_STATUSES = ["none", "active", "cleared"];
const DEFAULT_MAMA_MONSTER_ALERT_STATUS = "none";
const MAMA_LOCATIONS = {
  home_living_room: {
    label: "家",
    aliases: ["home", "house", "living_room", "livingroom", "家", "客厅", "公寓"],
    image: "bg_home_living_room",
    x: 394,
    y: 386,
    rotation: -2,
    pin: "pink"
  },
  school_gate: {
    label: "学校",
    aliases: ["school", "school_gate", "学校", "校门", "高中"],
    image: "bg_school_gate",
    x: 781,
    y: 405,
    rotation: 3,
    pin: "pink"
  },
  convenience_store: {
    label: "便利店",
    aliases: ["convenience", "store", "convenience_store", "便利店"],
    image: "bg_convenience_store",
    x: 387,
    y: 554,
    rotation: 4,
    pin: "yellow"
  },
  shopping_street: {
    label: "商业街",
    aliases: ["shopping", "street", "shopping_street", "商业街"],
    image: "bg_shopping_street",
    x: 202,
    y: 365,
    rotation: -3,
    pin: "yellow"
  },
  arcade: {
    label: "电玩城",
    aliases: ["arcade", "game_center", "电玩城", "游戏厅"],
    image: "bg_arcade",
    x: 230,
    y: 188,
    rotation: 2,
    pin: "yellow"
  },
  neighborhood_park: {
    label: "街心公园",
    aliases: ["park", "neighborhood_park", "街心公园", "公园"],
    image: "bg_neighborhood_park",
    x: 423,
    y: 172,
    rotation: -4,
    pin: "green"
  },
  riverbank: {
    label: "河堤",
    aliases: ["river", "riverbank", "河堤", "河岸"],
    image: "bg_riverbank",
    x: 381,
    y: 733,
    rotation: 3,
    pin: "green"
  },
  train_station: {
    label: "电车站",
    aliases: ["station", "train_station", "电车站", "车站"],
    image: "bg_train_station",
    x: 199,
    y: 590,
    rotation: -2,
    pin: "purple"
  },
  izakaya_street: {
    label: "居酒屋街",
    aliases: ["izakaya", "izakaya_street", "居酒屋街"],
    image: "bg_izakaya_street",
    x: 61,
    y: 310,
    rotation: 4,
    pin: "yellow"
  },
  abandoned_factory: {
    label: "废弃工厂",
    aliases: ["factory", "abandoned_factory", "废弃工厂", "工厂"],
    image: "bg_abandoned_factory",
    x: 784,
    y: 660,
    rotation: -3,
    pin: "purple"
  },
  suburban_shrine: {
    label: "郊外神社",
    aliases: ["shrine", "suburban_shrine", "郊外神社", "神社"],
    image: "bg_suburban_shrine",
    x: 1001,
    y: 166,
    rotation: 2,
    pin: "purple"
  },
  hospital_interior: {
    label: "市医院",
    aliases: ["hospital", "hospital_interior", "市医院", "医院"],
    image: "bg_hospital_interior",
    x: 945,
    y: 391,
    rotation: -4,
    pin: "yellow"
  },
  company: {
    label: "公司",
    aliases: ["company", "office", "workplace", "公司", "办公室", "职场"],
    image: "bg_company",
    x: 551,
    y: 408,
    rotation: 1,
    pin: "yellow"
  }
};
const DEFAULT_MAMA_LOCATION = "home_living_room";
const MAMA_LOCATION_KEYS = Object.keys(MAMA_LOCATIONS);
const LOCATION_BLOCKED_KEYWORDS = /* @__PURE__ */ new Set(["street", "room", "interior", "store", "station", "gate"]);
buildLocationKeywordIndex();
const MAMA_MASCOT_EXPRESSION_KEYS = [
  "neruru_default",
  "neruru_happy",
  "neruru_laughing",
  "neruru_playful",
  "neruru_confident",
  "neruru_shy",
  "neruru_starstruck",
  "neruru_eating",
  "neruru_sad",
  "neruru_angry",
  "neruru_shock",
  "neruru_nervous",
  "neruru_confused",
  "neruru_sleepy",
  "neruru_charge",
  "neruru_exhausted"
];
const DEFAULT_MAMA_MASCOT_EXPRESSION = "neruru_default";
const MAMA_MASCOT_EXPRESSION_KEY_SET = /* @__PURE__ */ new Set(MAMA_MASCOT_EXPRESSION_KEYS);
const MASCOT_EXPRESSION_ALIASES = {
  default: "neruru_default",
  neutral: "neruru_default"
};
const DEFAULT_MAMA_STATE = {
  affection: 0,
  fatigueLevel: 0,
  manaLevel: 0,
  livingExpense: 1250,
  corruptionLevel: 82,
  week: 1,
  day: 1,
  timePhase: "morning",
  userLocation: DEFAULT_MAMA_LOCATION,
  enaLocation: DEFAULT_MAMA_LOCATION,
  monsterAlertStatus: DEFAULT_MAMA_MONSTER_ALERT_STATUS,
  monsterAlertLocation: "",
  monsterAlertRollKey: "",
  outfit: "streetwear_full",
  mascotEmotion: DEFAULT_MAMA_MASCOT_EXPRESSION,
  mascotComment: "唔噜噜，绘奈今天还撑得住噜。别太欺负她，涅露露可是在看着的噜。"
};
function normalizeMamaState(value) {
  const source = isRecord(value) ? value : {};
  return {
    affection: clampNumber(source.affection, 0, 255, DEFAULT_MAMA_STATE.affection),
    fatigueLevel: clampMamaLevel(source.fatigueLevel, DEFAULT_MAMA_STATE.fatigueLevel),
    manaLevel: clampMamaLevel(source.manaLevel, DEFAULT_MAMA_STATE.manaLevel),
    livingExpense: clampNumber(source.livingExpense, 0, 999999, DEFAULT_MAMA_STATE.livingExpense),
    corruptionLevel: clampNumber(source.corruptionLevel, 0, 100, DEFAULT_MAMA_STATE.corruptionLevel),
    week: clampNumber(source.week, 1, 9999, DEFAULT_MAMA_STATE.week),
    day: clampNumber(source.day, 1, 9999, DEFAULT_MAMA_STATE.day),
    timePhase: normalizeTimePhase(source.timePhase, DEFAULT_MAMA_STATE.timePhase),
    userLocation: normalizeMamaLocationValue(source.userLocation, DEFAULT_MAMA_STATE.userLocation),
    enaLocation: normalizeMamaLocationValue(source.enaLocation, DEFAULT_MAMA_STATE.enaLocation),
    monsterAlertStatus: normalizeMonsterAlertStatus(source.monsterAlertStatus, DEFAULT_MAMA_STATE.monsterAlertStatus),
    monsterAlertLocation: normalizeString(source.monsterAlertLocation, DEFAULT_MAMA_STATE.monsterAlertLocation),
    monsterAlertRollKey: normalizeString(source.monsterAlertRollKey, DEFAULT_MAMA_STATE.monsterAlertRollKey),
    outfit: normalizeString(source.outfit, DEFAULT_MAMA_STATE.outfit),
    mascotEmotion: normalizeMascotExpression(source.mascotEmotion, DEFAULT_MAMA_STATE.mascotEmotion),
    mascotComment: normalizeString(source.mascotComment, DEFAULT_MAMA_STATE.mascotComment)
  };
}
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function clampNumber(value, min, max, fallback) {
  const next = readFiniteNumber(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}
function clampMamaLevel(value, fallback = 0) {
  return clampNumber(value, 0, 5, fallback);
}
function readFiniteNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number(value);
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  const normalized = trimmed.replace(/,/g, "");
  const exact = Number(normalized);
  if (Number.isFinite(exact)) return exact;
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}
function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function normalizeTimePhase(value, fallback = DEFAULT_MAMA_STATE.timePhase) {
  return typeof value === "string" && MAMA_TIME_PHASES.includes(value) ? value : fallback;
}
function normalizeMonsterAlertStatus(value, fallback = DEFAULT_MAMA_MONSTER_ALERT_STATUS) {
  return typeof value === "string" && MAMA_MONSTER_ALERT_STATUSES.includes(value) ? value : fallback;
}
function normalizeMamaLocationValue(value, fallback = DEFAULT_MAMA_LOCATION) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function normalizeLocationToken(value) {
  return value.trim().toLowerCase().replace(/^bg_/, "").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_").replace(/^_+|_+$/g, "");
}
function buildLocationKeywordIndex() {
  const candidates = /* @__PURE__ */ new Map();
  const addKeyword = (keyword, key) => {
    const normalized = normalizeLocationToken(keyword);
    if (!normalized || LOCATION_BLOCKED_KEYWORDS.has(normalized)) return;
    const existing = candidates.get(normalized) || /* @__PURE__ */ new Set();
    existing.add(key);
    candidates.set(normalized, existing);
  };
  MAMA_LOCATION_KEYS.forEach((key) => {
    const detail = MAMA_LOCATIONS[key];
    addKeyword(key, key);
    addKeyword(detail.image, key);
    detail.aliases.forEach((alias) => addKeyword(alias, key));
    const parts = key.split("_");
    parts.forEach((part) => addKeyword(part, key));
    for (let index = 0; index < parts.length - 1; index += 1) {
      addKeyword(`${parts[index]}_${parts[index + 1]}`, key);
    }
  });
  return Array.from(candidates.entries()).reduce((index, [keyword, keys]) => {
    if (keys.size === 1) index[keyword] = Array.from(keys)[0];
    return index;
  }, {});
}
function normalizeMascotExpression(value, fallback = DEFAULT_MAMA_MASCOT_EXPRESSION) {
  if (typeof value !== "string") return fallback;
  const key = value.trim();
  if (MAMA_MASCOT_EXPRESSION_KEY_SET.has(key)) return key;
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
  function resolveRegisterMvuSchema() {
    try {
      if (typeof registerMvuSchema === "function") return registerMvuSchema;
    } catch (_) {
    }
    try {
      if (typeof ROOT.registerMvuSchema === "function") return ROOT.registerMvuSchema.bind(ROOT);
    } catch (_) {
    }
    try {
      const currentRoot = CURRENT_ROOT;
      if (typeof currentRoot.registerMvuSchema === "function") return currentRoot.registerMvuSchema.bind(currentRoot);
    } catch (_) {
    }
    return null;
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
    const register = resolveRegisterMvuSchema();
    if (typeof register !== "function") {
      console.warn(`${PLUGIN_NAME} registerMvuSchema unavailable`);
      return;
    }
    register(schemas.statDataSchema);
    console.info(`${PLUGIN_NAME} MVU-zod schema registered: stat_data.mama`);
  }
  if (typeof ROOT.$ === "function") {
    ROOT.$(() => registerSchemaWhenReady());
  } else {
    registerSchemaWhenReady();
  }
})();
