/**
 * MAMA SillyTavern status iframe host.
 */
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

  function pushTarget(targets, target) {
    try {
      if (target && !targets.includes(target)) targets.push(target);
    } catch (_) {}
  }

  const BRIDGE_HOST = resolveBridgeHost();
  const ROOT = BRIDGE_HOST.apiRoot || CURRENT_ROOT.MAMA_ST_API_ROOT || CURRENT_ROOT.MAMA_ST_HOST_ROOT || CURRENT_ROOT;
  const UI_ROOT = BRIDGE_HOST.root || BRIDGE_HOST.uiRoot || CURRENT_ROOT.MAMA_ST_UI_ROOT || ROOT;
  const DOC = UI_ROOT.document || CURRENT_ROOT.document;
  const TIMER_ROOT = UI_ROOT.setTimeout ? UI_ROOT : CURRENT_ROOT;
  const RUNTIME = ROOT.MAMAMainRuntime || CURRENT_ROOT.MAMAMainRuntime || {};
  ROOT.MAMAMainRuntime = RUNTIME;
  CURRENT_ROOT.MAMAMainRuntime = RUNTIME;

  const HOST_ID = 'mama-status-host';
  const TRIGGER_ID = 'mama-status-trigger';
  const OVERLAY_ID = 'mama-status-overlay';
  const WRAPPER_ID = 'mama-status-wrapper';
  const IFRAME_ID = 'mama-status-iframe';
  const CLOSE_ID = 'mama-status-close';
  const STYLE_ID = 'mama-status-host-style';
  const UNLOAD_KEY = '__MAMA_STATUS_HOST_UNLOAD__';
  const TRIGGER_COLLAPSED_CLASS = 'mama-status-trigger-collapsed';
  const TRIGGER_COLLAPSED_STORAGE_KEY = 'mama.status.triggerCollapsed.v2';
  const DEFAULT_APP_BASE_URL = 'https://hasheeper.github.io/project-mama-ena';
  const DEFAULT_STATUS_PATH = 'apps/visual-dashboard/index.html';

  function getBridgeTargets() {
    const targets = [];
    pushTarget(targets, CURRENT_ROOT);
    pushTarget(targets, ROOT);
    pushTarget(targets, UI_ROOT);
    (Array.isArray(BRIDGE_HOST.candidates) ? BRIDGE_HOST.candidates : []).forEach((target) => pushTarget(targets, target));
    targets.slice().forEach((target) => {
      try { pushTarget(targets, target.parent); } catch (_) {}
      try { pushTarget(targets, target.top); } catch (_) {}
    });
    return targets;
  }

  function isEnabled(value) {
    return value === true || value === 'true' || value === '1' || value === 1;
  }

  function isDisabled(value) {
    return value === false || value === 'false' || value === '0' || value === 0;
  }

  function trimTrailingSlash(value) {
    return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
  }

  function readGlobalString(key) {
    for (const target of getBridgeTargets()) {
      try {
        if (typeof target?.[key] === 'string' && target[key].trim()) return target[key].trim();
      } catch (_) {}
    }
    return '';
  }

  function appendQueryParams(url, params = {}) {
    const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
    if (!entries.length || typeof url !== 'string' || !url.trim()) return url;
    try {
      const parsed = new URL(url, /^https?:\/\//i.test(url) ? undefined : 'https://mama.local');
      entries.forEach(([key, value]) => parsed.searchParams.set(key, String(value)));
      return /^https?:\/\//i.test(url) ? parsed.href : `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (_) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${entries
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')}`;
    }
  }

  function resolveStatusUrl(version) {
    const explicit = readGlobalString('MAMA_STATUS_URL');
    const base = trimTrailingSlash(readGlobalString('MAMA_APP_BASE_URL') || DEFAULT_APP_BASE_URL);
    const url = explicit || `${base}/${DEFAULT_STATUS_PATH}`;
    return appendQueryParams(url, { bridge: 'st', v: version || '0.1.0' });
  }

  function ensureStyle() {
    if (!DOC?.head || DOC.getElementById(STYLE_ID)) return;
    const style = DOC.createElement('style');
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
        width: min(94vw, 540px);
        height: min(94vh, 940px);
        min-height: 680px;
      }

      #${IFRAME_ID} {
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

  function waitForBody(callback) {
    if (DOC?.body) {
      callback();
      return;
    }
    TIMER_ROOT.setTimeout(() => waitForBody(callback), 100);
  }

  RUNTIME.createStatusHost = function createStatusHost(stateService: any, config: any = {}) {
    let frame: any = null;
    let host: any = null;
    let overlay: any = null;
    let wrapper: any = null;
    let ready = false;
    let iframeInitialized = false;
    let disposed = false;
    let trigger: any = null;
    let triggerFoldButton: any = null;
    let lastState: any = null;
    let lastReason = '';
    let frameReadOptions: any = { persist: false };
    let eventsBound = false;
    const inlineTargets = new Map<any, any>();
    const targetStates = new Map<any, any>();
    const messageTargets: any[] = [];
    const cleanupCallbacks: Array<() => void> = [];

    const version = config.version || '0.1.0';
    const injectStatusHost = !isDisabled(config.injectFixedStatus)
      && !isEnabled(config.disableStatusHost)
      && !isEnabled(ROOT.MAMA_DISABLE_STATUS_HOST)
      && !isEnabled(UI_ROOT.MAMA_DISABLE_STATUS_HOST);

    function removeExistingDom() {
      try { DOC?.getElementById(HOST_ID)?.remove(); } catch (_) {}
      try { DOC?.getElementById(OVERLAY_ID)?.remove(); } catch (_) {}
      try { DOC?.getElementById(STYLE_ID)?.remove(); } catch (_) {}
    }

    function ensureHost() {
      if (
        !disposed
        && host
        && overlay
        && frame
        && DOC?.body?.contains(host)
        && DOC?.body?.contains(overlay)
      ) return host;

      if (!DOC?.body) return null;
      ensureStyle();
      DOC.getElementById(HOST_ID)?.remove();
      DOC.getElementById(OVERLAY_ID)?.remove();

      host = DOC.createElement('div');
      host.id = HOST_ID;

      trigger = DOC.createElement('div');
      trigger.id = TRIGGER_ID;
      trigger.setAttribute('role', 'button');
      trigger.tabIndex = 0;
      trigger.title = 'Open MAMA Status';
      trigger.setAttribute('aria-label', 'Open MAMA Status');
      trigger.innerHTML = [
        '<span class="mama-status-trigger-mark" aria-hidden="true">',
        '<span class="mama-status-trigger-main">MAMA<span class="mama-status-trigger-sub">STATUS</span></span>',
        '<span class="mama-status-trigger-mini">M</span>',
        '</span>',
        '<button class="mama-status-trigger-fold" type="button" title="收起悬浮球" aria-label="收起悬浮球">',
        '<svg class="mama-status-trigger-fold-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
        '<path d="m15 18-6-6 6-6" />',
        '</svg>',
        '<svg class="mama-status-trigger-fold-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
        '<path d="m9 18 6-6-6-6" />',
        '</svg>',
        '</button>'
      ].join('');
      trigger.addEventListener('click', openStatus);
      trigger.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openStatus();
      });
      triggerFoldButton = trigger.querySelector('.mama-status-trigger-fold');
      triggerFoldButton?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setTriggerCollapsed(!trigger.classList.contains(TRIGGER_COLLAPSED_CLASS));
      });

      overlay = DOC.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'MAMA Status');
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeStatus();
      });

      wrapper = DOC.createElement('div');
      wrapper.id = WRAPPER_ID;

      frame = DOC.createElement('iframe');
      frame.id = IFRAME_ID;
      frame.title = 'MAMA Status';
      frame.allow = 'fullscreen';
      frame.referrerPolicy = 'no-referrer';
      frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups allow-same-origin');
      frame.dataset.mamaSrc = resolveStatusUrl(version);
      frame.addEventListener('load', () => {
        ready = true;
        postContainerReady();
        TIMER_ROOT.setTimeout(() => refreshStatus(lastReason || 'iframeLoad'), 40);
      });

      const close = DOC.createElement('button');
      close.id = CLOSE_ID;
      close.type = 'button';
      close.title = 'Close MAMA Status';
      close.setAttribute('aria-label', 'Close MAMA Status');
      close.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>';
      close.addEventListener('click', closeStatus);

      host.replaceChildren(trigger);
      wrapper.replaceChildren(frame, close);
      overlay.replaceChildren(wrapper);
      DOC.body.append(host, overlay);
      restoreTriggerCollapsed();
      console.info('[MAMA Status Host] floating trigger injected into ST host:', {
        url: frame.dataset.mamaSrc,
        uiRoot: UI_ROOT === CURRENT_ROOT ? 'current' : 'host'
      });
      return host;
    }

    function setTriggerCollapsed(collapsed) {
      if (!trigger) return;
      trigger.classList.toggle(TRIGGER_COLLAPSED_CLASS, Boolean(collapsed));
      trigger.title = collapsed ? 'MAMA Status（点击打开，箭头展开）' : 'Open MAMA Status';
      trigger.setAttribute('aria-label', collapsed ? 'Open MAMA Status, collapsed' : 'Open MAMA Status');
      if (triggerFoldButton) {
        triggerFoldButton.title = collapsed ? '展开悬浮球' : '收起悬浮球';
        triggerFoldButton.setAttribute('aria-label', collapsed ? '展开悬浮球' : '收起悬浮球');
      }
      try {
        UI_ROOT.localStorage?.setItem(TRIGGER_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
      } catch (_) {}
    }

    function restoreTriggerCollapsed() {
      let collapsed = false;
      try {
        collapsed = UI_ROOT.localStorage?.getItem(TRIGGER_COLLAPSED_STORAGE_KEY) === '1';
      } catch (_) {}
      setTriggerCollapsed(collapsed);
    }

    function initializeIframe() {
      if (!frame) ensureHost();
      if (!frame || iframeInitialized) return;
      iframeInitialized = true;
      frame.src = frame.dataset.mamaSrc || resolveStatusUrl(version);
    }

    function openStatus() {
      ensureHost();
      if (!overlay) return false;
      overlay.style.display = 'flex';
      initializeIframe();
      TIMER_ROOT.setTimeout(() => refreshStatus('open'), 80);
      return true;
    }

    function closeStatus() {
      if (overlay) overlay.style.display = 'none';
      return Boolean(overlay);
    }

    function isMessageTarget(value) {
      return Boolean(value && typeof value.postMessage === 'function');
    }

    function normalizeMessageId(value) {
      const id = Number(value);
      return Number.isFinite(id) && id >= 0 ? Math.round(id) : null;
    }

    function makeMessageFloorKey(messageId) {
      const id = normalizeMessageId(messageId);
      return id === null ? '' : `message:${id}`;
    }

    function parseMessageIdFromFloorKey(floorKey) {
      const match = String(floorKey || '').trim().match(/^message:(\d+)$/i);
      return match ? normalizeMessageId(match[1]) : null;
    }

    function findIframeForSource(source) {
      if (!source || !DOC?.querySelectorAll) return null;
      const frames = Array.from(DOC.querySelectorAll('iframe')) as HTMLIFrameElement[];
      return frames.find((item) => {
        try {
          return item.contentWindow === source;
        } catch (_) {
          return false;
        }
      }) || null;
    }

    function readMessageIdFromElement(element) {
      if (!element) return null;
      const messageElement = typeof element.closest === 'function'
        ? element.closest('[mesid], [data-message-id], [data-message_id], [message_id], .mes')
        : null;
      if (!messageElement) return null;

      const attrNames = ['mesid', 'data-message-id', 'data-message_id', 'message_id', 'data-index'];
      for (const attrName of attrNames) {
        const id = normalizeMessageId(messageElement.getAttribute?.(attrName));
        if (id !== null) return id;
      }

      const domId = typeof messageElement.id === 'string' ? messageElement.id : '';
      const domMatch = domId.match(/(?:^|[^0-9])(\d+)$/);
      if (domMatch) {
        const id = normalizeMessageId(domMatch[1]);
        if (id !== null) return id;
      }

      try {
        const messages = Array.from(DOC.querySelectorAll('#chat .mes, .mes'));
        const index = messages.indexOf(messageElement);
        return index >= 0 ? index : null;
      } catch (_) {
        return null;
      }
    }

    function resolveMessageIdFromSource(source) {
      const iframe = findIframeForSource(source);
      return readMessageIdFromElement(iframe);
    }

    function resolveReadOptions(source, data: any = {}) {
      const explicitId = normalizeMessageId(data.messageId ?? data.message_id);
      const explicitFloorId = parseMessageIdFromFloorKey(data.floorKey);
      const domId = resolveMessageIdFromSource(source);
      const messageId = explicitId ?? explicitFloorId ?? domId;
      if (messageId === null) return { persist: false };
      return {
        persist: false,
        messageId,
        message_id: messageId,
        floorKey: makeMessageFloorKey(messageId)
      };
    }

    function resolveCurrentReadOptions() {
      try {
        if (typeof stateService.resolveReplayMessageId === 'function') {
          const messageId = normalizeMessageId(stateService.resolveReplayMessageId({}));
          if (messageId !== null) {
            return {
              persist: false,
              messageId,
              message_id: messageId,
              floorKey: makeMessageFloorKey(messageId)
            };
          }
        }
      } catch (_) {}
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
          type: 'mama:container-ready',
          appId: 'visual-dashboard',
          app: {
            id: 'visual-dashboard',
            name: 'SillyTavern MAMA Status',
            type: 'status',
            status: 'active'
          }
        }, '*');
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
      const nextState = state || lastState;
      if (!isMessageTarget(target) || !nextState) return false;
      try {
        target.postMessage({
          type: 'MAMA_STATE_PUSH',
          reason: reason || 'refresh',
          floorKey: readOptionsForTarget(target).floorKey || '',
          state: nextState
        }, '*');
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

    async function refreshTarget(target, reason = 'statusRequest', readOptions = readOptionsForTarget(target)) {
      if (!isMessageTarget(target)) return false;
      let state;
      try {
        state = await stateService.loadState(readOptions || { persist: false });
      } catch (error) {
        console.warn('[MAMA Status Host] loadState failed:', error);
        return false;
      }
      lastState = state;
      lastReason = reason;
      targetStates.set(target, state);
      return postDirectState(target, reason, state);
    }

    async function refreshStatus(reason = 'refresh') {
      if (disposed) return false;
      if (injectStatusHost) waitForBody(() => ensureHost());
      let sent = false;

      if (frame?.contentWindow && ready) {
        try {
          frameReadOptions = resolveCurrentReadOptions();
          const state = await stateService.loadState(frameReadOptions);
          lastState = state;
          lastReason = reason;
          sent = postState(reason, state) || sent;
        } catch (error) {
          console.warn('[MAMA Status Host] loadState failed:', error);
        }
      }

      const results = await Promise.all(Array.from(inlineTargets.entries()).map(([target, readOptions]) => {
        return refreshTarget(target, reason, readOptions);
      }));
      return results.some(Boolean) || sent;
    }

    function handleMessage(event) {
      const data = event?.data;
      if (!data || typeof data !== 'object') return;
      const isReady = data.type === 'MAMA_STATUS_READY' || data.type === 'mama:app-ready';
      const isRequest = data.type === 'MAMA_STATUS_REQUEST';
      if (!isReady && !isRequest) return;
      const appId = typeof data.appId === 'string' ? data.appId : data.app?.id;
      if (appId && appId !== 'visual-dashboard' && appId !== 'expression-portrait') return;

      if (event.source === frame?.contentWindow) {
        ready = true;
        postContainerReady();
        void refreshStatus(data.reason || (isRequest ? 'statusRequest' : 'appReady'));
        return;
      }

      const readOptions = resolveReadOptions(event.source, data);
      const target = registerInlineTarget(event.source, readOptions);
      if (!target) return;

      if (targetStates.has(target)) postDirectState(target, isRequest ? 'statusRequest' : 'appReady', targetStates.get(target));
      void refreshTarget(target, data.reason || (isRequest ? 'statusRequest' : 'appReady'), readOptions);
    }

    function bindWindowMessageTargets() {
      getBridgeTargets().forEach((target) => {
        if (!target || messageTargets.includes(target)) return;
        try {
          target.removeEventListener?.('message', handleMessage);
          target.addEventListener?.('message', handleMessage);
          messageTargets.push(target);
        } catch (_) {}
      });
    }

    function bindMamaEvent(target, eventName, handler) {
      try {
        target?.removeEventListener?.(eventName, handler);
        target?.addEventListener?.(eventName, handler);
        cleanupCallbacks.push(() => target.removeEventListener?.(eventName, handler));
      } catch (_) {}
    }

    function bindSillyTavernEvent(target, eventName, reason, delayMs = 0) {
      if (typeof target?.eventOn !== 'function') return;
      try {
        const stop = target.eventOn(eventName, () => {
          if (delayMs > 0) {
            TIMER_ROOT.setTimeout(() => refreshStatus(reason), delayMs);
            return;
          }
          void refreshStatus(reason);
        });
        if (typeof stop === 'function') cleanupCallbacks.push(stop);
      } catch (_) {}
    }

    function bindEvents() {
      if (eventsBound) return;
      eventsBound = true;
      bindWindowMessageTargets();

      const keydownHandler = (event) => {
        if (event?.key === 'Escape' && overlay?.style?.display !== 'none') closeStatus();
      };
      try {
        DOC?.removeEventListener?.('keydown', keydownHandler);
        DOC?.addEventListener?.('keydown', keydownHandler);
        cleanupCallbacks.push(() => DOC?.removeEventListener?.('keydown', keydownHandler));
      } catch (_) {}

      const stateChangedHandler = () => refreshStatus('stateChanged');
      const mvuzWrittenHandler = () => refreshStatus('mvuzWritten');
      getBridgeTargets().forEach((target) => {
        bindMamaEvent(target, 'mama:stateChanged', stateChangedHandler);
        bindMamaEvent(target, 'mama:mvuz-written', mvuzWrittenHandler);
      });

      getBridgeTargets().forEach((target) => {
        bindSillyTavernEvent(target, 'message_received', 'messageReceived', 1200);
        bindSillyTavernEvent(target, 'character_message_rendered', 'messageRendered', 250);
        bindSillyTavernEvent(target, 'message_updated', 'messageUpdated', 400);
        bindSillyTavernEvent(target, 'generation_ended', 'generationEnded', 300);
        bindSillyTavernEvent(target, 'CHAT_CHANGED', 'chatChanged', 250);
        bindSillyTavernEvent(target, 'chat_changed', 'chatChanged', 250);
      });
    }

    function unload() {
      disposed = true;
      ready = false;
      iframeInitialized = false;
      cleanupCallbacks.splice(0).forEach((cleanup) => {
        try { cleanup(); } catch (_) {}
      });
      messageTargets.splice(0).forEach((target) => {
        try { target.removeEventListener?.('message', handleMessage); } catch (_) {}
      });
      inlineTargets.clear();
      targetStates.clear();
      removeExistingDom();
      host = null;
      overlay = null;
      wrapper = null;
      frame = null;
      trigger = null;
      triggerFoldButton = null;
      try {
        if (UI_ROOT[UNLOAD_KEY] === unload) delete UI_ROOT[UNLOAD_KEY];
      } catch (_) {}
    }

    function start() {
      try {
        if (typeof UI_ROOT[UNLOAD_KEY] === 'function' && UI_ROOT[UNLOAD_KEY] !== unload) {
          UI_ROOT[UNLOAD_KEY]();
        }
      } catch (_) {}
      disposed = false;
      UI_ROOT[UNLOAD_KEY] = unload;
      bindEvents();
      if (injectStatusHost) {
        waitForBody(() => {
          ensureHost();
          void refreshStatus('start');
        });
      }
      try {
        UI_ROOT.removeEventListener?.('pagehide', unload);
        UI_ROOT.addEventListener?.('pagehide', unload);
        cleanupCallbacks.push(() => UI_ROOT.removeEventListener?.('pagehide', unload));
      } catch (_) {}
    }

    function debug() {
      return {
        disposed,
        ready,
        iframeInitialized,
        injected: Boolean(DOC?.getElementById(TRIGGER_ID)),
        open: overlay?.style?.display || '',
        statusUrl: frame?.dataset?.mamaSrc || '',
        collapsed: Boolean(trigger?.classList?.contains(TRIGGER_COLLAPSED_CLASS)),
        hostRoot: UI_ROOT === CURRENT_ROOT ? 'current' : 'host',
        apiRoot: ROOT === CURRENT_ROOT ? 'current' : 'host'
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
