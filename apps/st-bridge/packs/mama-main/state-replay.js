(function() {
  "use strict";
  const DEFAULT_MAMA_STATE = {
    affection: 0,
    outfit: "streetwear_full",
    mascotComment: "唔噜噜，绘奈今天还撑得住噜。别太欺负她，涅露露可是在看着的噜。",
    enaDialogue: "……你太吵了。顺毛刚好顺得我要睡着了，你安静点待一会儿嘛。"
  };
  function normalizeMamaState(value) {
    const source = isRecord(value) ? value : {};
    return {
      affection: clampNumber(source.affection, 0, 255, DEFAULT_MAMA_STATE.affection),
      outfit: normalizeString(source.outfit, DEFAULT_MAMA_STATE.outfit),
      mascotComment: normalizeString(source.mascotComment, DEFAULT_MAMA_STATE.mascotComment),
      enaDialogue: normalizeString(source.enaDialogue, DEFAULT_MAMA_STATE.enaDialogue)
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
  const MAMA_STAT_KEY = "stat_data";
  const MAMA_NAMESPACE = "mama";
  const MAMA_ALLOWED_FIELD_PATHS = [
    "/mama/affection",
    "/mama/outfit",
    "/mama/mascotComment",
    "/mama/enaDialogue"
  ];
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
    const RUNTIME = ROOT.MAMAMainRuntime || CURRENT_ROOT.MAMAMainRuntime || {};
    ROOT.MAMAMainRuntime = RUNTIME;
    CURRENT_ROOT.MAMAMainRuntime = RUNTIME;
    const STAT_KEY = MAMA_STAT_KEY;
    const MAMA_KEY = MAMA_NAMESPACE;
    const REPLAY_PREFIX = "MAMA_REPLAY";
    const ALLOWED_FIELD_PATHS = [...MAMA_ALLOWED_FIELD_PATHS];
    function isObject(value) {
      return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
    function clone(value, fallback = null) {
      return cloneJson(value, fallback);
    }
    function normalizeMamaState$1(value) {
      if (typeof ROOT.MAMASchemaRuntime?.normalizeMamaState === "function") {
        return ROOT.MAMASchemaRuntime.normalizeMamaState(value);
      }
      if (typeof ROOT.STBridge?.mvuz?.normalize === "function") {
        return ROOT.STBridge.mvuz.normalize("mama", value);
      }
      return normalizeMamaState(value);
    }
    function areJsonValuesEqual(left, right) {
      return JSON.stringify(left) === JSON.stringify(right);
    }
    function readJsonPointer(root, pointer) {
      if (!pointer || pointer === "/") return root;
      const parts = String(pointer).split("/").slice(1).map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
      let current = root;
      for (const part of parts) {
        if (current === void 0 || current === null) return void 0;
        current = current[part];
      }
      return current;
    }
    function buildReplayPatch(op, path, value) {
      const patch = { op, path };
      if (op !== "remove") patch.value = clone(value, value);
      return patch;
    }
    function buildMamaStatePatches(beforeStatData, afterStatData) {
      const beforeMama = isObject(beforeStatData?.[MAMA_KEY]) ? beforeStatData[MAMA_KEY] : null;
      const afterMama = normalizeMamaState$1(afterStatData?.[MAMA_KEY]);
      if (!beforeMama) return [buildReplayPatch("add", "/mama", afterMama)];
      const patches = [];
      for (const path of ALLOWED_FIELD_PATHS) {
        const beforeValue = readJsonPointer(beforeStatData, path);
        const afterValue = readJsonPointer(afterStatData, path);
        if (afterValue === void 0 || areJsonValuesEqual(beforeValue, afterValue)) continue;
        patches.push(buildReplayPatch(beforeValue === void 0 ? "add" : "replace", path, afterValue));
      }
      return patches;
    }
    function buildMamaValuePatches(statData) {
      const mama = normalizeMamaState$1(statData?.[MAMA_KEY]);
      return [buildReplayPatch("add", "/mama", mama)];
    }
    function sanitizeReplayOperationId(value) {
      return String(value || "mama").trim().replace(/[^\w:.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "mama";
    }
    function escapeRegExp(value) {
      return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function buildMamaReplayBlock(operationId, patches) {
      const id = sanitizeReplayOperationId(operationId);
      return [
        "<UpdateVariable>",
        `<Analyze>${REPLAY_PREFIX}:${id}</Analyze>`,
        "<JSONPatch>",
        JSON.stringify(patches, null, 2),
        "</JSONPatch>",
        "</UpdateVariable>"
      ].join("\n");
    }
    function stripMamaReplayBlock(content, operationId) {
      const id = sanitizeReplayOperationId(operationId);
      const text = typeof content === "string" ? content : "";
      const pattern = new RegExp(
        `\\n*<UpdateVariable>\\s*(?:<Analyze>\\s*${REPLAY_PREFIX}:${escapeRegExp(id)}\\s*<\\/Analyze>\\s*)?<JSONPatch>[\\s\\S]*?<\\/JSONPatch>\\s*<\\/UpdateVariable>\\s*`,
        "gi"
      );
      return text.replace(pattern, "\n\n").replace(/\n{4,}/g, "\n\n\n").trimEnd();
    }
    function insertMamaReplayBlock(content, block) {
      const text = typeof content === "string" ? content : "";
      const placeholder = "<StatusPlaceHolderImpl/>";
      const index = text.indexOf(placeholder);
      if (index >= 0) {
        const before = text.slice(0, index).trimEnd();
        const after = text.slice(index);
        return `${before}

${block}

${after.trimStart()}`;
      }
      const trimmed = text.trimEnd();
      return trimmed ? `${trimmed}

${block}` : block;
    }
    function parseMessageIdFromFloorKey(floorKey) {
      const match = String(floorKey || "").trim().match(/^message:(\d+)$/i);
      if (!match) return null;
      const id = Number(match[1]);
      return Number.isFinite(id) && id >= 0 ? Math.round(id) : null;
    }
    function makeMessageFloorKey(messageId) {
      if (messageId === null || messageId === void 0 || messageId === "") return "";
      const id = Number(messageId);
      return Number.isFinite(id) && id >= 0 ? `message:${Math.round(id)}` : "";
    }
    function getLatestMessageId() {
      try {
        if (typeof ROOT.getCurrentMessageId === "function") {
          const id = Number(ROOT.getCurrentMessageId());
          if (Number.isFinite(id) && id >= 0) return Math.round(id);
        }
      } catch (_) {
      }
      try {
        if (typeof ROOT.getChatMessages === "function") {
          const latest = ROOT.getChatMessages(-1)?.[0];
          const id = Number(latest?.message_id);
          if (Number.isFinite(id) && id >= 0) return Math.round(id);
        }
      } catch (_) {
      }
      try {
        if (typeof ROOT.getLastMessageId === "function") {
          const id = Number(ROOT.getLastMessageId());
          if (Number.isFinite(id) && id >= 0) return Math.round(id);
        }
      } catch (_) {
      }
      return null;
    }
    function resolveReplayMessageId(options = {}) {
      const explicitId = Number(options.messageId ?? options.message_id);
      if (Number.isFinite(explicitId) && explicitId >= 0) return Math.round(explicitId);
      const floorId = parseMessageIdFromFloorKey(options.floorKey);
      if (floorId !== null) return floorId;
      return getLatestMessageId();
    }
    function hasMvuReplayBase(vars) {
      return isObject(vars) && isObject(vars.stat_data) && Object.prototype.hasOwnProperty.call(vars, "schema");
    }
    async function getMessageVariableBundle(messageId) {
      if (typeof ROOT.getVariables !== "function") return null;
      try {
        const id = Number(messageId);
        const options = { type: "message" };
        if (Number.isFinite(id) && id >= 0) options.message_id = Math.round(id);
        const vars = await ROOT.getVariables(options);
        return isObject(vars) ? vars : null;
      } catch (error) {
        console.warn("[MAMA State Replay] failed to read message MVU variables:", error);
        return null;
      }
    }
    async function readStatData(options = {}) {
      const state = await ROOT.STBridge?.mvuz?.read?.("mama", { type: "message" });
      return { [MAMA_KEY]: normalizeMamaState$1(state) };
    }
    async function loadState(options = {}) {
      const statData = await readStatData(options);
      return normalizeMamaState$1(statData[MAMA_KEY]);
    }
    function resolveMvuReplayHandler() {
      const candidates = [];
      const seen = [];
      const pushHandler = (owner) => {
        try {
          const fn = owner && owner.handleVariablesInMessage;
          if (typeof fn !== "function" || seen.includes(fn)) return;
          seen.push(fn);
          candidates.push(fn.bind(owner));
        } catch (_) {
        }
      };
      try {
        if (typeof handleVariablesInMessage === "function" && !seen.includes(handleVariablesInMessage)) {
          seen.push(handleVariablesInMessage);
          candidates.push(handleVariablesInMessage);
        }
      } catch (_) {
      }
      try {
        pushHandler(ROOT);
      } catch (_) {
      }
      try {
        pushHandler(ROOT.parent);
      } catch (_) {
      }
      try {
        pushHandler(ROOT.top);
      } catch (_) {
      }
      try {
        pushHandler(typeof unsafeWindow === "object" ? unsafeWindow : null);
      } catch (_) {
      }
      try {
        pushHandler(typeof unsafeWindow === "object" ? unsafeWindow?.parent : null);
      } catch (_) {
      }
      try {
        pushHandler(typeof unsafeWindow === "object" ? unsafeWindow?.top : null);
      } catch (_) {
      }
      try {
        pushHandler(ROOT.STBridge?.mvu);
      } catch (_) {
      }
      return candidates[0] || null;
    }
    function resolveMvuApi() {
      const candidates = [];
      const pushOwner = (owner) => {
        try {
          if (owner && !candidates.includes(owner)) candidates.push(owner);
        } catch (_) {
        }
      };
      try {
        pushOwner(ROOT);
      } catch (_) {
      }
      try {
        pushOwner(ROOT.parent);
      } catch (_) {
      }
      try {
        pushOwner(ROOT.top);
      } catch (_) {
      }
      try {
        pushOwner(typeof unsafeWindow === "object" ? unsafeWindow : null);
      } catch (_) {
      }
      try {
        pushOwner(typeof unsafeWindow === "object" ? unsafeWindow?.parent : null);
      } catch (_) {
      }
      try {
        pushOwner(typeof unsafeWindow === "object" ? unsafeWindow?.top : null);
      } catch (_) {
      }
      for (const owner of candidates) {
        const api = owner?.Mvu;
        if (api && typeof api.parseMessage === "function" && typeof api.replaceMvuData === "function") return api;
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
    async function replayMessageThroughMvu(messageId) {
      const replayHandler = resolveMvuReplayHandler();
      if (typeof replayHandler === "function") {
        await replayHandler(messageId);
        return { ok: true, method: "handleVariablesInMessage" };
      }
      const mvuApi = resolveMvuApi();
      if (!mvuApi) return { ok: false, reason: "mvu_replay_unavailable" };
      const id = Math.round(Number(messageId) || 0);
      const msg = typeof ROOT.getChatMessages === "function" ? ROOT.getChatMessages(id)?.[0] : null;
      if (!msg || typeof msg.message !== "string") return { ok: false, reason: "message_not_found" };
      const baseVars = await getMvuReplayBaseVariables(id);
      if (!hasMvuReplayBase(baseVars)) return { ok: false, reason: "mvu_replay_missing_base" };
      const nextVars = await mvuApi.parseMessage(msg.message, baseVars);
      if (!hasMvuReplayBase(nextVars)) return { ok: false, reason: "mvu_replay_parse_failed" };
      await mvuApi.replaceMvuData(nextVars, { type: "message", message_id: id });
      return { ok: true, method: "Mvu.parseMessage" };
    }
    async function parseMvuVariablesFromMessage(messageId, messageText) {
      const mvuApi = resolveMvuApi();
      if (!mvuApi) return null;
      const baseVars = await getMvuReplayBaseVariables(messageId);
      if (!hasMvuReplayBase(baseVars)) return null;
      try {
        const parsed = await mvuApi.parseMessage(String(messageText || ""), baseVars);
        return hasMvuReplayBase(parsed) ? parsed : null;
      } catch (error) {
        console.warn("[MAMA State Replay] failed to parse stripped replay baseline:", error);
        return null;
      }
    }
    function normalizeReplayPatches(patches) {
      const byPath = /* @__PURE__ */ new Map();
      (Array.isArray(patches) ? patches : []).forEach((patch) => {
        if (!patch || typeof patch !== "object") return;
        const path = typeof patch.path === "string" ? patch.path.trim() : "";
        const allowed = path === "/mama" || ALLOWED_FIELD_PATHS.includes(path);
        if (!allowed) return;
        byPath.set(path, { ...patch, path });
      });
      return Array.from(byPath.values());
    }
    async function commitMamaReplayPatch(options = {}) {
      const messageId = resolveReplayMessageId(options);
      if (!Number.isFinite(Number(messageId)) || Number(messageId) < 0) {
        return { ok: false, reason: "missing_message_id" };
      }
      const normalizedMessageId = Math.round(Number(messageId));
      const expectedFloorKey = typeof options.floorKey === "string" ? options.floorKey.trim() : "";
      const actualFloorKey = makeMessageFloorKey(normalizedMessageId);
      if (expectedFloorKey && expectedFloorKey !== actualFloorKey) {
        return { ok: false, reason: "floor_key_mismatch", floorKey: actualFloorKey, expectedFloorKey };
      }
      if (typeof ROOT.getChatMessages !== "function" || typeof ROOT.setChatMessages !== "function") {
        if (isObject(options.afterStatData?.[MAMA_KEY])) {
          const state = normalizeMamaState$1(options.afterStatData[MAMA_KEY]);
          await ROOT.STBridge?.mvuz?.write?.("mama", state, { type: "message" });
          return { ok: true, method: "direct-mvuz-write", patchCount: 0, state };
        }
        return { ok: false, reason: "chat_message_api_unavailable", messageId: normalizedMessageId, floorKey: actualFloorKey };
      }
      const vars = await getMessageVariableBundle(normalizedMessageId);
      if (!hasMvuReplayBase(vars)) {
        return { ok: false, reason: "mvu_replay_missing_base", messageId: normalizedMessageId, floorKey: actualFloorKey };
      }
      const messages = ROOT.getChatMessages(normalizedMessageId);
      const msg = Array.isArray(messages) ? messages[0] : null;
      if (!msg || typeof msg !== "object") {
        return { ok: false, reason: "message_not_found", messageId: normalizedMessageId, floorKey: actualFloorKey };
      }
      const hasReplayHandler = typeof resolveMvuReplayHandler() === "function";
      const hasMvuApi = Boolean(resolveMvuApi());
      if (!hasReplayHandler && !hasMvuApi) {
        return { ok: false, reason: "mvu_replay_unavailable", messageId: normalizedMessageId, floorKey: actualFloorKey };
      }
      const operationId = sanitizeReplayOperationId(options.operationId || "state:mama");
      const stripIds = [
        operationId,
        ...Array.isArray(options.replaceOperationIds) ? options.replaceOperationIds : []
      ].map(sanitizeReplayOperationId).filter(Boolean);
      const originalMessage = msg.message || "";
      const stripped = Array.from(new Set(stripIds)).reduce((content, stripId) => stripMamaReplayBlock(content, stripId), originalMessage);
      let patchList = Array.isArray(options.patches) ? normalizeReplayPatches(options.patches) : [];
      if (isObject(options.afterStatData)) {
        const parsedBaseline = await parseMvuVariablesFromMessage(normalizedMessageId, stripped);
        const baselineStatData = hasMvuReplayBase(parsedBaseline) ? parsedBaseline.stat_data : isObject(options.beforeStatData) ? options.beforeStatData : vars.stat_data;
        patchList = buildMamaStatePatches(baselineStatData, options.afterStatData);
        if (!hasMvuReplayBase(parsedBaseline) && stripped !== originalMessage) {
          patchList = buildMamaValuePatches(options.afterStatData);
        }
        patchList = normalizeReplayPatches(patchList);
      }
      if (!patchList.length) {
        if (stripped !== originalMessage) {
          await ROOT.setChatMessages([{ message_id: normalizedMessageId, message: stripped }], { refresh: options.refresh || "affected" });
          const replayResult2 = await replayMessageThroughMvu(normalizedMessageId);
          if (!replayResult2.ok) return { ok: false, reason: replayResult2.reason || "mvu_replay_failed", messageId: normalizedMessageId, floorKey: actualFloorKey, operationId };
          return { ok: true, messageId: normalizedMessageId, floorKey: actualFloorKey, operationId, patchCount: 0, removedReplayBlock: true, replayMethod: replayResult2.method || "" };
        }
        return { ok: true, messageId: normalizedMessageId, floorKey: actualFloorKey, operationId, patchCount: 0, unchanged: true };
      }
      const block = buildMamaReplayBlock(operationId, patchList);
      const nextMessage = insertMamaReplayBlock(stripped, block);
      await ROOT.setChatMessages([{ message_id: normalizedMessageId, message: nextMessage }], { refresh: options.refresh || "affected" });
      const replayResult = await replayMessageThroughMvu(normalizedMessageId);
      if (!replayResult.ok) {
        return { ok: false, reason: replayResult.reason || "mvu_replay_failed", messageId: normalizedMessageId, floorKey: actualFloorKey, operationId };
      }
      return { ok: true, messageId: normalizedMessageId, floorKey: actualFloorKey, operationId, patchCount: patchList.length, replayMethod: replayResult.method || "" };
    }
    async function saveState(nextState, options = {}) {
      const messageId = resolveReplayMessageId(options);
      if (!Number.isFinite(Number(messageId)) || Number(messageId) < 0) {
        if (typeof ROOT.getChatMessages !== "function") {
          const state = normalizeMamaState$1(nextState);
          await ROOT.STBridge?.mvuz?.write?.("mama", state, { type: "message" });
          notifyStateChanged(state);
          return state;
        }
        throw new Error("missing_message_id");
      }
      const vars = await getMessageVariableBundle(messageId);
      const beforeStatData = isObject(vars?.[STAT_KEY]) ? vars[STAT_KEY] : {};
      const normalized = normalizeMamaState$1(nextState);
      const afterStatData = { ...beforeStatData, [MAMA_KEY]: normalized };
      const result = await commitMamaReplayPatch({
        messageId,
        floorKey: options.floorKey,
        operationId: options.operationId || "state:mama",
        replaceOperationIds: options.replaceOperationIds,
        beforeStatData,
        afterStatData,
        refresh: options.refresh
      });
      if (!result.ok) {
        const error = new Error(result.reason || "mvu_replay_failed");
        error.result = result;
        throw error;
      }
      notifyStateChanged(normalized);
      return normalized;
    }
    async function patchState(patcher, options = {}) {
      const current = await loadState(options);
      const draft = clone(current, {});
      const result = typeof patcher === "function" ? await patcher(draft, current) : patcher;
      return saveState(isObject(result) ? result : draft, options);
    }
    function notifyStateChanged(state) {
      try {
        ROOT.dispatchEvent?.(new CustomEvent("mama:stateChanged", { detail: { product: "mama-ena", state } }));
      } catch (_) {
      }
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
        resolveReplayMessageId
      };
    };
  })();
})();
