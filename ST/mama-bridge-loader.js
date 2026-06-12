/**
 * Project MAMA SillyTavern loader.
 *
 * Put this in JS-Slash-Runner script library.
 * Use ?env=prod or set window.MAMA_LOADER_ENV = 'prod' for GitHub Pages.
 */
function readLoaderParams() {
  try {
    return new URL(import.meta.url).searchParams;
  } catch (_) {
    return new URLSearchParams();
  }
}

const LOADER_PARAMS = readLoaderParams();
const LOADER_ENV = String(
  LOADER_PARAMS.get('env')
    || window.MAMA_LOADER_ENV
    || window.ST_BRIDGE_ENV
    || 'local'
).toLowerCase() === 'prod'
  ? 'prod'
  : 'local';
const USE_LOCAL = LOADER_ENV === 'local';
const CACHE_KEY = `mama-host-${Date.now()}`;
const BRIDGE_BASE = USE_LOCAL
  ? 'http://127.0.0.1:4173'
  : 'https://hasheeper.github.io/project-mama-ena';
const LOAD_WARN_MS = Number(window.MAMA_LOADER_WARN_MS) > 0
  ? Number(window.MAMA_LOADER_WARN_MS)
  : 8000;
const IMPORT_TIMEOUT_MS = Number(window.MAMA_LOADER_IMPORT_TIMEOUT_MS) > 0
  ? Number(window.MAMA_LOADER_IMPORT_TIMEOUT_MS)
  : 25000;
const READY_TIMEOUT_MS = Number(window.MAMA_LOADER_READY_TIMEOUT_MS) > 0
  ? Number(window.MAMA_LOADER_READY_TIMEOUT_MS)
  : 25000;
const LOADER_STARTED_AT = Date.now();
const LOADER_TOAST_KEY = '__MAMA_ST_BRIDGE_LOADING_TOAST__';
const SUCCESS_NOTICE_ENABLED = window.MAMA_LOADER_SUCCESS_NOTICE !== false;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char] || char);
}

function formatErrorMessage(error) {
  if (!error) return 'unknown error';
  if (typeof error.message === 'string' && error.message) return error.message;
  return String(error);
}

function getSillyTavernApi() {
  try {
    if (typeof SillyTavern === 'object' && SillyTavern) return SillyTavern;
  } catch (_) {}
  try {
    if (window.SillyTavern) return window.SillyTavern;
  } catch (_) {}
  return null;
}

function getToastrApi() {
  try {
    if (typeof toastr === 'object' && toastr) return toastr;
  } catch (_) {}
  try {
    if (window.toastr) return window.toastr;
  } catch (_) {}
  return null;
}

function showToastNotice(level, title, message, options = {}) {
  const normalizedLevel = ['success', 'info', 'warning', 'error'].includes(level) ? level : 'info';
  try {
    const toast = getToastrApi();
    if (toast && typeof toast[normalizedLevel] === 'function') {
      const value = toast[normalizedLevel](message, title, {
        closeButton: true,
        newestOnTop: true,
        progressBar: false,
        escapeHtml: true,
        timeOut: options.timeOut ?? (normalizedLevel === 'error' ? 0 : 5000),
        extendedTimeOut: options.extendedTimeOut ?? 0,
        tapToDismiss: options.tapToDismiss
      });
      return { kind: 'toastr', api: toast, value };
    }
  } catch (error) {
    console.warn('[MAMA Loader] Tavern toast failed:', error);
  }
  return null;
}

function clearNoticeHandle(handle) {
  if (!handle) return;
  if (handle.kind === 'toastr' && handle.api && typeof handle.api.clear === 'function') {
    try {
      handle.api.clear(handle.value);
    } catch (_) {}
  }
}

function clearLoadingToast() {
  const handle = window[LOADER_TOAST_KEY];
  window[LOADER_TOAST_KEY] = null;
  clearNoticeHandle(handle);
}

function showLoadingToast() {
  clearLoadingToast();
  window[LOADER_TOAST_KEY] = showToastNotice(
    'info',
    'MAMA 脚本加载中',
    '脚本正在加载，请稍后。',
    { timeOut: 0, extendedTimeOut: 0, tapToDismiss: false }
  );
}

