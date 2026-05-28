(function () {
  'use strict';

  const ROOT = typeof window !== 'undefined' ? window : globalThis;
  const bridge = ROOT.STBridge;
  if (!bridge) return;

  const RUNTIME = ROOT.MAMAMainRuntime || {};
  const stateService = typeof RUNTIME.createStateReplay === 'function'
    ? RUNTIME.createStateReplay()
    : null;
  const promptRuntime = stateService && typeof RUNTIME.createPromptInjection === 'function'
    ? RUNTIME.createPromptInjection(stateService)
    : null;
  const statusHost = stateService && typeof RUNTIME.createStatusHost === 'function'
    ? RUNTIME.createStatusHost(stateService, { version: bridge.version || '0.1.0' })
    : null;

  async function loadState(options = {}) {
    return stateService ? stateService.loadState(options) : bridge.mvuz.read('mama', options);
  }

  async function saveState(nextState, options = {}) {
    const state = stateService
      ? await stateService.saveState(nextState, options)
      : await bridge.mvuz.write('mama', nextState, options);
    await refreshStatus(options.reason || 'saveState');
    return state;
  }

  async function patchState(patcher, options = {}) {
    const state = stateService
      ? await stateService.patchState(patcher, options)
      : await bridge.mvuz.patch('mama', patcher, options);
    await refreshStatus(options.reason || 'patchState');
    return state;
  }

  async function refreshStatus(reason = 'refresh') {
    if (!statusHost) return false;
    return statusHost.refreshStatus(reason);
  }

  function bindPromptInjection() {
    if (!promptRuntime || typeof ROOT.eventOn !== 'function') return;
    ROOT.eventOn('GENERATION_AFTER_COMMANDS', (...args) => {
      promptRuntime.injectCurrentState(...args);
    });
  }

  bridge.registerActions('mama', {
    async ping(payload) {
      return {
        ok: true,
        product: 'mama-ena',
        received: payload || {},
        at: new Date().toISOString()
      };
    },
    async openDashboard() {
      const opened = Boolean(statusHost?.openStatus?.());
      return {
        ok: true,
        opened,
        url: ROOT.MAMA_STATUS_URL || ROOT.MAMA_APP_URL || ''
      };
    },
    async readState(payload) {
      return {
        ok: true,
        state: await loadState(payload && typeof payload === 'object' ? payload : {})
      };
    },
    async patchState(payload) {
      const patch = payload && typeof payload === 'object' ? payload : {};
      const state = await patchState((draft) => ({ ...draft, ...patch }), {
        operationId: 'state:action',
        reason: 'actionPatchState'
      });
      return { ok: true, state };
    },
    async refreshStatus(payload) {
      return {
        ok: true,
        refreshed: await refreshStatus(payload?.reason || 'actionRefresh')
      };
    }
  });

  ROOT.MAMAPlugin = {
    version: '0.1.0',
    bridge,
    loadState,
    saveState,
    patchState,
    refreshStatus,
    openStatus() {
      return statusHost?.openStatus?.();
    },
    closeStatus() {
      return statusHost?.closeStatus?.();
    },
    openDashboardUrl: ROOT.MAMA_STATUS_URL || ROOT.MAMA_APP_URL || ''
  };

  bindPromptInjection();
  statusHost?.start?.();
})();
