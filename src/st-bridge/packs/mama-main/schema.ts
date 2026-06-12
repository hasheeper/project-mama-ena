import {
  DEFAULT_MAMA_STATE as SHARED_DEFAULT_MAMA_STATE,
  cloneJson,
  normalizeMamaState as normalizeSharedMamaState
} from '../../shared/mama';

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

  const DEFAULT_MAMA_STATE = SHARED_DEFAULT_MAMA_STATE;

  function clone(value, fallback: any = null): any {
    return cloneJson(value, fallback);
  }

  function makeDefaultMamaState() {
    return clone(DEFAULT_MAMA_STATE, DEFAULT_MAMA_STATE);
  }

  function normalizeMamaState(value = {}) {
    return normalizeSharedMamaState(value);
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

  function resolveRegisterMvuSchema() {
    try {
      if (typeof registerMvuSchema === 'function') return registerMvuSchema;
    } catch (_) {}
    try {
      if (typeof ROOT.registerMvuSchema === 'function') return ROOT.registerMvuSchema.bind(ROOT);
    } catch (_) {}
    try {
      const currentRoot = CURRENT_ROOT as any;
      if (typeof currentRoot.registerMvuSchema === 'function') return currentRoot.registerMvuSchema.bind(currentRoot);
    } catch (_) {}
    return null;
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
    const register = resolveRegisterMvuSchema();
    if (typeof register !== 'function') {
      console.warn(`${PLUGIN_NAME} registerMvuSchema unavailable`);
      return;
    }
    register(schemas.statDataSchema);
    console.info(`${PLUGIN_NAME} MVU-zod schema registered: stat_data.mama`);
  }

  if (typeof ROOT.$ === 'function') {
    ROOT.$(() => registerSchemaWhenReady());
  } else {
    registerSchemaWhenReady();
  }
})();