function showTavernNotice(level, title, message, options = {}) {
  const normalizedLevel = ['success', 'info', 'warning', 'error'].includes(level) ? level : 'info';
  const noticeTitle = title || '[MAMA Loader]';
  const noticeMessage = message || '';
  window.__MAMA_LAST_LOADER_NOTICE__ = {
    level: normalizedLevel,
    title: noticeTitle,
    message: noticeMessage,
    at: new Date().toISOString()
  };

  if (options.usePopup !== false) {
    try {
      const tavern = getSillyTavernApi();
      if (tavern && typeof tavern.callGenericPopup === 'function') {
        const popupType = tavern.POPUP_TYPE?.TEXT || 'text';
        const html = `<strong>${escapeHtml(noticeTitle)}</strong><br>${escapeHtml(noticeMessage).replace(/\n/g, '<br>')}`;
        const popupResult = tavern.callGenericPopup(html, popupType, '', { wide: false, large: false });
        Promise.resolve(popupResult).catch((error) => {
          console.warn('[MAMA Loader] Tavern popup failed:', error);
        });
        return true;
      }
    } catch (error) {
      console.warn('[MAMA Loader] Tavern popup failed:', error);
    }
  }

  try {
    const toast = getToastrApi();
    if (toast && typeof toast[normalizedLevel] === 'function') {
      toast[normalizedLevel](noticeMessage, noticeTitle, {
        closeButton: true,
        newestOnTop: true,
        timeOut: options.timeOut ?? (normalizedLevel === 'error' ? 0 : 5000),
        extendedTimeOut: options.extendedTimeOut ?? 0
      });
      return true;
    }
  } catch (error) {
    console.warn('[MAMA Loader] Tavern toast failed:', error);
  }

  const consoleMethod = normalizedLevel === 'error'
    ? 'error'
    : (normalizedLevel === 'warning' ? 'warn' : 'log');
  console[consoleMethod](`${noticeTitle} ${noticeMessage}`);
  return false;
}

