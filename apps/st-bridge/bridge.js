(function() {
  "use strict";
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
  (async function() {
    const ROOT = typeof window !== "undefined" ? window : globalThis;
    const BRIDGE_NAME = "[MAMA ST Bridge]";
    const VERSION = "0.1.0";
    const DEFAULT_MANIFEST = "./manifest.json";
    const FALLBACK_BRIDGE_URL = "https://hasheeper.github.io/project-mama-ena/apps/st-bridge/bridge.js";
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
    function normalizeString2(value, fallback = "") {
      return typeof value === "string" && value.trim() ? value.trim() : fallback;
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
        const configuredUrl = getGlobalValue("ST_BRIDGE_URL");
        if (isUsableBridgeUrl(configuredUrl)) return configuredUrl;
      } catch (_) {
      }
      return FALLBACK_BRIDGE_URL;
    }
    const bridgeUrl = new URL(getCurrentScriptUrl());
    const bridgeRoot = new URL(".", bridgeUrl);
    const params = bridgeUrl.searchParams;
    const buildCacheKey = "b8ee54130b87";
    const cacheBust = params.get("v") || params.get("cache") || normalizeString2(getGlobalValue("ST_BRIDGE_CACHE_BUST")) || buildCacheKey;
    const forceReload = params.get("force") === "1";
    publishHostInfo({
      bridgeUrl: bridgeUrl.href,
      bridgeRoot: bridgeRoot.href,
      cacheBust,
      forceReload
    });
    function withCache(url) {
      const next = new URL(url);
      next.searchParams.set("_mama_bridge_v", cacheBust);
      return next.href;
    }
    function resolveUrl(path, base = bridgeRoot.href) {
      return new URL(path, base).href;
    }
    async function fetchJson(url) {
      const response = await fetch(withCache(url), { cache: "reload" });
      if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url}`);
      return response.json();
    }
    async function fetchText(url) {
      const response = await fetch(withCache(url), { cache: "reload" });
      if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url}`);
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
    function applyGlobals(pack, packId) {
      getBridgeTargets().forEach((target) => {
        try {
          target.ST_BRIDGE_PACK = packId;
          target.ST_BRIDGE_PRODUCT = pack.product || packId;
          if (isObject(pack.globals)) {
            Object.entries(pack.globals).forEach(([key, value]) => {
              target[key] = value;
            });
          }
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
        utils: { resolveUrl, withCache, bridgeRoot: bridgeRoot.href },
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
      (0, eval)(`${source}
//# sourceURL=${url}`);
      return { id: scriptId, type: "script", url };
    }
    async function loadScript(entry, manifestUrl) {
      const type = entry.type || "script";
      const url = resolveUrl(entry.url, manifestUrl);
      console.log(`${BRIDGE_NAME} loading ${entry.id || type}: ${url}`);
      if (type === "module") {
        await import(withCache(url));
        return { id: entry.id, type, url };
      }
      if (type === "script" || type === "classic") return runClassicScript(url, entry.id);
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
    async function main() {
      const manifestUrl = getManifestUrl();
      const manifest = await fetchJson(manifestUrl);
      const { id: packId, pack } = selectPack(manifest);
      const registry = getLoadedRegistry();
      const registryKey = `${manifestUrl}::${packId}::${cacheBust}`;
      if (registry[registryKey] && !forceReload) {
        exposeApi(registry[registryKey]);
        return registry[registryKey];
      }
      registerSchema("mama", {
        version: "0.1.0",
        rootKey: "stat_data",
        makeDefaultState: makeDefaultMamaState,
        normalize: normalizeMamaState$1
      });
      applyGlobals(pack, packId);
      const state = {
        bridgeVersion: VERSION,
        manifestUrl,
        manifestVersion: manifest.version || "",
        packId,
        product: pack.product || packId,
        label: pack.label || packId,
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
      return state;
    }
    await main();
  })();
})();
