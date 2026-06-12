(function() {
  "use strict";
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
    const source2 = isRecord(value) ? value : {};
    return {
      affection: clampNumber(source2.affection, 0, 255, DEFAULT_MAMA_STATE.affection),
      fatigueLevel: clampMamaLevel(source2.fatigueLevel, DEFAULT_MAMA_STATE.fatigueLevel),
      manaLevel: clampMamaLevel(source2.manaLevel, DEFAULT_MAMA_STATE.manaLevel),
      livingExpense: clampNumber(source2.livingExpense, 0, 999999, DEFAULT_MAMA_STATE.livingExpense),
      corruptionLevel: clampNumber(source2.corruptionLevel, 0, 100, DEFAULT_MAMA_STATE.corruptionLevel),
      week: clampNumber(source2.week, 1, 9999, DEFAULT_MAMA_STATE.week),
      day: clampNumber(source2.day, 1, 9999, DEFAULT_MAMA_STATE.day),
      timePhase: normalizeTimePhase(source2.timePhase, DEFAULT_MAMA_STATE.timePhase),
      userLocation: normalizeMamaLocationValue(source2.userLocation, DEFAULT_MAMA_STATE.userLocation),
      enaLocation: normalizeMamaLocationValue(source2.enaLocation, DEFAULT_MAMA_STATE.enaLocation),
      monsterAlertStatus: normalizeMonsterAlertStatus(source2.monsterAlertStatus, DEFAULT_MAMA_STATE.monsterAlertStatus),
      monsterAlertLocation: normalizeString(source2.monsterAlertLocation, DEFAULT_MAMA_STATE.monsterAlertLocation),
      monsterAlertRollKey: normalizeString(source2.monsterAlertRollKey, DEFAULT_MAMA_STATE.monsterAlertRollKey),
      outfit: normalizeString(source2.outfit, DEFAULT_MAMA_STATE.outfit),
      mascotEmotion: normalizeMascotExpression(source2.mascotEmotion, DEFAULT_MAMA_STATE.mascotEmotion),
      mascotComment: normalizeString(source2.mascotComment, DEFAULT_MAMA_STATE.mascotComment)
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
  (async function() {
    const ROOT = typeof window !== "undefined" ? window : globalThis;
    const BRIDGE_NAME = "[MAMA ST Bridge]";
    const VERSION = "0.1.0";
    const DEFAULT_MANIFEST = "./manifest.json";
    const FALLBACK_BRIDGE_URL = "https://hasheeper.github.io/project-mama-ena/apps/st-bridge/bridge.js";
    const PROD_APP_BASE_URL = "https://hasheeper.github.io/project-mama-ena";
    const LOCAL_APP_BASE_URL = "http://127.0.0.1:4173";
    function pushWindowCandidate(candidates, value) {
      try {
        const candidate = value;
        if (!candidate || candidates.includes(candidate)) return;
        candidates.push(candidate);
      } catch (_) {
      }
    }
    function getWindowCandidates() {
      const candidates = [];
      pushWindowCandidate(candidates, ROOT);
      pushWindowCandidate(candidates, globalThis);
      try {
        pushWindowCandidate(candidates, typeof window !== "undefined" ? window : null);
      } catch (_) {
      }
      try {
        pushWindowCandidate(candidates, typeof unsafeWindow === "object" ? unsafeWindow : null);
      } catch (_) {
      }
      Array.from(candidates).forEach((candidate) => {
        try {
          pushWindowCandidate(candidates, candidate.parent);
        } catch (_) {
        }
        try {
          pushWindowCandidate(candidates, candidate.parent?.parent);
        } catch (_) {
        }
        try {
          pushWindowCandidate(candidates, candidate.top);
        } catch (_) {
        }
      });
      return candidates;
    }
    function getCandidateDocument(candidate) {
      try {
        return candidate?.document || null;
      } catch (_) {
        return null;
      }
    }
    function hasCandidateFunction(candidate, key) {
      try {
        return typeof candidate?.[key] === "function";
      } catch (_) {
        return false;
      }
    }
    function hasCandidateValue(candidate, key) {
      try {
        return Boolean(candidate?.[key]);
      } catch (_) {
        return false;
      }
    }
    function queryCandidateDocument(candidate, selector) {
      const doc = getCandidateDocument(candidate);
      try {
        return Boolean(doc?.querySelector?.(selector));
      } catch (_) {
        return false;
      }
    }
    function scoreUiRoot(candidate) {
      const doc = getCandidateDocument(candidate);
      if (!doc) return -1;
      let score = 0;
      try {
        if (doc.body) score += 20;
      } catch (_) {
      }
      if (queryCandidateDocument(candidate, "#chat")) score += 160;
      if (queryCandidateDocument(candidate, "#chat .mes, .mes")) score += 90;
      if (queryCandidateDocument(candidate, "#send_form, #send_textarea, textarea")) score += 60;
      if (hasCandidateValue(candidate, "SillyTavern")) score += 60;
      if (hasCandidateFunction(candidate, "getVariables")) score += 45;
      if (hasCandidateFunction(candidate, "eventOn")) score += 30;
      if (hasCandidateFunction(candidate, "jQuery") || hasCandidateFunction(candidate, "$")) score += 25;
      if (candidate === ROOT) score += 1;
      return score;
    }
    function scoreApiRoot(candidate) {
      let score = 0;
      if (hasCandidateFunction(candidate, "getVariables")) score += 140;
      if (hasCandidateFunction(candidate, "insertOrAssignVariables")) score += 120;
      if (hasCandidateFunction(candidate, "updateVariablesWith")) score += 80;
      if (hasCandidateFunction(candidate, "getChatMessages")) score += 70;
      if (hasCandidateFunction(candidate, "setChatMessages")) score += 70;
      if (hasCandidateFunction(candidate, "eventOn")) score += 50;
      if (hasCandidateFunction(candidate, "handleVariablesInMessage")) score += 45;
      if (hasCandidateValue(candidate, "Mvu")) score += 35;
      if (hasCandidateValue(candidate, "SillyTavern")) score += 20;
      if (candidate === ROOT) score += 1;
      return score;
    }
    function pickBestWindow(candidates, scorer, fallback = ROOT) {
      let best = fallback;
      let bestScore = -1;
      candidates.forEach((candidate) => {
        const score = scorer(candidate);
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      });
      return best || fallback;
    }
    const WINDOW_CANDIDATES = getWindowCandidates();
    const HOST_ROOT = pickBestWindow(WINDOW_CANDIDATES, scoreUiRoot, ROOT);
    const API_ROOT = pickBestWindow(WINDOW_CANDIDATES, scoreApiRoot, HOST_ROOT);
    function getBridgeTargets() {
      const targets = [];
      [ROOT, HOST_ROOT, API_ROOT, ...WINDOW_CANDIDATES].forEach((candidate) => pushWindowCandidate(targets, candidate));
      return targets;
    }
    function getGlobalValue(key) {
      for (const candidate of getBridgeTargets()) {
        try {
          if (candidate?.[key] !== void 0 && candidate?.[key] !== null && candidate?.[key] !== "") {
            return candidate[key];
          }
        } catch (_) {
        }
      }
      return void 0;
    }
    function publishHostInfo(extra = {}) {
      const info = {
        product: "mama-ena",
        version: VERSION,
        ownerRoot: ROOT,
        root: HOST_ROOT,
        uiRoot: HOST_ROOT,
        apiRoot: API_ROOT,
        candidates: WINDOW_CANDIDATES,
        ...extra
      };
      getBridgeTargets().forEach((target) => {
        try {
          target.MAMA_ST_HOST = info;
          target.MAMA_ST_HOST_ROOT = HOST_ROOT;
          target.MAMA_ST_UI_ROOT = HOST_ROOT;
          target.MAMA_ST_API_ROOT = API_ROOT;
        } catch (_) {
        }
      });
      return info;
    }
    publishHostInfo();
    function isObject(value) {
      return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
    function clone(value, fallback = null) {
      return cloneJson(value, fallback);
    }
    function makeDefaultMamaState() {
      return clone(DEFAULT_MAMA_STATE, DEFAULT_MAMA_STATE);
    }
    function normalizeMamaState$1(value) {
      return normalizeMamaState(value);
    }
    function normalizeString(value, fallback = "") {
      return typeof value === "string" && value.trim() ? value.trim() : fallback;
    }
    function trimTrailingSlash(value) {
      return normalizeString(value, "").replace(/\/+$/, "");
    }
    function isUsableBridgeUrl(value) {
      if (!value || typeof value !== "string") return false;
      if (!/^https?:\/\//i.test(value)) return false;
      try {
        return new URL(value).pathname.endsWith("/bridge.js");
      } catch (_) {
        return false;
      }
    }
    function getCurrentScriptUrl() {
      try {
        const currentScript = document.currentScript;
        const currentScriptUrl = currentScript?.src;
        if (isUsableBridgeUrl(currentScriptUrl)) return currentScriptUrl;
      } catch (_) {
      }
      try {
        const scripts = Array.from(document.getElementsByTagName("script"));
        const matched = scripts.reverse().find((script) => isUsableBridgeUrl(script.src));
        if (matched && isUsableBridgeUrl(matched.src)) return matched.src;
      } catch (_) {
      }
      try {
        const resources = performance.getEntriesByType?.("resource") || [];
        const matched = resources.map((entry) => entry.name).reverse().find((name) => isUsableBridgeUrl(name));
        if (matched) return matched;
      } catch (_) {
      }
      try {
        const configuredUrl = getGlobalValue("ST_BRIDGE_URL");
        if (isUsableBridgeUrl(configuredUrl)) return configuredUrl;
      } catch (_) {
      }
      return FALLBACK_BRIDGE_URL;
    }
    function makeBridgeUrl() {
      try {
        return new URL(getCurrentScriptUrl());
      } catch (_) {
        return new URL(FALLBACK_BRIDGE_URL);
      }
    }
    const bridgeUrl = makeBridgeUrl();
    const bridgeRoot = new URL(".", bridgeUrl);
    const params = bridgeUrl.searchParams;
    const buildCacheKey = "404c7d5526c9";
    const cacheBust = params.get("v") || params.get("cache") || normalizeString(getGlobalValue("ST_BRIDGE_CACHE_BUST")) || buildCacheKey;
    const forceReload = params.get("force") === "1";
    publishHostInfo({
      bridgeUrl: bridgeUrl.href,
      bridgeRoot: bridgeRoot.href,
      cacheBust,
      forceReload
    });
    function isLocalBridgeUrl(url2) {
      try {
        const hostname = String(url2.hostname || "").toLowerCase();
        return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "[::1]" || hostname === "::1";
      } catch (_) {
        return false;
      }
    }
    function normalizeEnv(value, fallback) {
      const normalized = normalizeString(value, "").toLowerCase();
      if (normalized === "local" || normalized === "prod") return normalized;
      return fallback;
    }
    function isLocalAppBaseUrl(value) {
      try {
        const url2 = new URL(value);
        return isLocalBridgeUrl(url2);
      } catch (_) {
        return false;
      }
    }
    function shouldUseGlobalAppBaseUrl(value, env) {
      if (!value) return false;
      return env === "local" ? isLocalAppBaseUrl(value) : !isLocalAppBaseUrl(value);
    }
    function resolveLocalAppBaseUrl() {
      try {
        const bridgePath = bridgeUrl.pathname || "";
        const prefix = bridgePath.replace(/\/apps\/st-bridge\/bridge\.js$/i, "").replace(/\/+$/, "");
        return trimTrailingSlash(`${bridgeUrl.origin}${prefix}`);
      } catch (_) {
        return LOCAL_APP_BASE_URL;
      }
    }
    function resolveAppUrl(app, profile = bridgeProfile) {
      const key = normalizeString(app, "").toLowerCase();
      const appBaseUrl = trimTrailingSlash(profile?.appBaseUrl || PROD_APP_BASE_URL) || PROD_APP_BASE_URL;
      if (key === "visual-dashboard" || key === "status" || key === "dashboard") {
        return `${appBaseUrl}/apps/visual-dashboard/index.html`;
      }
      if (key === "app" || key === "shell") return `${appBaseUrl}/index.html?app=visual-dashboard`;
      if (key === "expression-portrait" || key === "portrait") return `${appBaseUrl}/apps/expression-portrait/index.html`;
      if (key === "layer-debug" || key === "debug") return `${appBaseUrl}/apps/layer-debug/index.html`;
      throw new Error(`Unknown MAMA app "${String(app)}"`);
    }
    function resolveBridgeProfile() {
      const env = normalizeEnv(
        params.get("env") || getGlobalValue("ST_BRIDGE_ENV"),
        isLocalBridgeUrl(bridgeUrl) ? "local" : "prod"
      );
      const fallbackAppBaseUrl = env === "local" ? resolveLocalAppBaseUrl() || LOCAL_APP_BASE_URL : PROD_APP_BASE_URL;
      const queryAppBaseUrl = trimTrailingSlash(params.get("appBase"));
      const globalAppBaseUrl = trimTrailingSlash(getGlobalValue("MAMA_APP_BASE_URL"));
      const appBaseUrl = queryAppBaseUrl || (shouldUseGlobalAppBaseUrl(globalAppBaseUrl, env) ? globalAppBaseUrl : "") || fallbackAppBaseUrl || fallbackAppBaseUrl;
      return {
        env,
        appBaseUrl,
        appUrl: `${appBaseUrl}/index.html?app=visual-dashboard`,
        statusUrl: `${appBaseUrl}/apps/visual-dashboard/index.html`,
        assetBaseUrl: `${appBaseUrl}/mama-assets/standing`
      };
    }
    const bridgeProfile = resolveBridgeProfile();
    const BRIDGE_STARTED_AT = Date.now();
    const BRIDGE_FETCH_TIMEOUT_MS = readPositiveMs("MAMA_BRIDGE_FETCH_TIMEOUT_MS", 25e3);
    const BRIDGE_SCRIPT_TIMEOUT_MS = readPositiveMs("MAMA_BRIDGE_SCRIPT_TIMEOUT_MS", 25e3);
    function readPositiveMs(key, fallback) {
      const value = Number(getGlobalValue(key));
      return Number.isFinite(value) && value > 0 ? value : fallback;
    }
    function formatErrorMessage(error) {
      if (!error) return "unknown error";
      if (error instanceof Error && error.message) return error.message;
      if (isObject(error) && typeof error.message === "string" && error.message) return error.message;
      return String(error);
    }
    function setBridgeLoadStatus(status, detail = {}) {
      const next = {
        status,
        env: bridgeProfile.env,
        bridgeUrl: bridgeUrl.href,
        appBaseUrl: bridgeProfile.appBaseUrl,
        startedAt: new Date(BRIDGE_STARTED_AT).toISOString(),
        elapsedMs: Date.now() - BRIDGE_STARTED_AT,
        ...detail
      };
      getBridgeTargets().forEach((target) => {
        try {
          target.__MAMA_BRIDGE_LOAD_STATUS__ = next;
        } catch (_) {
        }
      });
      return next;
    }
    function withTimeout(promise, timeoutMs, timeoutMessage) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        Promise.resolve(promise).then(
          (value) => {
            clearTimeout(timeout);
            resolve(value);
          },
          (error) => {
            clearTimeout(timeout);
            reject(error);
          }
        );
      });
    }
    function withCache(url2) {
      const next = new URL(url2);
      next.searchParams.set("_mama_bridge_v", cacheBust);
      return next.href;
    }
    function resolveUrl(path, base = bridgeRoot.href) {
      return new URL(path, base).href;
    }
    async function fetchJson(url2) {
      const response = await withTimeout(
        fetch(withCache(url2), { cache: "reload" }),
        BRIDGE_FETCH_TIMEOUT_MS,
        `HTTP request timed out after ${Math.round(BRIDGE_FETCH_TIMEOUT_MS / 1e3)}s while loading ${url2}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url2}`);
      return response.json();
    }
    async function fetchText(url2) {
      const response = await withTimeout(
        fetch(withCache(url2), { cache: "reload" }),
        BRIDGE_FETCH_TIMEOUT_MS,
        `HTTP request timed out after ${Math.round(BRIDGE_FETCH_TIMEOUT_MS / 1e3)}s while loading ${url2}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url2}`);
      return response.text();
    }
    function getManifestUrl() {
      const explicit = params.get("manifest") || getGlobalValue("ST_BRIDGE_MANIFEST_URL");
      return explicit ? resolveUrl(explicit, bridgeRoot.href) : resolveUrl(DEFAULT_MANIFEST, bridgeRoot.href);
    }
    function selectPack(manifest) {
      const requested = params.get("pack") || getGlobalValue("ST_BRIDGE_PACK") || manifest.activePack || manifest.defaultPack;
      const pack = manifest.packs && manifest.packs[requested];
      if (!pack) {
        const available = Object.keys(manifest.packs || {}).join(", ") || "(none)";
        throw new Error(`Unknown pack "${requested}". Available packs: ${available}`);
      }
      return { id: requested, pack };
    }
    function applyGlobals(pack, packId, profile = bridgeProfile) {
      getBridgeTargets().forEach((target) => {
        try {
          target.ST_BRIDGE_PACK = packId;
          target.ST_BRIDGE_PRODUCT = pack.product || packId;
          if (isObject(pack.globals)) {
            Object.entries(pack.globals).forEach(([key, value]) => {
              target[key] = value;
            });
          }
          target.ST_BRIDGE_ENV = profile.env;
          target.MAMA_APP_BASE_URL = profile.appBaseUrl;
          target.MAMA_APP_URL = profile.appUrl;
          target.MAMA_STATUS_URL = profile.statusUrl;
          target.MAMA_ASSET_BASE_URL = profile.assetBaseUrl;
        } catch (_) {
        }
      });
    }
    async function readVariables(options = {}) {
      const type = options.type || "message";
      const request = { ...options, type };
      delete request.rootKey;
      if (typeof API_ROOT.getVariables !== "function") {
        return isObject(API_ROOT.__MAMA_ST_BRIDGE_MEMORY__) ? clone(API_ROOT.__MAMA_ST_BRIDGE_MEMORY__, {}) : {};
      }
      try {
        const vars = await API_ROOT.getVariables(request);
        return isObject(vars) ? vars : {};
      } catch (error) {
        console.warn(`${BRIDGE_NAME} readVariables failed:`, error);
        return {};
      }
    }
    async function writeVariables(data, options = {}) {
      const type = options.type || "message";
      const request = { ...options, type };
      delete request.rootKey;
      if (typeof API_ROOT.insertOrAssignVariables === "function") {
        await API_ROOT.insertOrAssignVariables(data, request);
        return data;
      }
      if (typeof API_ROOT.updateVariablesWith === "function") {
        return API_ROOT.updateVariablesWith((vars) => ({ ...isObject(vars) ? vars : {}, ...data }), request);
      }
      API_ROOT.__MAMA_ST_BRIDGE_MEMORY__ = {
        ...isObject(API_ROOT.__MAMA_ST_BRIDGE_MEMORY__) ? API_ROOT.__MAMA_ST_BRIDGE_MEMORY__ : {},
        ...data
      };
      return data;
    }
    async function readState(rootKey = "stat_data", stateKey = null, options = {}) {
      const vars = await readVariables(options);
      if (!stateKey) return isObject(vars[rootKey]) ? vars[rootKey] : null;
      return isObject(vars[rootKey] && vars[rootKey][stateKey]) ? vars[rootKey][stateKey] : null;
    }
    async function writeState(rootKey = "stat_data", stateKey = null, state, options = {}) {
      if (!stateKey) {
        await writeVariables({ [rootKey]: state }, options);
        return state;
      }
      const vars = await readVariables(options);
      const root = isObject(vars[rootKey]) ? vars[rootKey] : {};
      const nextRoot = { ...root, [stateKey]: state };
      await writeVariables({ [rootKey]: nextRoot }, options);
      return state;
    }
    async function patchState(rootKey = "stat_data", stateKey = null, patcher, options = {}) {
      const current = await readState(rootKey, stateKey, options);
      const draft = clone(current, {});
      const result = await patcher(draft, current);
      return writeState(rootKey, stateKey, result || draft, options);
    }
    const schemaRegistry = isObject(API_ROOT.__MAMA_MVUZ_SCHEMAS__) ? API_ROOT.__MAMA_MVUZ_SCHEMAS__ : {};
    getBridgeTargets().forEach((target) => {
      try {
        target.__MAMA_MVUZ_SCHEMAS__ = schemaRegistry;
      } catch (_) {
      }
    });
    function registerSchema(namespace, schema) {
      if (!namespace || !isObject(schema)) return null;
      schemaRegistry[namespace] = {
        namespace,
        version: schema.version || "0.1.0",
        rootKey: schema.rootKey || "stat_data",
        makeDefaultState: typeof schema.makeDefaultState === "function" ? schema.makeDefaultState : () => clone(schema.defaults, {}),
        normalize: typeof schema.normalize === "function" ? schema.normalize : (value) => isObject(value) ? clone(value, {}) : clone(schema.defaults, {}),
        migrate: typeof schema.migrate === "function" ? schema.migrate : null
      };
      return schemaRegistry[namespace];
    }
    function getSchema(namespace = "mama") {
      return schemaRegistry[namespace] || null;
    }
    function normalizeNamespaceState(namespace = "mama", value = null) {
      const schema = getSchema(namespace);
      if (!schema) return isObject(value) ? clone(value, {}) : {};
      const base = value === void 0 || value === null ? schema.makeDefaultState() : value;
      return schema.normalize(base);
    }
    async function readNamespace(namespace = "mama", options = {}) {
      const schema = getSchema(namespace);
      const rootKey = options.rootKey || schema?.rootKey || "stat_data";
      return normalizeNamespaceState(namespace, await readState(rootKey, namespace, options));
    }
    async function writeNamespace(namespace = "mama", state, options = {}) {
      const schema = getSchema(namespace);
      const rootKey = options.rootKey || schema?.rootKey || "stat_data";
      const normalized = normalizeNamespaceState(namespace, state);
      await writeState(rootKey, namespace, normalized, options);
      getBridgeTargets().forEach((target) => {
        try {
          target.dispatchEvent?.(new target.CustomEvent("mama:mvuz-written", {
            detail: { namespace, rootKey, state: normalized }
          }));
        } catch (_) {
        }
      });
      return normalized;
    }
    async function patchNamespace(namespace = "mama", patcher, options = {}) {
      const current = await readNamespace(namespace, options);
      const draft = clone(current, {});
      const result = await patcher(draft, current);
      return writeNamespace(namespace, result || draft, options);
    }
    async function migrateNamespace(namespace = "mama", legacyVars = null, options = {}) {
      const schema = getSchema(namespace);
      if (!schema || typeof schema.migrate !== "function") {
        return writeNamespace(namespace, legacyVars || {}, options);
      }
      return writeNamespace(namespace, await schema.migrate(legacyVars || await readVariables(options)), options);
    }
    function exposeApi(state) {
      const existing = isObject(API_ROOT.STBridge) ? API_ROOT.STBridge : {};
      const actionHandlers = existing.actionHandlers || {};
      const api = {
        ...existing,
        version: VERSION,
        state,
        host: publishHostInfo({
          bridgeUrl: bridgeUrl.href,
          bridgeRoot: bridgeRoot.href,
          env: state?.env || bridgeProfile.env,
          appBaseUrl: state?.appBaseUrl || bridgeProfile.appBaseUrl,
          appUrl: state?.appUrl || bridgeProfile.appUrl,
          statusUrl: state?.statusUrl || bridgeProfile.statusUrl,
          assetBaseUrl: state?.assetBaseUrl || bridgeProfile.assetBaseUrl,
          cacheBust,
          forceReload
        }),
        actionHandlers,
        mvu: { readVariables, writeVariables, readState, writeState, patchState },
        mvuz: {
          schemas: schemaRegistry,
          registerSchema,
          getSchema,
          normalize: normalizeNamespaceState,
          read: readNamespace,
          write: writeNamespace,
          patch: patchNamespace,
          migrate: migrateNamespace
        },
        utils: {
          resolveUrl,
          resolveAppUrl,
          withCache,
          bridgeRoot: bridgeRoot.href,
          env: state?.env || bridgeProfile.env,
          appBaseUrl: state?.appBaseUrl || bridgeProfile.appBaseUrl
        },
        registerActions(namespace, handlers) {
          if (!namespace || !isObject(handlers)) return;
          actionHandlers[namespace] = { ...actionHandlers[namespace] || {}, ...handlers };
        },
        async dispatch(namespace, action, payload = {}) {
          const handler = actionHandlers[namespace] && actionHandlers[namespace][action];
          if (typeof handler !== "function") throw new Error(`No STBridge action handler for ${namespace}.${action}`);
          return handler(payload);
        },
        reload() {
          const next = new URL(bridgeUrl.href);
          next.searchParams.set("force", "1");
          next.searchParams.set("v", String(Date.now()));
          return import(next.href);
        }
      };
      getBridgeTargets().forEach((target) => {
        try {
          target.STBridge = api;
        } catch (_) {
        }
      });
    }
    async function runClassicScript(url, scriptId) {
      const source = await fetchText(url);
      eval(`${source}
//# sourceURL=${url}`);
      return { id: scriptId, type: "script", url };
    }
    async function loadScript(entry, manifestUrl) {
      const type = entry.type || "script";
      const url2 = resolveUrl(entry.url, manifestUrl);
      setBridgeLoadStatus("loading-script", { scriptId: entry.id || type, scriptUrl: url2 });
      console.log(`${BRIDGE_NAME} loading ${entry.id || type}: ${url2}`);
      if (type === "module") {
        await withTimeout(
          import(withCache(url2)),
          BRIDGE_SCRIPT_TIMEOUT_MS,
          `Script "${entry.id || url2}" timed out after ${Math.round(BRIDGE_SCRIPT_TIMEOUT_MS / 1e3)}s`
        );
        return { id: entry.id, type, url: url2 };
      }
      if (type === "script" || type === "classic") {
        return withTimeout(
          runClassicScript(url2, entry.id),
          BRIDGE_SCRIPT_TIMEOUT_MS,
          `Script "${entry.id || url2}" timed out after ${Math.round(BRIDGE_SCRIPT_TIMEOUT_MS / 1e3)}s`
        );
      }
      throw new Error(`Unsupported script type "${type}" for ${entry.id || entry.url}`);
    }
    function getLoadedRegistry() {
      if (!isObject(API_ROOT.__MAMA_ST_BRIDGE_LOADED__)) API_ROOT.__MAMA_ST_BRIDGE_LOADED__ = {};
      getBridgeTargets().forEach((target) => {
        try {
          target.__MAMA_ST_BRIDGE_LOADED__ = API_ROOT.__MAMA_ST_BRIDGE_LOADED__;
        } catch (_) {
        }
      });
      return API_ROOT.__MAMA_ST_BRIDGE_LOADED__;
    }
    function publishBridgeReady(ready2) {
      getBridgeTargets().forEach((target) => {
        try {
          target.__MAMA_ST_BRIDGE_READY__ = ready2;
        } catch (_) {
        }
      });
      return ready2;
    }
    async function main() {
      const manifestUrl = getManifestUrl();
      setBridgeLoadStatus("loading-manifest", { manifestUrl });
      const manifest = await fetchJson(manifestUrl);
      const { id: packId, pack } = selectPack(manifest);
      setBridgeLoadStatus("loading-pack", { manifestUrl, packId });
      const registry = getLoadedRegistry();
      const registryKey = [
        manifestUrl,
        packId,
        cacheBust,
        bridgeProfile.env,
        bridgeProfile.appBaseUrl
      ].join("::");
      if (registry[registryKey] && !forceReload) {
        exposeApi(registry[registryKey]);
        setBridgeLoadStatus("ready", { manifestUrl, packId, cached: true });
        return registry[registryKey];
      }
      registerSchema("mama", {
        version: "0.1.0",
        rootKey: "stat_data",
        makeDefaultState: makeDefaultMamaState,
        normalize: normalizeMamaState$1
      });
      applyGlobals(pack, packId, bridgeProfile);
      const state = {
        bridgeVersion: VERSION,
        manifestUrl,
        manifestVersion: manifest.version || "",
        packId,
        product: pack.product || packId,
        label: pack.label || packId,
        env: bridgeProfile.env,
        appBaseUrl: bridgeProfile.appBaseUrl,
        appUrl: bridgeProfile.appUrl,
        statusUrl: bridgeProfile.statusUrl,
        assetBaseUrl: bridgeProfile.assetBaseUrl,
        loaded: [],
        loadedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      registry[registryKey] = state;
      exposeApi(state);
      for (const entry of pack.scripts || []) {
        try {
          state.loaded.push(await loadScript(entry, manifestUrl));
        } catch (error) {
          console.error(`${BRIDGE_NAME} failed to load ${entry.id || entry.url}:`, error);
          setBridgeLoadStatus("script-error", {
            manifestUrl,
            packId,
            scriptId: entry.id || entry.type || "script",
            scriptUrl: entry.url,
            error: formatErrorMessage(error)
          });
          if (entry.required !== false) throw error;
        }
      }
      getBridgeTargets().forEach((target) => {
        try {
          target.dispatchEvent?.(new target.CustomEvent("mama:bridge-loaded", { detail: state }));
        } catch (_) {
        }
      });
      console.log(`${BRIDGE_NAME} loaded ${packId}`, state);
      setBridgeLoadStatus("ready", { manifestUrl, packId, loadedCount: state.loaded.length });
      return state;
    }
    const ready = main();
    publishBridgeReady(ready);
    try {
      await ready;
    } catch (error) {
      const message = formatErrorMessage(error);
      setBridgeLoadStatus("error", { manifestUrl: getManifestUrl(), error: message });
      console.error(`${BRIDGE_NAME} failed`, error);
      throw error;
    }
  })();
})();
