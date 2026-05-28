/**
 * MAMA fixed SillyTavern status iframe host.
 */
(function () {
  'use strict';

  const ROOT = typeof window !== 'undefined' ? window : globalThis;
  const RUNTIME = ROOT.MAMAMainRuntime || {};
  ROOT.MAMAMainRuntime = RUNTIME;

  const HOST_ID = 'mama-status-host';
  const IFRAME_ID = 'mama-status-iframe';
  const STYLE_ID = 'mama-status-host-style';
  const DEFAULT_APP_BASE_URL = 'https://hasheeper.github.io/project-mama-ena';
  const DEFAULT_STATUS_PATH = 'apps/visual-dashboard/index.html';

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
      #${HOST_ID} {
        position: fixed;
        right: 18px;
        bottom: 18px;
        width: min(470px, calc(100vw - 36px));
        height: min(920px, calc(100vh - 36px));
        z-index: 2147482500;
        pointer-events: none;
      }
      #${HOST_ID} iframe {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
        background: transparent;
        pointer-events: auto;
        border-radius: 28px;
      }
      @media (max-width: 720px) {
        #${HOST_ID} {
          right: 10px;
          left: 10px;
          bottom: 10px;
          width: auto;
          height: min(860px, calc(100vh - 20px));
        }
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
    let ready = false;
    let lastState = null;
    let lastReason = '';

    const version = config.version || '0.1.0';

    function ensureHost() {
      if (host && frame && document.body?.contains(host)) return host;
      ensureStyle();

      host = document.getElementById(HOST_ID) || document.createElement('div');
      host.id = HOST_ID;

      frame = document.getElementById(IFRAME_ID) || document.createElement('iframe');
      frame.id = IFRAME_ID;
      frame.title = 'MAMA Status';
      frame.allow = 'fullscreen';
      frame.referrerPolicy = 'no-referrer';
      frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups allow-same-origin');
      frame.src = resolveStatusUrl(version);
      frame.addEventListener('load', () => {
        ready = true;
        postContainerReady();
        postState(lastReason || 'iframeLoad', lastState);
      });

      host.replaceChildren(frame);
      document.body.append(host);
      return host;
    }

    function postContainerReady() {
      if (!frame?.contentWindow) return;
      frame.contentWindow.postMessage({
        type: 'mama:container-ready',
        appId: 'visual-dashboard',
        app: {
          id: 'visual-dashboard',
          name: 'SillyTavern MAMA Status',
          type: 'status',
          status: 'active'
        }
      }, '*');
    }

    function postState(reason, state) {
      if (!frame?.contentWindow || !ready) return false;
      const nextState = state || lastState;
      if (!nextState) return false;
      frame.contentWindow.postMessage({
        type: 'MAMA_STATE_PUSH',
        reason: reason || 'refresh',
        state: nextState
      }, '*');
      return true;
    }

    async function refreshStatus(reason = 'refresh') {
      waitForBody(() => ensureHost());
      let state;
      try {
        state = await stateService.loadState({ persist: false });
      } catch (error) {
        console.warn('[MAMA Status Host] loadState failed:', error);
        return false;
      }
      lastState = state;
      lastReason = reason;
      return postState(reason, state);
    }

    function handleMessage(event) {
      const data = event?.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'MAMA_STATUS_READY' && data.type !== 'mama:app-ready') return;
      ready = true;
      postContainerReady();
      postState('appReady', lastState);
    }

    function bindEvents() {
      ROOT.addEventListener?.('message', handleMessage);
      ROOT.addEventListener?.('mama:stateChanged', () => refreshStatus('stateChanged'));
      ROOT.addEventListener?.('mama:mvuz-written', () => refreshStatus('mvuzWritten'));
      if (typeof ROOT.eventOn !== 'function') return;
      const bindRefresh = (eventName, reason) => {
        ROOT.eventOn(eventName, () => refreshStatus(reason));
      };
      bindRefresh('message_received', 'messageReceived');
      bindRefresh('character_message_rendered', 'messageRendered');
      bindRefresh('message_updated', 'messageUpdated');
      bindRefresh('generation_ended', 'generationEnded');
      ROOT.eventOn('CHAT_CHANGED', () => {
        ready = false;
        refreshStatus('chatChanged');
      });
      ROOT.eventOn('chat_changed', () => {
        ready = false;
        refreshStatus('chatChanged');
      });
    }

    function start() {
      waitForBody(() => {
        ensureHost();
        refreshStatus('start');
      });
      bindEvents();
    }

    return {
      start,
      refreshStatus,
      ensureHost
    };
  };
})();
