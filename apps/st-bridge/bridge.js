/**
 * Stable Project MAMA SillyTavern bridge.
 *
 * ST should import only this file. The bridge selects a pack from manifest.json
 * and loads its scripts in a deterministic order.
 */
(async function () {
  'use strict';

  const ROOT = typeof window !== 'undefined' ? window : globalThis;
  const BRIDGE_NAME = '[MAMA ST Bridge]';
  const VERSION = '0.1.0';
  const DEFAULT_MANIFEST = './manifest.json';
  const FALLBACK_BRIDGE_URL = 'https://hasheeper.github.io/project-mama-ena/apps/st-bridge/bridge.js';

  function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function clone(value, fallback = null) {
    if (value === undefined || value === null) return fallback;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return fallback;
    }
  }

  function makeDefaultMamaState() {
    return {
      affection: 0,
      outfit: 'school_uniform',
      expression: 'exp_default',
      mascotComment: '使魔与主体反应序列已介入...',
      enaDialogue: '……你太吵了。顺毛刚好顺得我要睡着了，你安静点待一会儿嘛。'
    };
  }

  function clampNumber(value, min, max, fallback = 0) {
    const next = Number(value);
    if (!Number.isFinite(next)) return fallback;
    return Math.max(min, Math.min(max, Math.round(next)));
  }

  function normalizeMamaState(value) {
    const defaults = makeDefaultMamaState();
    const source = isObject(value) ? clone(value, {}) : {};
    return {
      affection: clampNumber(source.affection, 0, 255, defaults.affection),
      outfit: normalizeString(source.outfit, defaults.outfit),
      expression: normalizeString(source.expression, defaults.expression),
      mascotComment: normalizeString(source.mascotComment, defaults.mascotComment),
      enaDialogue: normalizeString(source.enaDialogue, defaults.enaDialogue)
    };
  }

  function normalizeString(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function isUsableBridgeUrl(value) {
    if (!value || typeof value !== 'string') return false;
    if (!/^https?:\/\//i.test(value)) return false;
    try {
      return new URL(value).pathname.endsWith('/bridge.js');
    } catch (_) {
      return false;
    }
  }

  function getCurrentScriptUrl() {
    try {
      if (isUsableBridgeUrl(document.currentScript && document.currentScript.src)) {
        return document.currentScript.src;
      }
    } catch (_) {}
    try {
      const scripts = Array.from(document.getElementsByTagName('script'));
      const matched = scripts.reverse().find((script) => isUsableBridgeUrl(script.src));
      if (matched && isUsableBridgeUrl(matched.src)) return matched.src;
    } catch (_) {}
    try {
      if (isUsableBridgeUrl(ROOT.ST_BRIDGE_URL)) return ROOT.ST_BRIDGE_URL;
    } catch (_) {}
    return FALLBACK_BRIDGE_URL;
  }

  const bridgeUrl = new URL(getCurrentScriptUrl());
  const bridgeRoot = new URL('.', bridgeUrl);
  const params = bridgeUrl.searchParams;
  const cacheBust = params.get('v') || params.get('cache') || '';
  const forceReload = params.get('force') === '1';

  function withCache(url) {
    if (!cacheBust) return url;
    const next = new URL(url);
    next.searchParams.set('_mama_bridge_v', cacheBust);
    return next.href;
  }

  function resolveUrl(path, base = bridgeRoot.href) {
    return new URL(path, base).href;
  }

  async function fetchJson(url) {
    const response = await fetch(withCache(url), { cache: cacheBust ? 'reload' : 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url}`);
    return response.json();
  }

  async function fetchText(url) {
    const response = await fetch(withCache(url), { cache: cacheBust ? 'reload' : 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url}`);
    return response.text();
  }

  function getManifestUrl() {
    const explicit = params.get('manifest') || ROOT.ST_BRIDGE_MANIFEST_URL;
    return explicit ? resolveUrl(explicit, bridgeRoot.href) : resolveUrl(DEFAULT_MANIFEST, bridgeRoot.href);
  }

  function selectPack(manifest) {
    const requested = params.get('pack') || ROOT.ST_BRIDGE_PACK || manifest.activePack || manifest.defaultPack;
    const pack = manifest.packs && manifest.packs[requested];
    if (!pack) {
      const available = Object.keys(manifest.packs || {}).join(', ') || '(none)';
      throw new Error(`Unknown pack "${requested}". Available packs: ${available}`);
    }
    return { id: requested, pack };
  }

  function applyGlobals(pack, packId) {
    ROOT.ST_BRIDGE_PACK = packId;
    ROOT.ST_BRIDGE_PRODUCT = pack.product || packId;
    if (isObject(pack.globals)) {
      Object.entries(pack.globals).forEach(([key, value]) => {
        ROOT[key] = value;
      });
    }
  }

  async function readVariables(options = {}) {
    const type = options.type || 'message';
    const request = { ...options, type };
    delete request.rootKey;
    if (typeof ROOT.getVariables !== 'function') {
      return isObject(ROOT.__MAMA_ST_BRIDGE_MEMORY__) ? clone(ROOT.__MAMA_ST_BRIDGE_MEMORY__, {}) : {};
    }
    try {
      const vars = await ROOT.getVariables(request);
      return isObject(vars) ? vars : {};
    } catch (error) {
      console.warn(`${BRIDGE_NAME} readVariables failed:`, error);
      return {};
    }
  }

  async function writeVariables(data, options = {}) {
    const type = options.type || 'message';
    const request = { ...options, type };
    delete request.rootKey;
    if (typeof ROOT.insertOrAssignVariables === 'function') {
      await ROOT.insertOrAssignVariables(data, request);
      return data;
    }
    if (typeof ROOT.updateVariablesWith === 'function') {
      return ROOT.updateVariablesWith((vars) => ({ ...(isObject(vars) ? vars : {}), ...data }), request);
    }
    ROOT.__MAMA_ST_BRIDGE_MEMORY__ = {
      ...(isObject(ROOT.__MAMA_ST_BRIDGE_MEMORY__) ? ROOT.__MAMA_ST_BRIDGE_MEMORY__ : {}),
      ...data
    };
    return data;
  }

  async function readState(rootKey = 'stat_data', stateKey = null, options = {}) {
    const vars = await readVariables(options);
    if (!stateKey) return isObject(vars[rootKey]) ? vars[rootKey] : null;
    return isObject(vars[rootKey] && vars[rootKey][stateKey]) ? vars[rootKey][stateKey] : null;
  }

  async function writeState(rootKey = 'stat_data', stateKey = null, state, options = {}) {
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

  async function patchState(rootKey = 'stat_data', stateKey = null, patcher, options = {}) {
    const current = await readState(rootKey, stateKey, options);
    const draft = clone(current, {});
    const result = await patcher(draft, current);
    return writeState(rootKey, stateKey, result || draft, options);
  }

  const schemaRegistry = isObject(ROOT.__MAMA_MVUZ_SCHEMAS__) ? ROOT.__MAMA_MVUZ_SCHEMAS__ : {};
  ROOT.__MAMA_MVUZ_SCHEMAS__ = schemaRegistry;

  function registerSchema(namespace, schema) {
    if (!namespace || !isObject(schema)) return null;
    schemaRegistry[namespace] = {
      namespace,
      version: schema.version || '0.1.0',
      rootKey: schema.rootKey || 'stat_data',
      makeDefaultState: typeof schema.makeDefaultState === 'function' ? schema.makeDefaultState : () => clone(schema.defaults, {}),
      normalize: typeof schema.normalize === 'function' ? schema.normalize : (value) => (isObject(value) ? clone(value, {}) : clone(schema.defaults, {})),
      migrate: typeof schema.migrate === 'function' ? schema.migrate : null
    };
    return schemaRegistry[namespace];
  }

  function getSchema(namespace = 'mama') {
    return schemaRegistry[namespace] || null;
  }

  function normalizeNamespaceState(namespace = 'mama', value = null) {
    const schema = getSchema(namespace);
    if (!schema) return isObject(value) ? clone(value, {}) : {};
    const base = value === undefined || value === null ? schema.makeDefaultState() : value;
    return schema.normalize(base);
  }

  async function readNamespace(namespace = 'mama', options = {}) {
    const schema = getSchema(namespace);
    const rootKey = options.rootKey || schema?.rootKey || 'stat_data';
    return normalizeNamespaceState(namespace, await readState(rootKey, namespace, options));
  }

  async function writeNamespace(namespace = 'mama', state, options = {}) {
    const schema = getSchema(namespace);
    const rootKey = options.rootKey || schema?.rootKey || 'stat_data';
    const normalized = normalizeNamespaceState(namespace, state);
    await writeState(rootKey, namespace, normalized, options);
    try {
      ROOT.dispatchEvent && ROOT.dispatchEvent(new CustomEvent('mama:mvuz-written', {
        detail: { namespace, rootKey, state: normalized }
      }));
    } catch (_) {}
    return normalized;
  }

  async function patchNamespace(namespace = 'mama', patcher, options = {}) {
    const current = await readNamespace(namespace, options);
    const draft = clone(current, {});
    const result = await patcher(draft, current);
    return writeNamespace(namespace, result || draft, options);
  }

  async function migrateNamespace(namespace = 'mama', legacyVars = null, options = {}) {
    const schema = getSchema(namespace);
    if (!schema || typeof schema.migrate !== 'function') {
      return writeNamespace(namespace, legacyVars || {}, options);
    }
    return writeNamespace(namespace, await schema.migrate(legacyVars || await readVariables(options)), options);
  }

  function exposeApi(state) {
    const existing = isObject(ROOT.STBridge) ? ROOT.STBridge : {};
    const actionHandlers = existing.actionHandlers || {};
    ROOT.STBridge = {
      ...existing,
      version: VERSION,
      state,
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
        actionHandlers[namespace] = { ...(actionHandlers[namespace] || {}), ...handlers };
      },
      async dispatch(namespace, action, payload = {}) {
        const handler = actionHandlers[namespace] && actionHandlers[namespace][action];
        if (typeof handler !== 'function') throw new Error(`No STBridge action handler for ${namespace}.${action}`);
        return handler(payload);
      },
      reload() {
        const next = new URL(bridgeUrl.href);
        next.searchParams.set('force', '1');
        next.searchParams.set('v', String(Date.now()));
        return import(next.href);
      }
    };
  }

  async function runClassicScript(url, scriptId) {
    const source = await fetchText(url);
    (0, eval)(`${source}\n//# sourceURL=${url}`);
    return { id: scriptId, type: 'script', url };
  }

  async function loadScript(entry, manifestUrl) {
    const type = entry.type || 'script';
    const url = resolveUrl(entry.url, manifestUrl);
    console.log(`${BRIDGE_NAME} loading ${entry.id || type}: ${url}`);
    if (type === 'module') {
      await import(withCache(url));
      return { id: entry.id, type, url };
    }
    if (type === 'script' || type === 'classic') return runClassicScript(url, entry.id);
    throw new Error(`Unsupported script type "${type}" for ${entry.id || entry.url}`);
  }

  function getLoadedRegistry() {
    if (!isObject(ROOT.__MAMA_ST_BRIDGE_LOADED__)) ROOT.__MAMA_ST_BRIDGE_LOADED__ = {};
    return ROOT.__MAMA_ST_BRIDGE_LOADED__;
  }

  async function main() {
    const manifestUrl = getManifestUrl();
    const manifest = await fetchJson(manifestUrl);
    const { id: packId, pack } = selectPack(manifest);
    const registry = getLoadedRegistry();
    const registryKey = `${manifestUrl}::${packId}::${cacheBust || 'default'}`;

    if (registry[registryKey] && !forceReload) {
      exposeApi(registry[registryKey]);
      return registry[registryKey];
    }

    registerSchema('mama', {
      version: '0.1.0',
      rootKey: 'stat_data',
      makeDefaultState: makeDefaultMamaState,
      normalize: normalizeMamaState
    });

    applyGlobals(pack, packId);
    const state = {
      bridgeVersion: VERSION,
      manifestUrl,
      manifestVersion: manifest.version || '',
      packId,
      product: pack.product || packId,
      label: pack.label || packId,
      loaded: [],
      loadedAt: new Date().toISOString()
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

    try {
      ROOT.dispatchEvent && ROOT.dispatchEvent(new CustomEvent('mama:bridge-loaded', { detail: state }));
    } catch (_) {}
    console.log(`${BRIDGE_NAME} loaded ${packId}`, state);
    return state;
  }

  await main();
})();
