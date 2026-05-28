import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

(function () {
  'use strict';

  const CURRENT_ROOT = typeof window !== 'undefined' ? window : globalThis;
  const PLUGIN_NAME = '[MAMA Schema]';

  function resolveBridgeHost() {
    try { if (CURRENT_ROOT.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.MAMA_ST_HOST_ROOT?.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST_ROOT.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.parent?.MAMA_ST_HOST) return CURRENT_ROOT.parent.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.top?.MAMA_ST_HOST) return CURRENT_ROOT.top.MAMA_ST_HOST; } catch (_) {}
    return {};
  }

  const BRIDGE_HOST = resolveBridgeHost();
  const ROOT = BRIDGE_HOST.apiRoot || CURRENT_ROOT.MAMA_ST_API_ROOT || CURRENT_ROOT.MAMA_ST_HOST_ROOT || CURRENT_ROOT;

  const DEFAULT_MAMA_STATE = {
    affection: 0,
    outfit: 'school_uniform',
    expression: 'exp_default',
    mascotComment: '使魔与主体反应序列已介入...',
    enaDialogue: '……你太吵了。顺毛刚好顺得我要睡着了，你安静点待一会儿嘛。'
  };

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

  function clampNumber(value, min, max, fallback = 0) {
    const next = Number(value);
    if (!Number.isFinite(next)) return fallback;
    return Math.max(min, Math.min(max, Math.round(next)));
  }

  function normalizeString(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function makeDefaultMamaState() {
    return clone(DEFAULT_MAMA_STATE, DEFAULT_MAMA_STATE);
  }

  function normalizeMamaState(value = {}) {
    const source = isObject(value) ? clone(value, {}) : {};
    return {
      affection: clampNumber(source.affection, 0, 255, DEFAULT_MAMA_STATE.affection),
      outfit: normalizeString(source.outfit, DEFAULT_MAMA_STATE.outfit),
      expression: normalizeString(source.expression, DEFAULT_MAMA_STATE.expression),
      mascotComment: normalizeString(source.mascotComment, DEFAULT_MAMA_STATE.mascotComment),
      enaDialogue: normalizeString(source.enaDialogue, DEFAULT_MAMA_STATE.enaDialogue)
    };
  }

  function resolveZod() {
    return ROOT.z || ROOT.zod || ROOT.Zod || null;
  }

  function createStatDataSchema() {
    const zod = resolveZod();
    if (!zod || typeof zod.object !== 'function' || typeof zod.any !== 'function') return null;
    const mamaSchema = zod.any().default({}).transform((value) => normalizeMamaState(value));
    const statDataSchema = zod.object({
      mama: mamaSchema
    }).passthrough().transform((statData) => ({
      ...statData,
      mama: normalizeMamaState(statData.mama)
    }));
    return { mamaSchema, statDataSchema };
  }

  const schemas = createStatDataSchema();

  ROOT.MAMASchemaRuntime = {
    product: 'mama-ena',
    DEFAULT_MAMA_STATE,
    makeDefaultMamaState,
    normalizeMamaState,
    MamaSchema: schemas?.mamaSchema || null,
    MAMAStatDataSchema: schemas?.statDataSchema || null
  };

  function registerSchemaWhenReady() {
    try {
      ROOT.STBridge?.mvuz?.registerSchema?.('mama', {
        version: '0.1.0',
        rootKey: 'stat_data',
        makeDefaultState: makeDefaultMamaState,
        normalize: normalizeMamaState
      });
    } catch (error) {
      console.warn(`${PLUGIN_NAME} STBridge schema registration skipped:`, error);
    }

    if (!schemas?.statDataSchema) {
      console.warn(`${PLUGIN_NAME} MVU-zod schema skipped: zod runtime unavailable`);
      return;
    }
    if (typeof registerMvuSchema !== 'function') {
      console.warn(`${PLUGIN_NAME} registerMvuSchema unavailable`);
      return;
    }
    registerMvuSchema(schemas.statDataSchema);
    console.info(`${PLUGIN_NAME} MVU-zod schema registered: stat_data.mama`);
  }

  if (typeof ROOT.$ === 'function') {
    ROOT.$(() => registerSchemaWhenReady());
  } else {
    registerSchemaWhenReady();
  }
})();
