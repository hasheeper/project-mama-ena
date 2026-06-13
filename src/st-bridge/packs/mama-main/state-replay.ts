/**
 * MAMA minimal state replay runtime.
 */
import {
  MAMA_ALLOWED_FIELD_PATHS,
  MAMA_NAMESPACE,
  MAMA_STAT_KEY,
  MAMA_TIME_PHASES,
  cloneJson,
  normalizeMamaState as normalizeSharedMamaState
} from '../../shared/mama';

(function () {
  'use strict';

  const CURRENT_ROOT = typeof window !== 'undefined' ? window : globalThis;

  function resolveBridgeHost() {
    try { if (CURRENT_ROOT.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.MAMA_ST_HOST_ROOT?.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST_ROOT.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.parent?.MAMA_ST_HOST) return CURRENT_ROOT.parent.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.top?.MAMA_ST_HOST) return CURRENT_ROOT.top.MAMA_ST_HOST; } catch (_) {}
    return {};
  }

  const BRIDGE_HOST = resolveBridgeHost();
  const ROOT = BRIDGE_HOST.apiRoot || CURRENT_ROOT.MAMA_ST_API_ROOT || CURRENT_ROOT.MAMA_ST_HOST_ROOT || CURRENT_ROOT;
  const RUNTIME = ROOT.MAMAMainRuntime || CURRENT_ROOT.MAMAMainRuntime || {};
  ROOT.MAMAMainRuntime = RUNTIME;
  CURRENT_ROOT.MAMAMainRuntime = RUNTIME;

  const STAT_KEY = MAMA_STAT_KEY;
  const MAMA_KEY = MAMA_NAMESPACE;
  const REPLAY_PREFIX = 'MAMA_REPLAY';
  const PASSIVE_CORRUPTION_OPERATION_PREFIX = 'corruption:passive';
  const ALLOWED_FIELD_PATHS = [...MAMA_ALLOWED_FIELD_PATHS];
  const TIME_PHASE_ORDER = MAMA_TIME_PHASES.reduce((order, phase, index) => {
    order[phase] = index;
    return order;
  }, {} as Record<string, number>);
  const TIME_PHASE_PASSIVE_CORRUPTION_GAIN = {
    morning: 2,
    noon: 2,
    dusk: 2,
    night: 4
  };
  const FULL_DAY_PASSIVE_CORRUPTION_GAIN = MAMA_TIME_PHASES.reduce((total, phase) => {
    return total + (TIME_PHASE_PASSIVE_CORRUPTION_GAIN[phase] || 0);
  }, 0);
  const PASSIVE_CORRUPTION_REPLAY_RETRY_DELAYS = [250, 750, 1500, 3000, 5000];
  const PASSIVE_CORRUPTION_REPLAY_MAX_ATTEMPTS = PASSIVE_CORRUPTION_REPLAY_RETRY_DELAYS.length + 1;
  let passiveCorruptionSyncDepth = 0;
  let passiveCorruptionReplayFlushPromise: Promise<void> | null = null;
  let passiveCorruptionReplayRetryTimer: any = null;
  const passiveCorruptionReplayQueue = new Map<string, any>();

  function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function clone(value, fallback: any = null): any {
    return cloneJson(value, fallback);
  }

  function normalizeMamaState(value) {
    if (typeof ROOT.MAMASchemaRuntime?.normalizeMamaState === 'function') {
      return ROOT.MAMASchemaRuntime.normalizeMamaState(value);
    }
    if (typeof ROOT.STBridge?.mvuz?.normalize === 'function') {
      return ROOT.STBridge.mvuz.normalize('mama', value);
    }
    return normalizeSharedMamaState(value);
  }

  function getTimePhaseOrder(value) {
    const phase = typeof value === 'string' ? value.trim() : '';
    return Object.prototype.hasOwnProperty.call(TIME_PHASE_ORDER, phase) ? TIME_PHASE_ORDER[phase] : -1;
  }

  function readSafeDay(value) {
    const day = readFiniteNumber(value);
    if (!Number.isFinite(day)) return null;
    return Math.max(1, Math.min(9999, Math.round(day)));
  }

  function readSafeWeek(value) {
    const week = readFiniteNumber(value);
    if (!Number.isFinite(week)) return null;
    return Math.max(1, Math.min(9999, Math.round(week)));
  }

  function clampCorruption(value) {
    const number = readFiniteNumber(value);
    const safeValue = Number.isFinite(number) ? Math.round(number) : 0;
    return Math.max(0, Math.min(100, safeValue));
  }

  function readFiniteNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return Number(value);
    const trimmed = value.trim();
    if (!trimmed) return Number.NaN;
    const normalized = trimmed.replace(/,/g, '');
    const exact = Number(normalized);
    if (Number.isFinite(exact)) return exact;
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : Number.NaN;
  }

  function hasCalendarAdvanced(beforeMama, afterMama) {
    const beforeWeek = readSafeWeek(beforeMama?.week);
    const afterWeek = readSafeWeek(afterMama?.week);
    const beforeDay = readSafeDay(beforeMama?.day);
    const afterDay = readSafeDay(afterMama?.day);
    if (beforeWeek !== null && afterWeek !== null && afterWeek > beforeWeek) return true;
    if (beforeDay !== null && afterDay !== null && afterDay > beforeDay) return true;
    return false;
  }

  function getPhaseByIndex(index) {
    const normalizedIndex = ((index % MAMA_TIME_PHASES.length) + MAMA_TIME_PHASES.length) % MAMA_TIME_PHASES.length;
    return MAMA_TIME_PHASES[normalizedIndex];
  }

  function computePassiveCorruptionGain(beforeMama, afterMama) {
    const beforePhaseIndex = getTimePhaseOrder(beforeMama?.timePhase);
    const afterPhaseIndex = getTimePhaseOrder(afterMama?.timePhase);
    if (beforePhaseIndex < 0 || afterPhaseIndex < 0) {
      return hasCalendarAdvanced(beforeMama, afterMama) ? FULL_DAY_PASSIVE_CORRUPTION_GAIN : 0;
    }

    if (beforePhaseIndex === afterPhaseIndex) {
      return hasCalendarAdvanced(beforeMama, afterMama) ? FULL_DAY_PASSIVE_CORRUPTION_GAIN : 0;
    }

    let total = 0;
    let index = beforePhaseIndex;
    let guard = 0;
    while (guard < MAMA_TIME_PHASES.length) {
      index = (index + 1) % MAMA_TIME_PHASES.length;
      const phase = getPhaseByIndex(index);
      total += TIME_PHASE_PASSIVE_CORRUPTION_GAIN[phase] || 0;
      if (index === afterPhaseIndex) return total;
      guard += 1;
    }
    return 0;
  }

  function normalizeMamaTransition(beforeMama, nextMama, options: any = {}) {
    const normalized = normalizeMamaState(nextMama);
    if (!isObject(beforeMama)) return normalized;

    const beforePhaseIndex = getTimePhaseOrder(beforeMama.timePhase);
    const nextPhaseIndex = getTimePhaseOrder(nextMama?.timePhase);
    let transitioned = normalized;
    if (beforePhaseIndex >= 0 && nextPhaseIndex >= 0 && nextPhaseIndex < beforePhaseIndex) {
      const beforeDay = readSafeDay(beforeMama.day);
      if (beforeDay !== null) {
        const expectedDay = Math.min(9999, beforeDay + 1);
        const normalizedDay = readSafeDay(normalized.day);
        if (normalizedDay === null || normalizedDay < expectedDay) {
          transitioned = { ...transitioned, day: expectedDay };
        }
      }
    }

    const passiveGain = computePassiveCorruptionGain(beforeMama, transitioned);
    if (passiveGain <= 0) return transitioned;
    if (options.applyPassiveCorruption === false) return transitioned;
    const nextCorruption = clampCorruption(transitioned.corruptionLevel);

    return {
      ...transitioned,
      corruptionLevel: nextCorruption + passiveGain > 100
        ? 100
        : nextCorruption + passiveGain
    };
  }

  function computePassiveCorruptionTransition(nextVariables, beforeVariables) {
    const nextStatData = isObject(nextVariables?.[STAT_KEY]) ? nextVariables[STAT_KEY] : null;
    const beforeStatData = isObject(beforeVariables?.[STAT_KEY]) ? beforeVariables[STAT_KEY] : null;
    const nextMama = isObject(nextStatData?.[MAMA_KEY]) ? nextStatData[MAMA_KEY] : null;
    const beforeMama = isObject(beforeStatData?.[MAMA_KEY]) ? beforeStatData[MAMA_KEY] : null;
    if (!nextStatData || !nextMama || !beforeMama) return null;

    const transitioned = normalizeMamaTransition(beforeMama, nextMama);
    if (areJsonValuesEqual(nextMama, transitioned)) return null;
    const patches = buildPassiveCorruptionReplayPatches(nextMama, transitioned);
    if (!patches.length) return null;
    return { nextStatData, nextMama, beforeMama, transitioned, patches };
  }

  function applyPassiveCorruptionTransition(nextVariables, transition) {
    const { nextStatData, transitioned } = transition;
    nextStatData[MAMA_KEY] = transitioned;
    if (isObject(nextVariables.display_data)) nextVariables.display_data[MAMA_KEY] = transitioned;
  }

  function syncPassiveCorruptionTransition(nextVariables, beforeVariables) {
    const transition = computePassiveCorruptionTransition(nextVariables, beforeVariables);
    if (!transition) return false;
    queuePassiveCorruptionReplay(transition, 'sync');
    return true;
  }

  function formatPassiveCorruptionOperationId(beforeMama, afterMama) {
    const week = readSafeWeek(afterMama?.week) || readSafeWeek(beforeMama?.week) || 1;
    const day = readSafeDay(afterMama?.day) || readSafeDay(beforeMama?.day) || 1;
    const phase = typeof afterMama?.timePhase === 'string' && afterMama.timePhase
      ? afterMama.timePhase
      : 'unknown';
    return `${PASSIVE_CORRUPTION_OPERATION_PREFIX}:W${week}D${day}:${phase}`;
  }

  function buildPassiveCorruptionReplayPatches(nextMama, transitioned) {
    return buildMamaStatePatches(
      { [MAMA_KEY]: nextMama },
      { [MAMA_KEY]: transitioned }
    ).filter((patch) => {
      return patch?.path === '/mama/corruptionLevel' || patch?.path === '/mama/day';
    });
  }

  async function writePassiveCorruptionReplay(transition) {
    const operationId = formatPassiveCorruptionOperationId(transition.beforeMama, transition.transitioned);
    return commitMamaReplayPatch({
      messageId: transition.messageId,
      operationId,
      patches: transition.patches,
      refresh: 'affected',
      suppressPassiveCorruptionSync: true
    });
  }

  function clonePassiveCorruptionTransition(transition, reason = 'event') {
    const operationId = formatPassiveCorruptionOperationId(transition.beforeMama, transition.transitioned);
    const messageId = resolveReplayMessageId({});
    const hasMessageId = messageId !== null && messageId !== undefined;
    return {
      operationId,
      reason,
      attempts: 0,
      messageId: hasMessageId && Number.isFinite(Number(messageId)) && Number(messageId) >= 0 ? Math.round(Number(messageId)) : null,
      beforeMama: clone(transition.beforeMama, {}),
      nextMama: clone(transition.nextMama, {}),
      transitioned: clone(transition.transitioned, {}),
      patches: clone(transition.patches, [])
    };
  }

  function publishPassiveCorruptionReplayDebug(entry, result) {
    try {
      ROOT.__MAMA_LAST_PASSIVE_CORRUPTION_REPLAY__ = {
        operationId: entry?.operationId || '',
        reason: entry?.reason || '',
        attempts: entry?.attempts || 0,
        messageId: entry?.messageId ?? null,
        patches: clone(entry?.patches, []),
        result
      };
    } catch (_) {}
  }

  function schedulePassiveCorruptionReplayFlush(delay = PASSIVE_CORRUPTION_REPLAY_RETRY_DELAYS[0]) {
    if (passiveCorruptionReplayRetryTimer) return;
    passiveCorruptionReplayRetryTimer = setTimeout(() => {
      passiveCorruptionReplayRetryTimer = null;
      flushPassiveCorruptionReplayQueue();
    }, delay);
  }

  function queuePassiveCorruptionReplay(transition, reason = 'event') {
    const entry = clonePassiveCorruptionTransition(transition, reason);
    const previous = passiveCorruptionReplayQueue.get(entry.operationId);
    if (previous) {
      entry.attempts = previous.attempts || 0;
      entry.messageId = previous.messageId ?? entry.messageId;
    }
    passiveCorruptionReplayQueue.set(entry.operationId, entry);
    schedulePassiveCorruptionReplayFlush();
    return entry;
  }

  function getNextPassiveCorruptionReplayDelay() {
    let attempts = 0;
    passiveCorruptionReplayQueue.forEach((entry) => {
      attempts = Math.max(attempts, Number(entry?.attempts) || 0);
    });
    const index = Math.max(0, Math.min(PASSIVE_CORRUPTION_REPLAY_RETRY_DELAYS.length - 1, attempts));
    return PASSIVE_CORRUPTION_REPLAY_RETRY_DELAYS[index];
  }

  async function flushPassiveCorruptionReplayQueue() {
    if (passiveCorruptionReplayFlushPromise) return passiveCorruptionReplayFlushPromise;
    passiveCorruptionReplayFlushPromise = (async () => {
      for (const entry of Array.from(passiveCorruptionReplayQueue.values())) {
        if (!passiveCorruptionReplayQueue.has(entry.operationId)) continue;
        entry.attempts = (Number(entry.attempts) || 0) + 1;
        const result = await writePassiveCorruptionReplay(entry);
        publishPassiveCorruptionReplayDebug(entry, result);
        if (result?.ok) {
          passiveCorruptionReplayQueue.delete(entry.operationId);
          notifyStateChanged(normalizeMamaState(entry.transitioned));
          continue;
        }
        if (entry.attempts >= PASSIVE_CORRUPTION_REPLAY_MAX_ATTEMPTS) {
          passiveCorruptionReplayQueue.delete(entry.operationId);
          console.warn('[MAMA State Replay] passive corruption replay skipped because the context block could not be written:', result);
          continue;
        }
        passiveCorruptionReplayQueue.set(entry.operationId, entry);
      }
    })().finally(() => {
      passiveCorruptionReplayFlushPromise = null;
      if (passiveCorruptionReplayQueue.size > 0) {
        schedulePassiveCorruptionReplayFlush(getNextPassiveCorruptionReplayDelay());
      }
    });
    return passiveCorruptionReplayFlushPromise;
  }

  function clearPassiveCorruptionReplayQueue() {
    passiveCorruptionReplayQueue.clear();
    if (passiveCorruptionReplayRetryTimer) {
      clearTimeout(passiveCorruptionReplayRetryTimer);
      passiveCorruptionReplayRetryTimer = null;
    }
  }

  function resolveEventOn() {
    try {
      if (typeof eventOn === 'function') return eventOn;
    } catch (_) {}
    try {
      if (typeof ROOT.eventOn === 'function') return ROOT.eventOn.bind(ROOT);
    } catch (_) {}
    return null;
  }

  function resolveTavernEventName(name, fallback) {
    try {
      const value = tavern_events?.[name];
      if (typeof value === 'string' && value) return value;
    } catch (_) {}
    try {
      const value = ROOT.tavern_events?.[name];
      if (typeof value === 'string' && value) return value;
    } catch (_) {}
    return fallback;
  }

  function startPassiveCorruptionSync() {
    const eventOnApi = resolveEventOn();
    if (!eventOnApi) return null;
    const stops: any[] = [];
    const handler = async (nextVariables, beforeVariables) => {
      try {
        if (passiveCorruptionSyncDepth > 0) return;
        const transition = computePassiveCorruptionTransition(nextVariables, beforeVariables);
        if (!transition) return;
        queuePassiveCorruptionReplay(transition, 'mag_variable_update_ended');
      } catch (error) {
        console.warn('[MAMA State Replay] passive corruption sync failed:', error);
      }
    };
    const flushHandler = () => {
      if (passiveCorruptionReplayQueue.size > 0) schedulePassiveCorruptionReplayFlush(50);
    };
    const bind = (eventName, listener) => {
      if (!eventName) return;
      try {
        const stop = eventOnApi(eventName, listener);
        stops.push(stop);
      } catch (_) {}
    };
    bind('mag_variable_update_ended', handler);
    bind(resolveTavernEventName('MESSAGE_UPDATED', 'message_updated'), flushHandler);
    bind(resolveTavernEventName('MESSAGE_RECEIVED', 'message_received'), flushHandler);
    bind(resolveTavernEventName('CHARACTER_MESSAGE_RENDERED', 'character_message_rendered'), flushHandler);
    return () => {
      stops.splice(0).forEach((stop) => {
        try {
          if (typeof stop === 'function') stop();
          else if (stop && typeof stop.stop === 'function') stop.stop();
        } catch (_) {}
      });
      clearPassiveCorruptionReplayQueue();
    };
  }

  function areJsonValuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function readJsonPointer(root, pointer) {
    if (!pointer || pointer === '/') return root;
    const parts = String(pointer).split('/').slice(1).map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
    let current = root;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  function buildReplayPatch(op, path, value) {
    const patch: any = { op, path };
    if (op !== 'remove') patch.value = clone(value, value);
    return patch;
  }

  function buildMamaFieldPatch(path, beforeValue, afterValue) {
    if (beforeValue === undefined) return buildReplayPatch('add', path, afterValue);
    if (path === '/mama/affection' || path === '/mama/livingExpense') {
      const beforeNumber = Number(beforeValue);
      const afterNumber = Number(afterValue);
      if (Number.isFinite(beforeNumber) && Number.isFinite(afterNumber)) {
        return buildReplayPatch('delta', path, Math.round(afterNumber) - Math.round(beforeNumber));
      }
    }
    return buildReplayPatch('replace', path, afterValue);
  }

  function buildMamaStatePatches(beforeStatData, afterStatData) {
    const beforeMama = isObject(beforeStatData?.[MAMA_KEY]) ? beforeStatData[MAMA_KEY] : null;
    const afterMama = normalizeMamaTransition(beforeMama, afterStatData?.[MAMA_KEY], {
      applyPassiveCorruption: false
    });
    if (!beforeMama) return [buildReplayPatch('add', '/mama', afterMama)];

    const normalizedAfterStatData = { ...afterStatData, [MAMA_KEY]: afterMama };
    const patches: any[] = [];
    for (const path of ALLOWED_FIELD_PATHS) {
      const beforeValue = readJsonPointer(beforeStatData, path);
      const afterValue = readJsonPointer(normalizedAfterStatData, path);
      if (afterValue === undefined || areJsonValuesEqual(beforeValue, afterValue)) continue;
      patches.push(buildMamaFieldPatch(path, beforeValue, afterValue));
    }
    return patches;
  }

  function buildMamaValuePatches(statData) {
    const mama = normalizeMamaState(statData?.[MAMA_KEY]);
    return [buildReplayPatch('add', '/mama', mama)];
  }

  function sanitizeReplayOperationId(value) {
    return String(value || 'mama')
      .trim()
      .replace(/[^\w:.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'mama';
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function buildMamaReplayBlock(operationId, patches) {
    const id = sanitizeReplayOperationId(operationId);
    return [
      '<UpdateVariable>',
      `<Analyze>${REPLAY_PREFIX}:${id}</Analyze>`,
      '<JSONPatch>',
      JSON.stringify(patches, null, 2),
      '</JSONPatch>',
      '</UpdateVariable>'
    ].join('\n');
  }

  function stripMamaReplayBlock(content, operationId) {
    const id = sanitizeReplayOperationId(operationId);
    const text = typeof content === 'string' ? content : '';
    const pattern = new RegExp(
      `\\n*<UpdateVariable>\\s*<Analyze>\\s*${REPLAY_PREFIX}:${escapeRegExp(id)}\\s*<\\/Analyze>\\s*<JSONPatch>[\\s\\S]*?<\\/JSONPatch>\\s*<\\/UpdateVariable>\\s*`,
      'gi'
    );
    return text.replace(pattern, '\n\n').replace(/\n{4,}/g, '\n\n\n').trimEnd();
  }

  function insertMamaReplayBlock(content, block) {
    const text = typeof content === 'string' ? content : '';
    const placeholder = '<StatusPlaceHolderImpl/>';
    const index = text.indexOf(placeholder);
    if (index >= 0) {
      const before = text.slice(0, index).trimEnd();
      const after = text.slice(index);
      return `${before}\n\n${block}\n\n${after.trimStart()}`;
    }
    const trimmed = text.trimEnd();
    return trimmed ? `${trimmed}\n\n${block}` : block;
  }

  function parseMessageIdFromFloorKey(floorKey) {
    const match = String(floorKey || '').trim().match(/^message:(\d+)$/i);
    if (!match) return null;
    const id = Number(match[1]);
    return Number.isFinite(id) && id >= 0 ? Math.round(id) : null;
  }

  function makeMessageFloorKey(messageId) {
    if (messageId === null || messageId === undefined || messageId === '') return '';
    const id = Number(messageId);
    return Number.isFinite(id) && id >= 0 ? `message:${Math.round(id)}` : '';
  }

  function getLatestMessageId() {
    try {
      if (typeof ROOT.getCurrentMessageId === 'function') {
        const id = Number(ROOT.getCurrentMessageId());
        if (Number.isFinite(id) && id >= 0) return Math.round(id);
      }
    } catch (_) {}
    try {
      if (typeof ROOT.getChatMessages === 'function') {
        const latest = ROOT.getChatMessages(-1)?.[0];
        const id = Number(latest?.message_id);
        if (Number.isFinite(id) && id >= 0) return Math.round(id);
      }
    } catch (_) {}
    try {
      if (typeof ROOT.getLastMessageId === 'function') {
        const id = Number(ROOT.getLastMessageId());
        if (Number.isFinite(id) && id >= 0) return Math.round(id);
      }
    } catch (_) {}
    return null;
  }

  function resolveReplayMessageId(options: any = {}) {
    const explicitId = Number(options.messageId ?? options.message_id);
    if (Number.isFinite(explicitId) && explicitId >= 0) return Math.round(explicitId);
    const floorId = parseMessageIdFromFloorKey(options.floorKey);
    if (floorId !== null) return floorId;
    return getLatestMessageId();
  }

  function hasMvuReplayBase(vars) {
    return isObject(vars) && isObject(vars.stat_data) && Object.prototype.hasOwnProperty.call(vars, 'schema');
  }

  async function getMessageVariableBundle(messageId) {
    if (typeof ROOT.getVariables !== 'function') return null;
    try {
      const id = Number(messageId);
      const options: any = { type: 'message' };
      if (Number.isFinite(id) && id >= 0) options.message_id = Math.round(id);
      const vars = await ROOT.getVariables(options);
      return isObject(vars) ? vars : null;
    } catch (error) {
      console.warn('[MAMA State Replay] failed to read message MVU variables:', error);
      return null;
    }
  }

  async function readStatData(options: any = {}) {
    const state = await ROOT.STBridge?.mvuz?.read?.('mama', { type: 'message' });
    return { [MAMA_KEY]: normalizeMamaState(state) };
  }

  async function loadState(options: any = {}) {
    const statData = await readStatData(options);
    return normalizeMamaState(statData[MAMA_KEY]);
  }

  function resolveMvuReplayHandler() {
    const candidates: any[] = [];
    const seen: any[] = [];
    const pushHandler = (owner) => {
      try {
        const fn = owner && owner.handleVariablesInMessage;
        if (typeof fn !== 'function' || seen.includes(fn)) return;
        seen.push(fn);
        candidates.push(fn.bind(owner));
      } catch (_) {}
    };
    try {
      if (typeof handleVariablesInMessage === 'function' && !seen.includes(handleVariablesInMessage)) {
        seen.push(handleVariablesInMessage);
        candidates.push(handleVariablesInMessage);
      }
    } catch (_) {}
    try { pushHandler(ROOT); } catch (_) {}
    try { pushHandler(ROOT.parent); } catch (_) {}
    try { pushHandler(ROOT.top); } catch (_) {}
    try { pushHandler(typeof unsafeWindow === 'object' ? unsafeWindow : null); } catch (_) {}
    try { pushHandler(typeof unsafeWindow === 'object' ? unsafeWindow?.parent : null); } catch (_) {}
    try { pushHandler(typeof unsafeWindow === 'object' ? unsafeWindow?.top : null); } catch (_) {}
    try { pushHandler(ROOT.STBridge?.mvu); } catch (_) {}
    return candidates[0] || null;
  }

  function resolveMvuApi() {
    const candidates: any[] = [];
    const pushOwner = (owner) => {
      try {
        if (owner && !candidates.includes(owner)) candidates.push(owner);
      } catch (_) {}
    };
    try { pushOwner(ROOT); } catch (_) {}
    try { pushOwner(ROOT.parent); } catch (_) {}
    try { pushOwner(ROOT.top); } catch (_) {}
    try { pushOwner(typeof unsafeWindow === 'object' ? unsafeWindow : null); } catch (_) {}
    try { pushOwner(typeof unsafeWindow === 'object' ? unsafeWindow?.parent : null); } catch (_) {}
    try { pushOwner(typeof unsafeWindow === 'object' ? unsafeWindow?.top : null); } catch (_) {}
    for (const owner of candidates) {
      const api = owner?.Mvu;
      if (api && typeof api.parseMessage === 'function' && typeof api.replaceMvuData === 'function') return api;
    }
    return null;
  }

  async function getMvuReplayBaseVariables(messageId) {
    const id = Math.round(Number(messageId) || 0);
    const previousId = id > 0 ? id - 1 : 0;
    const previousVars = await getMessageVariableBundle(previousId);
    if (hasMvuReplayBase(previousVars)) return clone(previousVars, previousVars);
    if (id === 0) {
      const currentVars = await getMessageVariableBundle(0);
      if (hasMvuReplayBase(currentVars)) return clone(currentVars, currentVars);
    }
    return null;
  }

  async function replayMessageThroughMvu(messageId, options: any = {}) {
    const replayHandler = resolveMvuReplayHandler();
    const suppressPassiveCorruptionSync = options.suppressPassiveCorruptionSync === true;
    if (suppressPassiveCorruptionSync) passiveCorruptionSyncDepth += 1;
    try {
      if (typeof replayHandler === 'function') {
        await replayHandler(messageId);
        return { ok: true, method: 'handleVariablesInMessage' };
      }

      const mvuApi = resolveMvuApi();
      if (!mvuApi) return { ok: false, reason: 'mvu_replay_unavailable' };

      const id = Math.round(Number(messageId) || 0);
      const msg = typeof ROOT.getChatMessages === 'function' ? ROOT.getChatMessages(id)?.[0] : null;
      if (!msg || typeof msg.message !== 'string') return { ok: false, reason: 'message_not_found' };

      const baseVars = await getMvuReplayBaseVariables(id);
      if (!hasMvuReplayBase(baseVars)) return { ok: false, reason: 'mvu_replay_missing_base' };

      const nextVars = await mvuApi.parseMessage(msg.message, baseVars);
      if (!hasMvuReplayBase(nextVars)) return { ok: false, reason: 'mvu_replay_parse_failed' };
      await mvuApi.replaceMvuData(nextVars, { type: 'message', message_id: id });
      return { ok: true, method: 'Mvu.parseMessage' };
    } finally {
      if (suppressPassiveCorruptionSync) passiveCorruptionSyncDepth = Math.max(0, passiveCorruptionSyncDepth - 1);
    }
  }

  async function parseMvuVariablesFromMessage(messageId, messageText) {
    const mvuApi = resolveMvuApi();
    if (!mvuApi) return null;
    const baseVars = await getMvuReplayBaseVariables(messageId);
    if (!hasMvuReplayBase(baseVars)) return null;
    try {
      const parsed = await mvuApi.parseMessage(String(messageText || ''), baseVars);
      return hasMvuReplayBase(parsed) ? parsed : null;
    } catch (error) {
      console.warn('[MAMA State Replay] failed to parse stripped replay baseline:', error);
      return null;
    }
  }

  function normalizeReplayPatches(patches) {
    const byPath = new Map();
    (Array.isArray(patches) ? patches : []).forEach((patch) => {
      if (!patch || typeof patch !== 'object') return;
      const path = typeof patch.path === 'string' ? patch.path.trim() : '';
      const allowed = path === '/mama' || ALLOWED_FIELD_PATHS.includes(path);
      if (!allowed) return;
      byPath.set(path, { ...patch, path });
    });
    return Array.from(byPath.values());
  }

  async function commitMamaReplayPatch(options: any = {}) {
    const messageId = resolveReplayMessageId(options);
    if (!Number.isFinite(Number(messageId)) || Number(messageId) < 0) {
      return { ok: false, reason: 'missing_message_id' };
    }

    const normalizedMessageId = Math.round(Number(messageId));
    const expectedFloorKey = typeof options.floorKey === 'string' ? options.floorKey.trim() : '';
    const actualFloorKey = makeMessageFloorKey(normalizedMessageId);
    if (expectedFloorKey && expectedFloorKey !== actualFloorKey) {
      return { ok: false, reason: 'floor_key_mismatch', floorKey: actualFloorKey, expectedFloorKey };
    }

    if (typeof ROOT.getChatMessages !== 'function' || typeof ROOT.setChatMessages !== 'function') {
      if (isObject(options.afterStatData?.[MAMA_KEY])) {
        const state = normalizeMamaState(options.afterStatData[MAMA_KEY]);
        await ROOT.STBridge?.mvuz?.write?.('mama', state, { type: 'message' });
        return { ok: true, method: 'direct-mvuz-write', patchCount: 0, state };
      }
      return { ok: false, reason: 'chat_message_api_unavailable', messageId: normalizedMessageId, floorKey: actualFloorKey };
    }

    const vars = await getMessageVariableBundle(normalizedMessageId);
    if (!hasMvuReplayBase(vars)) {
      return { ok: false, reason: 'mvu_replay_missing_base', messageId: normalizedMessageId, floorKey: actualFloorKey };
    }

    const messages = ROOT.getChatMessages(normalizedMessageId);
    const msg = Array.isArray(messages) ? messages[0] : null;
    if (!msg || typeof msg !== 'object') {
      return { ok: false, reason: 'message_not_found', messageId: normalizedMessageId, floorKey: actualFloorKey };
    }

    const hasReplayHandler = typeof resolveMvuReplayHandler() === 'function';
    const hasMvuApi = Boolean(resolveMvuApi());
    if (!hasReplayHandler && !hasMvuApi) {
      return { ok: false, reason: 'mvu_replay_unavailable', messageId: normalizedMessageId, floorKey: actualFloorKey };
    }

    const operationId = sanitizeReplayOperationId(options.operationId || 'state:mama');
    const stripIds = [
      operationId,
      ...(Array.isArray(options.replaceOperationIds) ? options.replaceOperationIds : [])
    ].map(sanitizeReplayOperationId).filter(Boolean);
    const originalMessage = msg.message || '';
    const stripped = Array.from(new Set(stripIds)).reduce((content, stripId) => stripMamaReplayBlock(content, stripId), originalMessage);

    let patchList = Array.isArray(options.patches) ? normalizeReplayPatches(options.patches) : [];
    if (isObject(options.afterStatData)) {
      const parsedBaseline = await parseMvuVariablesFromMessage(normalizedMessageId, stripped);
      const baselineStatData = hasMvuReplayBase(parsedBaseline)
        ? parsedBaseline.stat_data
        : (isObject(options.beforeStatData) ? options.beforeStatData : vars.stat_data);
      patchList = buildMamaStatePatches(baselineStatData, options.afterStatData);
      if (!hasMvuReplayBase(parsedBaseline) && stripped !== originalMessage) {
        patchList = buildMamaValuePatches(options.afterStatData);
      }
      patchList = normalizeReplayPatches(patchList);
    }

    if (!patchList.length) {
      if (stripped !== originalMessage) {
        await ROOT.setChatMessages([{ message_id: normalizedMessageId, message: stripped }], { refresh: options.refresh || 'affected' });
        const replayResult = await replayMessageThroughMvu(normalizedMessageId, {
          suppressPassiveCorruptionSync: options.suppressPassiveCorruptionSync === true || isObject(options.afterStatData)
        });
        if (!replayResult.ok) return { ok: false, reason: replayResult.reason || 'mvu_replay_failed', messageId: normalizedMessageId, floorKey: actualFloorKey, operationId };
        return { ok: true, messageId: normalizedMessageId, floorKey: actualFloorKey, operationId, patchCount: 0, removedReplayBlock: true, replayMethod: replayResult.method || '' };
      }
      return { ok: true, messageId: normalizedMessageId, floorKey: actualFloorKey, operationId, patchCount: 0, unchanged: true };
    }

    const block = buildMamaReplayBlock(operationId, patchList);
    const nextMessage = insertMamaReplayBlock(stripped, block);
    await ROOT.setChatMessages([{ message_id: normalizedMessageId, message: nextMessage }], { refresh: options.refresh || 'affected' });

    const replayResult = await replayMessageThroughMvu(normalizedMessageId, {
      suppressPassiveCorruptionSync: options.suppressPassiveCorruptionSync === true || isObject(options.afterStatData)
    });
    if (!replayResult.ok) {
      return { ok: false, reason: replayResult.reason || 'mvu_replay_failed', messageId: normalizedMessageId, floorKey: actualFloorKey, operationId };
    }
    return { ok: true, messageId: normalizedMessageId, floorKey: actualFloorKey, operationId, patchCount: patchList.length, replayMethod: replayResult.method || '' };
  }

  async function saveState(nextState, options: any = {}) {
    const messageId = resolveReplayMessageId(options);
    if (!Number.isFinite(Number(messageId)) || Number(messageId) < 0) {
      if (typeof ROOT.getChatMessages !== 'function') {
        const state = normalizeMamaState(nextState);
        await ROOT.STBridge?.mvuz?.write?.('mama', state, { type: 'message' });
        notifyStateChanged(state);
        return state;
      }
      throw new Error('missing_message_id');
    }
    const vars = await getMessageVariableBundle(messageId);
    const beforeStatData = isObject(vars?.[STAT_KEY]) ? vars[STAT_KEY] : {};
    const beforeMama = isObject(beforeStatData?.[MAMA_KEY]) ? beforeStatData[MAMA_KEY] : null;
    const normalized = normalizeMamaTransition(beforeMama, nextState);
    const afterStatData = { ...beforeStatData, [MAMA_KEY]: normalized };
    const result = await commitMamaReplayPatch({
      messageId,
      floorKey: options.floorKey,
      operationId: options.operationId || 'state:mama',
      replaceOperationIds: options.replaceOperationIds,
      beforeStatData,
      afterStatData,
      refresh: options.refresh
    });
    if (!result.ok) {
      const error: any = new Error(result.reason || 'mvu_replay_failed');
      error.result = result;
      throw error;
    }
    notifyStateChanged(normalized);
    return normalized;
  }

  async function patchState(patcher, options: any = {}) {
    const current = await loadState(options);
    const draft = clone(current, {});
    const result = typeof patcher === 'function' ? await patcher(draft, current) : patcher;
    return saveState(isObject(result) ? result : draft, options);
  }

  function notifyStateChanged(state) {
    try {
      ROOT.dispatchEvent?.(new CustomEvent('mama:stateChanged', { detail: { product: 'mama-ena', state } }));
    } catch (_) {}
  }

  RUNTIME.createStateReplay = function createStateReplay() {
    return {
      STAT_KEY,
      MAMA_KEY,
      ALLOWED_FIELD_PATHS: clone(ALLOWED_FIELD_PATHS, []),
      readStatData,
      loadState,
      saveState,
      patchState,
      notifyStateChanged,
      makeMessageFloorKey,
      commitMamaReplayPatch,
      resolveReplayMessageId,
      syncPassiveCorruptionTransition,
      startPassiveCorruptionSync
    };
  };
})();
