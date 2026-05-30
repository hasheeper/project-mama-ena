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
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;900&display=swap');

      @keyframes mamaStatusFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }

      @keyframes mamaStatusPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(228, 124, 154, 0.25), 0 10px 24px rgba(45, 35, 50, 0.12); }
        50% { box-shadow: 0 0 0 12px rgba(228, 124, 154, 0), 0 14px 28px rgba(45, 35, 50, 0.16); }
      }

      #${HOST_ID} {
        position: static !important;
        z-index: 2147483645 !important;
        pointer-events: none !important;
        --text-main: #332d36;
        --text-sub: #8d8592;
        --frame-purple: #dfd1eb;
        --ena-pink: #e47c9a;
        --bg-cream: #fdfcff;
      }

      #${TRIGGER_ID} {
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
        width: 68px;
        height: 68px;
        background: var(--bg-cream);
        border: 1.5px solid rgba(228, 124, 154, 0.4);
        border-radius: 18px;
        color: var(--text-main);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        overflow: visible;
        z-index: 2147483645 !important;
        pointer-events: auto !important;
        box-shadow: 0 10px 24px rgba(45, 35, 50, 0.12), inset 0 0 0 2px #ffffff;
        animation: mamaStatusFloat 3.5s ease-in-out infinite, mamaStatusPulse 3.5s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        font-family: "Nunito", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      #${TRIGGER_ID}::before {
        display: none;
      }

      #${TRIGGER_ID}:hover {
        transform: scale(1.06);
        border-color: var(--ena-pink);
        box-shadow: 0 14px 32px rgba(45, 35, 50, 0.16), inset 0 0 0 2px #ffffff;
      }

      #${TRIGGER_ID} .mama-status-trigger-mark {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border-radius: 12px;
        background: #f8f6fa;
        border: 1px dashed var(--frame-purple);
        transition: transform 0.25s ease;
      }

      #${TRIGGER_ID}:hover .mama-status-trigger-mark {
        transform: scale(1.04);
      }

      #${TRIGGER_ID} .mama-status-trigger-main {
        font-weight: 900;
        font-size: 11px;
        line-height: 1.1;
        letter-spacing: 1px;
        color: var(--text-main);
        text-align: center;
      }

      #${TRIGGER_ID} .mama-status-trigger-sub {
        display: block;
        margin-top: 2px;
        font-size: 8px;
        color: var(--text-sub);
        letter-spacing: 1.5px;
      }

      #${TRIGGER_ID} .mama-status-trigger-mini {
        display: none;
      }

      .mama-status-trigger-fold {
        position: absolute;
        right: -6px;
        bottom: -6px;
        appearance: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: var(--ena-pink);
        border: 2px solid #ffffff;
        border-radius: 50%;
        color: #ffffff;
        cursor: pointer;
        padding: 0;
        z-index: 2;
        box-shadow: 0 4px 8px rgba(228, 124, 154, 0.35);
        transition: transform 0.2s ease, background 0.2s ease;
      }

      .mama-status-trigger-fold:hover {
        transform: translateY(-1px) scale(1.05);
        background: #d66484;
      }

      .mama-status-trigger-fold svg {
        width: 14px;
        height: 14px;
        transform: translateX(0.5px);
      }

      .mama-status-trigger-fold-open {
        display: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} {
        right: 0 !important;
        width: 26px;
        height: 56px;
        border-radius: 12px 0 0 12px;
        background: var(--bg-cream);
        border: 1.5px solid rgba(228, 124, 154, 0.4);
        border-right: none;
        opacity: 1;
        animation: none;
        box-shadow: -4px 4px 14px rgba(45, 35, 50, 0.08);
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS}::before {
        display: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS}:hover {
        transform: none;
        background: #ffffff;
        border-color: var(--ena-pink);
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-mark {
        width: 100%;
        height: 100%;
        border-radius: 0;
        background: transparent;
        border: none;
        transform: translateY(-8px);
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS}:hover .mama-status-trigger-mark {
        transform: translateY(-8px);
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-main {
        display: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-mini {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-mini svg {
        width: 16px;
        height: 16px;
        margin-left: 2px;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-fold {
        right: 1.5px;
        bottom: 2px;
        width: 20px;
        height: 20px;
        border-width: 1.5px;
        box-shadow: none;
      }

      #${TRIGGER_ID}.${TRIGGER_COLLAPSED_CLASS} .mama-status-trigger-fold svg {
        width: 12px;
        height: 12px;
        transform: translateX(-0.5px);
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
      const version = config.cacheBust || config.version || "0.1.0";
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
          '<span class="mama-status-trigger-mini">',
          '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
          '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="var(--ena-pink)" stroke-width="2.5" stroke-linejoin="round"/>',
          '<path d="M12 17.5l-1.1-1C7.5 13.5 5.5 11.5 5.5 9C5.5 7.5 6.5 6.5 8 6.5c1 0 1.8.5 2.2 1.2C10.8 6.5 11.5 6.5 12 7c.5-.5 1.2-.5 1.8-.7C14.2 5.6 15 6 16 6.5c1.5 0 2.5 1 2.5 2.5 0 2.5-2 4.5-5.4 7.5L12 17.5z" fill="var(--ena-pink)"/>',
          "</svg>",
          "</span>",
          "</span>",
          '<button class="mama-status-trigger-fold" type="button" title="收起悬浮球" aria-label="收起悬浮球">',
          '<svg class="mama-status-trigger-fold-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
          '<path d="m9 18 6-6-6-6" />',
          "</svg>",
          '<svg class="mama-status-trigger-fold-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
          '<path d="m15 18-6-6 6-6" />',
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
