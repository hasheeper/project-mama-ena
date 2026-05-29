(function() {
  "use strict";
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
    function pushTarget(targets, target) {
      try {
        if (target && !targets.includes(target)) targets.push(target);
      } catch (_) {
      }
    }
    const BRIDGE_HOST = resolveBridgeHost();
    const ROOT = BRIDGE_HOST.apiRoot || CURRENT_ROOT.MAMA_ST_API_ROOT || CURRENT_ROOT.MAMA_ST_HOST_ROOT || CURRENT_ROOT;
    const UI_ROOT = BRIDGE_HOST.root || BRIDGE_HOST.uiRoot || CURRENT_ROOT.MAMA_ST_UI_ROOT || ROOT;
    const DOC = UI_ROOT.document || CURRENT_ROOT.document;
    const TIMER_ROOT = UI_ROOT.setTimeout ? UI_ROOT : CURRENT_ROOT;
    const RUNTIME = ROOT.MAMAMainRuntime || CURRENT_ROOT.MAMAMainRuntime || {};
    ROOT.MAMAMainRuntime = RUNTIME;
    CURRENT_ROOT.MAMAMainRuntime = RUNTIME;
    const HOST_ID = "mama-status-host";
    const TRIGGER_ID = "mama-status-trigger";
    const OVERLAY_ID = "mama-status-overlay";
    const WRAPPER_ID = "mama-status-wrapper";
    const IFRAME_ID = "mama-status-iframe";
    const CLOSE_ID = "mama-status-close";
    const STYLE_ID = "mama-status-host-style";
    const UNLOAD_KEY = "__MAMA_STATUS_HOST_UNLOAD__";
    const TRIGGER_COLLAPSED_CLASS = "mama-status-trigger-collapsed";
    const TRIGGER_COLLAPSED_STORAGE_KEY = "mama.status.triggerCollapsed.v2";
    const DEFAULT_APP_BASE_URL = "https://hasheeper.github.io/project-mama-ena";
    const DEFAULT_STATUS_PATH = "apps/visual-dashboard/index.html";
    function getBridgeTargets() {
      const targets = [];
      pushTarget(targets, CURRENT_ROOT);
      pushTarget(targets, ROOT);
      pushTarget(targets, UI_ROOT);
      (Array.isArray(BRIDGE_HOST.candidates) ? BRIDGE_HOST.candidates : []).forEach((target) => pushTarget(targets, target));
      targets.slice().forEach((target) => {
        try {
          pushTarget(targets, target.parent);
        } catch (_) {
        }
        try {
          pushTarget(targets, target.top);
        } catch (_) {
        }
      });
      return targets;
    }
    function isEnabled(value) {
      return value === true || value === "true" || value === "1" || value === 1;
    }
    function isDisabled(value) {
      return value === false || value === "false" || value === "0" || value === 0;
    }
    function trimTrailingSlash(value) {
      return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
    }
    function readGlobalString(key) {
      for (const target of getBridgeTargets()) {
        try {
          if (typeof target?.[key] === "string" && target[key].trim()) return target[key].trim();
        } catch (_) {
        }
      }
      return "";
    }
    function appendQueryParams(url, params = {}) {
      const entries = Object.entries(params).filter(([, value]) => value !== void 0 && value !== null && value !== "");
      if (!entries.length || typeof url !== "string" || !url.trim()) return url;
      try {
        const parsed = new URL(url, /^https?:\/\//i.test(url) ? void 0 : "https://mama.local");
        entries.forEach(([key, value]) => parsed.searchParams.set(key, String(value)));
        return /^https?:\/\//i.test(url) ? parsed.href : `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch (_) {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join("&")}`;
      }
    }
    function resolveStatusUrl(version) {
      const explicit = readGlobalString("MAMA_STATUS_URL");
      const base = trimTrailingSlash(readGlobalString("MAMA_APP_BASE_URL") || DEFAULT_APP_BASE_URL);
      const url = explicit || `${base}/${DEFAULT_STATUS_PATH}`;
      return appendQueryParams(url, { bridge: "st", v: version });
    }
    function ensureStyle() {
      if (!DOC?.head || DOC.getElementById(STYLE_ID)) return;
      const style = DOC.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
      @keyframes mamaStatusFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      @keyframes mamaStatusPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(228, 124, 154, 0.26), 0 16px 38px rgba(45, 35, 50, 0.22); }
        50% { box-shadow: 0 0 0 14px rgba(228, 124, 154, 0), 0 18px 42px rgba(45, 35, 50, 0.26); }
      }

      #${HOST_ID} {
        position: static !important;
        z-index: 2147483645 !important;
        pointer-events: none !important;
      }

      #${TRIGGER_ID} {
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
        width: 68px;
        height: 68px;
        border: 1px solid rgba(228, 124, 154, 0.34);
        border-radius: 22px;
        background:
          radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.9), transparent 34%),
          linear-gradient(160deg, rgba(252, 250, 247, 0.98), rgba(223, 209, 235, 0.98));
        color: #401f2c;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        overflow: visible;
        z-index: 2147483645 !important;
        pointer-events: auto !important;
        box-shadow: 0 16px 38px rgba(45, 35, 50, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.68);
        animation: mamaStatusFloat 3.2s ease-in-out infinite, mamaStatusPulse 3.4s ease-in-out infinite;
        font: 900 13px/1.05 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 1px;
        transition: width 0.28s ease, height 0.28s ease, right 0.28s ease, border-radius 0.28s ease, transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
      }

      #${TRIGGER_ID}::before {
        display: none;
      }

      #${TRIGGER_ID}:hover {
        transform: scale(1.07);
        border-color: rgba(228, 124, 154, 0.62);
        box-shadow: 0 18px 46px rgba(45, 35, 50, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.72);
      }

      #${TRIGGER_ID} .mama-status-trigger-mark {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border-radius: 17px;
        background: rgba(255, 255, 255, 0.44);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.56);
        transition: transform 0.25s ease, opacity 0.2s ease;
      }

      #${TRIGGER_ID}:hover .mama-status-trigger-mark {
        transform: scale(1.08);
      }

      #${TRIGGER_ID} .mama-status-trigger-mini {
        display: none;
      }

      #${TRIGGER_ID} .mama-status-trigger-sub {
        display: block;
        margin-top: 3px;
        font-size: 8px;
        color: rgba(64, 31, 44, 0.62);
        letter-spacing: 1.6px;
      }

      .mama-status-trigger-fold {
        position: absolute;
        right: -2px;
        bottom: -2px;
        appearance: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border: 1px solid rgba(255, 255, 255, 0.38);
        border-radius: 999px;
        background: rgba(54, 38, 50, 0.84);
        color: rgba(255, 255, 255, 0.92);
        cursor: pointer;
        padding: 0;
        z-index: 2;
        box-shadow: 0 4px 10px rgba(45, 35, 50, 0.26);
        transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
      }

      .mama-status-trigger-fold:hover {
        transform: translateY(-1px);
        background: rgba(81, 34, 52, 0.94);
        border-color: rgba(255, 255, 255, 0.58);
      }

      .mama-status-trigger-fold svg {
        width: 12px;
        height: 12px;
      }

      .mama-status-trigger-fold-open {
        display: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} {
        right: 0 !important;
        width: 30px;
        height: 62px;
        border-radius: 18px 0 0 18px;
        opacity: 0.78;
        animation: none;
        background: rgba(54, 38, 50, 0.78);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow:
          0 6px 16px rgba(45, 35, 50, 0.28),
          inset 0 0 10px rgba(255, 255, 255, 0.16);
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS}::before {
        display: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS}:hover {
        transform: none;
        opacity: 0.96;
        background: rgba(64, 45, 60, 0.92);
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-mark {
        width: 20px;
        height: 20px;
        border-radius: 10px;
        background: transparent;
        box-shadow: none;
        transform: translateY(-10px);
        opacity: 0.88;
        color: rgba(255, 245, 248, 0.92);
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS}:hover .mama-status-trigger-mark {
        transform: translateY(-10px);
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-main {
        display: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-mini {
        display: block;
        font-size: 14px;
        line-height: 1;
        color: rgba(255, 245, 248, 0.94);
        letter-spacing: 0;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-fold {
        right: 3px;
        bottom: 5px;
        width: 24px;
        height: 24px;
        border-color: transparent;
        background: transparent;
        box-shadow: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-fold-close {
        display: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-fold-open {
        display: block;
      }

      #${OVERLAY_ID} {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        box-sizing: border-box;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(37, 31, 42, 0.42);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 2147483646 !important;
        overflow: hidden;
        pointer-events: auto !important;
      }

      #${WRAPPER_ID} {
        position: relative;
        box-sizing: border-box;
        width: min(480px, calc(100vw - 36px));
        height: min(940px, calc(100vh - 36px));
        min-height: min(680px, calc(100vh - 36px));
      }

      #${IFRAME_ID} {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        border: 1px solid rgba(255, 255, 255, 0.62);
        display: block;
        background: transparent;
        pointer-events: auto;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 28px 70px rgba(45, 35, 50, 0.32);
      }

      #${CLOSE_ID} {
        position: absolute;
        top: -12px;
        right: -12px;
        width: 42px;
        height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.5);
        background: rgba(41, 36, 45, 0.84);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        z-index: 2;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: transform 0.2s ease, background 0.2s ease;
      }

      #${CLOSE_ID}:hover {
        transform: scale(1.08);
        background: rgba(228, 124, 154, 0.94);
      }
    `;
      DOC.head.append(style);
    }
    RUNTIME.createStatusHost = function createStatusHost(stateService, config = {}) {
      let frame = null;
      let host = null;
      let overlay = null;
      let wrapper = null;
      let ready = false;
      let iframeInitialized = false;
      let disposed = false;
      let trigger = null;
      let triggerFoldButton = null;
      let lastState = null;
      let lastReason = "";
      let frameReadOptions = { persist: false };
      let eventsBound = false;
      const inlineTargets = /* @__PURE__ */ new Map();
      const targetStates = /* @__PURE__ */ new Map();
      const messageTargets = [];
      const timeoutHandles = /* @__PURE__ */ new Set();
      const cleanupCallbacks = [];
      const version = config.version || "0.1.0";
      const injectStatusHost = !isDisabled(config.injectFixedStatus) && !isEnabled(config.disableStatusHost) && !isEnabled(ROOT.MAMA_DISABLE_STATUS_HOST) && !isEnabled(UI_ROOT.MAMA_DISABLE_STATUS_HOST);
      function schedule(callback, delayMs = 0) {
        const handle = TIMER_ROOT.setTimeout(() => {
          timeoutHandles.delete(handle);
          if (disposed) return;
          callback();
        }, delayMs);
        timeoutHandles.add(handle);
        return handle;
      }
      function clearScheduledWork() {
        timeoutHandles.forEach((handle) => {
          try {
            TIMER_ROOT.clearTimeout?.(handle);
          } catch (_) {
          }
          try {
            CURRENT_ROOT.clearTimeout?.(handle);
          } catch (_) {
          }
        });
        timeoutHandles.clear();
      }
      function waitForBodyAvailable(callback) {
        if (disposed) return;
        if (DOC?.body) {
          callback();
          return;
        }
        schedule(() => waitForBodyAvailable(callback), 100);
      }
      function blankIframe(targetFrame) {
        try {
          if (targetFrame && targetFrame.src !== "about:blank") targetFrame.src = "about:blank";
        } catch (_) {
        }
      }
      function removeExistingDom(removeStyle = true) {
        blankIframe(frame);
        try {
          blankIframe(DOC?.getElementById(IFRAME_ID));
        } catch (_) {
        }
        try {
          DOC?.getElementById(HOST_ID)?.remove();
        } catch (_) {
        }
        try {
          DOC?.getElementById(OVERLAY_ID)?.remove();
        } catch (_) {
        }
        if (removeStyle) {
          try {
            DOC?.getElementById(STYLE_ID)?.remove();
          } catch (_) {
          }
        }
      }
      function unloadPreviousInstances() {
        const unloads = [];
        getBridgeTargets().forEach((target) => {
          try {
            const previousUnload = target?.[UNLOAD_KEY];
            if (typeof previousUnload === "function" && previousUnload !== unload && !unloads.includes(previousUnload)) {
              unloads.push(previousUnload);
            }
          } catch (_) {
          }
        });
        unloads.forEach((previousUnload) => {
          try {
            previousUnload();
          } catch (_) {
          }
        });
      }
      function exposeUnload() {
        getBridgeTargets().forEach((target) => {
          try {
            target[UNLOAD_KEY] = unload;
          } catch (_) {
          }
        });
      }
      function clearUnloadExposure() {
        getBridgeTargets().forEach((target) => {
          try {
            if (target?.[UNLOAD_KEY] === unload) delete target[UNLOAD_KEY];
          } catch (_) {
          }
        });
      }
      function bindLifecycleUnload(target) {
        if (!target || typeof target.addEventListener !== "function") return;
        ["pagehide", "beforeunload"].forEach((eventName) => {
          try {
            target.removeEventListener(eventName, unload);
            target.addEventListener(eventName, unload);
            cleanupCallbacks.push(() => target.removeEventListener(eventName, unload));
          } catch (_) {
          }
        });
      }
      function ensureHost() {
        if (disposed) return null;
        if (!disposed && host && overlay && frame && DOC?.body?.contains(host) && DOC?.body?.contains(overlay)) return host;
        if (!DOC?.body) return null;
        ensureStyle();
        removeExistingDom(false);
        host = DOC.createElement("div");
        host.id = HOST_ID;
        trigger = DOC.createElement("div");
        trigger.id = TRIGGER_ID;
        trigger.setAttribute("role", "button");
        trigger.tabIndex = 0;
        trigger.title = "Open MAMA Status";
        trigger.setAttribute("aria-label", "Open MAMA Status");
        trigger.innerHTML = [
          '<span class="mama-status-trigger-mark" aria-hidden="true">',
          '<span class="mama-status-trigger-main">MAMA<span class="mama-status-trigger-sub">STATUS</span></span>',
          '<span class="mama-status-trigger-mini">M</span>',
          "</span>",
          '<button class="mama-status-trigger-fold" type="button" title="收起悬浮球" aria-label="收起悬浮球">',
          '<svg class="mama-status-trigger-fold-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
          '<path d="m15 18-6-6 6-6" />',
          "</svg>",
          '<svg class="mama-status-trigger-fold-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
          '<path d="m9 18 6-6-6-6" />',
          "</svg>",
          "</button>"
        ].join("");
        trigger.addEventListener("click", openStatus);
        trigger.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          openStatus();
        });
        triggerFoldButton = trigger.querySelector(".mama-status-trigger-fold");
        triggerFoldButton?.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          setTriggerCollapsed(!trigger.classList.contains(TRIGGER_COLLAPSED_CLASS));
        });
        overlay = DOC.createElement("div");
        overlay.id = OVERLAY_ID;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-label", "MAMA Status");
        overlay.addEventListener("click", (event) => {
          if (event.target === overlay) closeStatus();
        });
        wrapper = DOC.createElement("div");
        wrapper.id = WRAPPER_ID;
        frame = DOC.createElement("iframe");
        frame.id = IFRAME_ID;
        frame.title = "MAMA Status";
        frame.allow = "fullscreen";
        frame.referrerPolicy = "no-referrer";
        frame.setAttribute("sandbox", "allow-scripts allow-forms allow-modals allow-popups allow-same-origin");
        frame.dataset.mamaSrc = resolveStatusUrl(version);
        frame.addEventListener("load", () => {
          if (disposed) return;
          ready = true;
          postContainerReady();
          schedule(() => refreshStatus(lastReason || "iframeLoad"), 40);
        });
        const close = DOC.createElement("button");
        close.id = CLOSE_ID;
        close.type = "button";
        close.title = "Close MAMA Status";
        close.setAttribute("aria-label", "Close MAMA Status");
        close.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>';
        close.addEventListener("click", closeStatus);
        host.replaceChildren(trigger);
        wrapper.replaceChildren(frame, close);
        overlay.replaceChildren(wrapper);
        DOC.body.append(host, overlay);
        restoreTriggerCollapsed();
        console.info("[MAMA Status Host] floating trigger injected into ST host:", {
          url: frame.dataset.mamaSrc,
          uiRoot: UI_ROOT === CURRENT_ROOT ? "current" : "host"
        });
        return host;
      }
      function setTriggerCollapsed(collapsed) {
        if (!trigger) return;
        trigger.classList.toggle(TRIGGER_COLLAPSED_CLASS, Boolean(collapsed));
        trigger.title = collapsed ? "MAMA Status（点击打开，箭头展开）" : "Open MAMA Status";
        trigger.setAttribute("aria-label", collapsed ? "Open MAMA Status, collapsed" : "Open MAMA Status");
        if (triggerFoldButton) {
          triggerFoldButton.title = collapsed ? "展开悬浮球" : "收起悬浮球";
          triggerFoldButton.setAttribute("aria-label", collapsed ? "展开悬浮球" : "收起悬浮球");
        }
        try {
          UI_ROOT.localStorage?.setItem(TRIGGER_COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
        } catch (_) {
        }
      }
      function restoreTriggerCollapsed() {
        let collapsed = false;
        try {
          collapsed = UI_ROOT.localStorage?.getItem(TRIGGER_COLLAPSED_STORAGE_KEY) === "1";
        } catch (_) {
        }
        setTriggerCollapsed(collapsed);
      }
      function initializeIframe() {
        if (disposed) return;
        if (!frame) ensureHost();
        if (!frame || iframeInitialized) return;
        iframeInitialized = true;
        frame.src = frame.dataset.mamaSrc || resolveStatusUrl(version);
      }
      function openStatus() {
        if (disposed) return false;
        ensureHost();
        if (!overlay) return false;
        overlay.style.display = "flex";
        initializeIframe();
        schedule(() => refreshStatus("open"), 80);
        return true;
      }
      function closeStatus() {
        if (disposed) return false;
        if (overlay) overlay.style.display = "none";
        return Boolean(overlay);
      }
      function isMessageTarget(value) {
        return Boolean(value && typeof value.postMessage === "function");
      }
      function resolveReadOptions() {
        return { persist: false };
      }
      function registerInlineTarget(source, readOptions = {}) {
        if (!isMessageTarget(source)) return null;
        inlineTargets.set(source, readOptions);
        return source;
      }
      function postContainerReadyTo(target) {
        if (!isMessageTarget(target)) return false;
        try {
          target.postMessage({
            type: "mama:container-ready",
            appId: "visual-dashboard",
            app: {
              id: "visual-dashboard",
              name: "SillyTavern MAMA Status",
              type: "status",
              status: "active"
            }
          }, "*");
          return true;
        } catch (_) {
          return false;
        }
      }
      function postContainerReady(target = frame?.contentWindow) {
        return postContainerReadyTo(target);
      }
      function readOptionsForTarget(target) {
        if (target === frame?.contentWindow) return frameReadOptions;
        return inlineTargets.get(target) || { persist: false };
      }
      function postStateTo(target, reason, state) {
        if (disposed) return false;
        const nextState = state || lastState;
        if (!isMessageTarget(target) || !nextState) return false;
        try {
          target.postMessage({
            type: "MAMA_STATE_PUSH",
            reason: reason || "refresh",
            floorKey: "",
            state: nextState
          }, "*");
          return true;
        } catch (_) {
          inlineTargets.delete(target);
          targetStates.delete(target);
          return false;
        }
      }
      function postState(reason, state) {
        const nextState = state || lastState;
        if (!nextState) return false;
        let sent = false;
        if (frame?.contentWindow && ready) {
          postContainerReady(frame.contentWindow);
          sent = postStateTo(frame.contentWindow, reason, nextState) || sent;
        }
        inlineTargets.forEach((_, target) => {
          postContainerReadyTo(target);
          const cachedState = targetStates.get(target);
          if (cachedState) sent = postStateTo(target, reason, cachedState) || sent;
        });
        return sent;
      }
      function postDirectState(target, reason, state) {
        postContainerReadyTo(target);
        return postStateTo(target, reason, state);
      }
      async function refreshTarget(target, reason = "statusRequest", readOptions = readOptionsForTarget(target)) {
        if (disposed) return false;
        if (!isMessageTarget(target)) return false;
        let state;
        try {
          state = await stateService.loadState(readOptions || { persist: false });
        } catch (error) {
          console.warn("[MAMA Status Host] loadState failed:", error);
          return false;
        }
        lastState = state;
        lastReason = reason;
        targetStates.set(target, state);
        return postDirectState(target, reason, state);
      }
      async function refreshStatus(reason = "refresh") {
        if (disposed) return false;
        if (injectStatusHost) waitForBodyAvailable(() => ensureHost());
        let sent = false;
        if (frame?.contentWindow && ready) {
          try {
            frameReadOptions = resolveReadOptions();
            const state = await stateService.loadState(frameReadOptions);
            lastState = state;
            lastReason = reason;
            sent = postState(reason, state) || sent;
          } catch (error) {
            console.warn("[MAMA Status Host] loadState failed:", error);
          }
        }
        const results = await Promise.all(Array.from(inlineTargets.entries()).map(([target, readOptions]) => {
          return refreshTarget(target, reason, readOptions);
        }));
        return results.some(Boolean) || sent;
      }
      function handleMessage(event) {
        if (disposed) return;
        const data = event?.data;
        if (!data || typeof data !== "object") return;
        const isReady = data.type === "MAMA_STATUS_READY" || data.type === "mama:app-ready";
        const isRequest = data.type === "MAMA_STATUS_REQUEST";
        if (!isReady && !isRequest) return;
        const appId = typeof data.appId === "string" ? data.appId : data.app?.id;
        if (appId && appId !== "visual-dashboard" && appId !== "expression-portrait") return;
        if (event.source === frame?.contentWindow) {
          ready = true;
          postContainerReady();
          void refreshStatus(data.reason || (isRequest ? "statusRequest" : "appReady"));
          return;
        }
        const readOptions = resolveReadOptions();
        const target = registerInlineTarget(event.source, readOptions);
        if (!target) return;
        if (targetStates.has(target)) postDirectState(target, isRequest ? "statusRequest" : "appReady", targetStates.get(target));
        void refreshTarget(target, data.reason || (isRequest ? "statusRequest" : "appReady"), readOptions);
      }
      function bindWindowMessageTargets() {
        getBridgeTargets().forEach((target) => {
          if (!target || messageTargets.includes(target)) return;
          try {
            target.removeEventListener?.("message", handleMessage);
            target.addEventListener?.("message", handleMessage);
            messageTargets.push(target);
          } catch (_) {
          }
        });
      }
      function bindMamaEvent(target, eventName, handler) {
        try {
          target?.removeEventListener?.(eventName, handler);
          target?.addEventListener?.(eventName, handler);
          cleanupCallbacks.push(() => target.removeEventListener?.(eventName, handler));
        } catch (_) {
        }
      }
      function bindSillyTavernEvent(target, eventName, reason, delayMs = 0) {
        if (typeof target?.eventOn !== "function") return;
        try {
          const stop = target.eventOn(eventName, () => {
            if (delayMs > 0) {
              schedule(() => refreshStatus(reason), delayMs);
              return;
            }
            void refreshStatus(reason);
          });
          if (typeof stop === "function") cleanupCallbacks.push(stop);
        } catch (_) {
        }
      }
      function bindEvents() {
        if (eventsBound) return;
        eventsBound = true;
        bindWindowMessageTargets();
        const keydownHandler = (event) => {
          if (event?.key === "Escape" && overlay?.style?.display !== "none") closeStatus();
        };
        try {
          DOC?.removeEventListener?.("keydown", keydownHandler);
          DOC?.addEventListener?.("keydown", keydownHandler);
          cleanupCallbacks.push(() => DOC?.removeEventListener?.("keydown", keydownHandler));
        } catch (_) {
        }
        const stateChangedHandler = () => refreshStatus("stateChanged");
        const mvuzWrittenHandler = () => refreshStatus("mvuzWritten");
        getBridgeTargets().forEach((target) => {
          bindMamaEvent(target, "mama:stateChanged", stateChangedHandler);
          bindMamaEvent(target, "mama:mvuz-written", mvuzWrittenHandler);
        });
        getBridgeTargets().forEach((target) => {
          bindLifecycleUnload(target);
          bindSillyTavernEvent(target, "message_received", "messageReceived", 1200);
          bindSillyTavernEvent(target, "character_message_rendered", "messageRendered", 250);
          bindSillyTavernEvent(target, "message_updated", "messageUpdated", 400);
          bindSillyTavernEvent(target, "generation_ended", "generationEnded", 300);
          bindSillyTavernEvent(target, "CHAT_CHANGED", "chatChanged", 250);
          bindSillyTavernEvent(target, "chat_changed", "chatChanged", 250);
        });
      }
      function unload() {
        disposed = true;
        ready = false;
        iframeInitialized = false;
        clearScheduledWork();
        cleanupCallbacks.splice(0).forEach((cleanup) => {
          try {
            cleanup();
          } catch (_) {
          }
        });
        messageTargets.splice(0).forEach((target) => {
          try {
            target.removeEventListener?.("message", handleMessage);
          } catch (_) {
          }
        });
        inlineTargets.clear();
        targetStates.clear();
        blankIframe(frame);
        removeExistingDom();
        host = null;
        overlay = null;
        wrapper = null;
        frame = null;
        trigger = null;
        triggerFoldButton = null;
        lastState = null;
        lastReason = "";
        eventsBound = false;
        clearUnloadExposure();
      }
      function start() {
        unloadPreviousInstances();
        disposed = false;
        exposeUnload();
        bindEvents();
        if (injectStatusHost) {
          waitForBodyAvailable(() => {
            ensureHost();
            void refreshStatus("start");
          });
        }
      }
      function debug() {
        return {
          disposed,
          ready,
          iframeInitialized,
          injected: Boolean(DOC?.getElementById(TRIGGER_ID)),
          open: overlay?.style?.display || "",
          statusUrl: frame?.dataset?.mamaSrc || "",
          scheduledWork: timeoutHandles.size,
          collapsed: Boolean(trigger?.classList?.contains(TRIGGER_COLLAPSED_CLASS)),
          hostRoot: UI_ROOT === CURRENT_ROOT ? "current" : "host",
          apiRoot: ROOT === CURRENT_ROOT ? "current" : "host"
        };
      }
      return {
        start,
        unload,
        refreshStatus,
        ensureHost,
        openStatus,
        closeStatus,
        debug
      };
    };
  })();
})();
