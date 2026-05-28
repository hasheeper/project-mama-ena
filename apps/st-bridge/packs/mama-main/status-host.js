/**
 * MAMA SillyTavern status iframe host.
 */
(function () {
  'use strict';

  const ROOT = typeof window !== 'undefined' ? window : globalThis;
  const RUNTIME = ROOT.MAMAMainRuntime || {};
  ROOT.MAMAMainRuntime = RUNTIME;

  const HOST_ID = 'mama-status-host';
  const TRIGGER_ID = 'mama-status-trigger';
  const OVERLAY_ID = 'mama-status-overlay';
  const WRAPPER_ID = 'mama-status-wrapper';
  const IFRAME_ID = 'mama-status-iframe';
  const CLOSE_ID = 'mama-status-close';
  const STYLE_ID = 'mama-status-host-style';
  const DEFAULT_APP_BASE_URL = 'https://hasheeper.github.io/project-mama-ena';
  const DEFAULT_STATUS_PATH = 'apps/visual-dashboard/index.html';

  function isEnabled(value) {
    return value === true || value === 'true' || value === '1' || value === 1;
  }

  function isDisabled(value) {
    return value === false || value === 'false' || value === '0' || value === 0;
  }

  function trimTrailingSlash(value) {
    return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
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
    const explicit = typeof ROOT.MAMA_STATUS_URL === 'string' && ROOT.MAMA_STATUS_URL.trim()
      ? ROOT.MAMA_STATUS_URL.trim()
      : '';
    const base = trimTrailingSlash(ROOT.MAMA_APP_BASE_URL || DEFAULT_APP_BASE_URL);
    const url = explicit || `${base}/${DEFAULT_STATUS_PATH}`;
    return appendQueryParams(url, { bridge: 'st', v: version || '0.1.0' });
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
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
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 2147482500;
      }

      #${TRIGGER_ID} {
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
        position: relative;
        overflow: hidden;
        box-shadow: 0 16px 38px rgba(45, 35, 50, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.68);
        animation: mamaStatusFloat 3.2s ease-in-out infinite, mamaStatusPulse 3.4s ease-in-out infinite;
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        font: 900 13px/1.05 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 1px;
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
      }

      #${TRIGGER_ID} .mama-status-trigger-sub {
        display: block;
        margin-top: 3px;
        font-size: 8px;
        color: rgba(64, 31, 44, 0.62);
        letter-spacing: 1.6px;
      }

      #${OVERLAY_ID} {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(37, 31, 42, 0.42);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 2147482501;
        overflow: hidden;
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
    document.head?.append(style);
  }

  function waitForBody(callback) {
    if (document.body) {
      callback();
      return;
    }
    ROOT.setTimeout(() => waitForBody(callback), 100);
  }

  RUNTIME.createStatusHost = function createStatusHost(stateService, config = {}) {
    let frame = null;
    let host = null;
    let overlay = null;
    let wrapper = null;
    let ready = false;
    let lastState = null;
    let lastReason = '';
    let frameReadOptions = { persist: false };
    let eventsBound = false;
    const inlineTargets = new Map();
    const targetStates = new Map();

    const version = config.version || '0.1.0';
    const injectStatusHost = !isDisabled(config.injectFixedStatus)
      && !isEnabled(config.disableStatusHost)
      && !isEnabled(ROOT.MAMA_DISABLE_STATUS_HOST);

    function ensureHost() {
      if (
        host
        && overlay
        && frame
        && document.body?.contains(host)
        && document.body?.contains(overlay)
      ) return host;
      ensureStyle();

      document.getElementById(HOST_ID)?.remove();
      document.getElementById(OVERLAY_ID)?.remove();

      host = document.createElement('div');
      host.id = HOST_ID;

      const trigger = document.createElement('button');
      trigger.id = TRIGGER_ID;
      trigger.type = 'button';
      trigger.title = 'Open MAMA Status';
      trigger.setAttribute('aria-label', 'Open MAMA Status');
      trigger.innerHTML = [
        '<span class="mama-status-trigger-mark">',
        '<span>MAMA<span class="mama-status-trigger-sub">STATUS</span></span>',
        '</span>'
      ].join('');
      trigger.addEventListener('click', openStatus);

      overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'MAMA Status');
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeStatus();
      });

      wrapper = document.createElement('div');
      wrapper.id = WRAPPER_ID;

      frame = document.createElement('iframe');
      frame.id = IFRAME_ID;
      frame.title = 'MAMA Status';
      frame.allow = 'fullscreen';
      frame.referrerPolicy = 'no-referrer';
      frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups allow-same-origin');
      frame.src = resolveStatusUrl(version);
      frame.addEventListener('load', () => {
        ready = true;
        postContainerReady();
        void refreshStatus(lastReason || 'iframeLoad');
      });

      const close = document.createElement('button');
      close.id = CLOSE_ID;
      close.type = 'button';
      close.title = 'Close MAMA Status';
      close.setAttribute('aria-label', 'Close MAMA Status');
      close.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>';
      close.addEventListener('click', closeStatus);

      host.replaceChildren(trigger);
      wrapper.replaceChildren(frame, close);
      overlay.replaceChildren(wrapper);
      document.body.append(host, overlay);
      return host;
    }

    function openStatus() {
      ensureHost();
      if (overlay) overlay.style.display = 'flex';
      void refreshStatus('open');
      return Boolean(overlay);
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
      if (!source || !ROOT.document?.querySelectorAll) return null;
      const frames = Array.from(ROOT.document.querySelectorAll('iframe'));
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
        const messages = Array.from(ROOT.document.querySelectorAll('#chat .mes, .mes'));
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

    function resolveReadOptions(source, data = {}) {
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

    function readOptionsForTarget(target) {
      if (target === frame?.contentWindow) return frameReadOptions;
      return inlineTargets.get(target) || { persist: false };
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
      if (appId && appId !== 'visual-dashboard') return;

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

    function bindEvents() {
      if (eventsBound) return;
      eventsBound = true;
      ROOT.addEventListener?.('message', handleMessage);
      ROOT.addEventListener?.('keydown', (event) => {
        if (event?.key === 'Escape' && overlay?.style?.display !== 'none') closeStatus();
      });
      ROOT.addEventListener?.('mama:stateChanged', () => refreshStatus('stateChanged'));
      ROOT.addEventListener?.('mama:mvuz-written', () => refreshStatus('mvuzWritten'));
      if (typeof ROOT.eventOn !== 'function') return;
      const bindRefresh = (eventName, reason, delayMs = 0) => {
        ROOT.eventOn(eventName, () => {
          if (delayMs > 0) {
            ROOT.setTimeout(() => refreshStatus(reason), delayMs);
            return;
          }
          refreshStatus(reason);
        });
      };
      bindRefresh('message_received', 'messageReceived', 1200);
      bindRefresh('character_message_rendered', 'messageRendered', 250);
      bindRefresh('message_updated', 'messageUpdated', 400);
      bindRefresh('generation_ended', 'generationEnded', 300);
      ROOT.eventOn('CHAT_CHANGED', () => {
        ready = Boolean(frame?.contentWindow);
        refreshStatus('chatChanged');
      });
      ROOT.eventOn('chat_changed', () => {
        ready = Boolean(frame?.contentWindow);
        refreshStatus('chatChanged');
      });
    }

    function start() {
      bindEvents();
      if (injectStatusHost) {
        waitForBody(() => {
          ensureHost();
          refreshStatus('start');
        });
      }
    }

    return {
      start,
      refreshStatus,
      ensureHost,
      openStatus,
      closeStatus
    };
  };
})();