function setLoaderStatus(status, detail = {}) {
  window.__MAMA_LOADER_STATUS__ = {
    status,
    env: window.ST_BRIDGE_ENV,
    bridge: window.ST_BRIDGE_URL,
    cacheKey: CACHE_KEY,
    startedAt: new Date(LOADER_STARTED_AT).toISOString(),
    elapsedMs: Date.now() - LOADER_STARTED_AT,
    ...detail
  };
  return window.__MAMA_LOADER_STATUS__;
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    Promise.resolve(promise).then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function getBridgeReadyPromise() {
  const ready = window.__MAMA_ST_BRIDGE_READY__;
  if (ready && typeof ready.then === 'function') return ready;
  if (window.STBridge && window.MAMAPlugin) return Promise.resolve(window.STBridge.state || true);
  return Promise.reject(new Error('MAMA bridge imported, but __MAMA_ST_BRIDGE_READY__ was not exposed.'));
}

window.ST_BRIDGE_PACK = 'mama-main';
window.ST_BRIDGE_ENV = USE_LOCAL ? 'local' : 'prod';
window.MAMA_APP_BASE_URL = BRIDGE_BASE;
window.ST_BRIDGE_URL = `${BRIDGE_BASE}/apps/st-bridge/bridge.js`;

window.MAMA_ST_API = {
  eventOn: typeof eventOn === 'function' ? eventOn : window.eventOn,
  injectPrompts: typeof injectPrompts === 'function' ? injectPrompts : window.injectPrompts,
  uninjectPrompts: typeof uninjectPrompts === 'function' ? uninjectPrompts : window.uninjectPrompts,
  playAudio: typeof playAudio === 'function' ? playAudio : window.playAudio,
  pauseAudio: typeof pauseAudio === 'function' ? pauseAudio : window.pauseAudio,
  stopAudio: typeof stopAudio === 'function' ? stopAudio : window.stopAudio,
  getCurrentAudio: typeof getCurrentAudio === 'function' ? getCurrentAudio : window.getCurrentAudio,
  setAudioSettings: typeof setAudioSettings === 'function' ? setAudioSettings : window.setAudioSettings,
  tavern_events: typeof tavern_events === 'object' ? tavern_events : window.tavern_events || null
};

const BRIDGE_IMPORT_URL = `${window.ST_BRIDGE_URL}?env=${window.ST_BRIDGE_ENV}&force=1&v=${CACHE_KEY}`;
setLoaderStatus('loading', { importUrl: BRIDGE_IMPORT_URL });
showLoadingToast();

let slowNoticeShown = false;
const slowTimer = window.setTimeout(() => {
  slowNoticeShown = true;
  setLoaderStatus('slow', { importUrl: BRIDGE_IMPORT_URL });
  showTavernNotice(
    'warning',
    'MAMA 脚本加载较慢',
    [
      `已等待 ${Math.round(LOAD_WARN_MS / 1000)} 秒，桥接脚本仍在加载。`,
      `环境：${window.ST_BRIDGE_ENV}`,
      `地址：${window.ST_BRIDGE_URL}`,
      USE_LOCAL ? '本机模式请确认 `npm run local` 或 `npm run host:local` 正在运行。' : '远程模式请检查 GitHub Pages 或网络连接。'
    ].join('\n'),
    { usePopup: true, timeOut: 8000 }
  );
}, LOAD_WARN_MS);

try {
  await withTimeout(
    import(BRIDGE_IMPORT_URL),
    IMPORT_TIMEOUT_MS,
    `MAMA bridge import timed out after ${Math.round(IMPORT_TIMEOUT_MS / 1000)}s`
  );
  setLoaderStatus('imported', { importUrl: BRIDGE_IMPORT_URL });

  await withTimeout(
    getBridgeReadyPromise(),
    READY_TIMEOUT_MS,
    `MAMA bridge ready timed out after ${Math.round(READY_TIMEOUT_MS / 1000)}s`
  );

  const detail = {
    importUrl: BRIDGE_IMPORT_URL,
    hasPlugin: Boolean(window.MAMAPlugin),
    hasPromptApi: typeof window.MAMA_ST_API.injectPrompts === 'function',
    hasAudioApi: typeof window.MAMA_ST_API.playAudio === 'function'
  };
  setLoaderStatus('ready', detail);
  clearLoadingToast();

  if (SUCCESS_NOTICE_ENABLED) {
    showTavernNotice(
      'success',
      'MAMA 脚本加载完成',
      `桥接脚本已完成加载，用时 ${Math.round((Date.now() - LOADER_STARTED_AT) / 100) / 10}s。`,
      { usePopup: false, timeOut: 3500 }
    );
  }

  const warnings = [];
  if (!detail.hasPlugin) warnings.push('未检测到 window.MAMAPlugin。');
  if (!detail.hasPromptApi) warnings.push('未检测到 JS-Slash-Runner 的 injectPrompts API，动态提示词注入可能无法工作。');
  if (warnings.length > 0) {
    showTavernNotice(
      'warning',
      'MAMA 脚本接口不完整',
      `${warnings.join('\n')}\n请确认脚本由 JS-Slash-Runner 执行，并且 MAMA_ST_API 暴露了酒馆助手 API。`,
      { usePopup: true, timeOut: 10000 }
    );
  }

  console.log('[MAMA Loader] loaded', {
    env: window.ST_BRIDGE_ENV,
    bridge: window.ST_BRIDGE_URL,
    ...detail
  });
} catch (error) {
  clearLoadingToast();
  const message = formatErrorMessage(error);
  setLoaderStatus('error', {
    importUrl: BRIDGE_IMPORT_URL,
    error: message
  });
  console.error('[MAMA Loader] failed', error);
  showTavernNotice(
    'error',
    'MAMA 脚本加载失败',
    [
      message,
      '',
      `环境：${window.ST_BRIDGE_ENV}`,
      `地址：${window.ST_BRIDGE_URL}`,
      `耗时：${Math.round((Date.now() - LOADER_STARTED_AT) / 100) / 10}s`,
      USE_LOCAL ? '本机模式请先启动 `npm run local` 或 `npm run host:local`。' : '远程模式请检查 GitHub Pages 地址和网络连接。'
    ].join('\n'),
    { usePopup: true, timeOut: 0 }
  );
  throw error;
} finally {
  window.clearTimeout(slowTimer);
}
