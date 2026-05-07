(function () {
  'use strict';

  const ROOT = typeof window !== 'undefined' ? window : globalThis;
  const bridge = ROOT.STBridge;
  if (!bridge) return;

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
      return {
        ok: true,
        url: ROOT.MAMA_APP_URL || ''
      };
    },
    async readState() {
      return {
        ok: true,
        state: await bridge.mvuz.read('mama')
      };
    },
    async patchState(payload) {
      const patch = payload && typeof payload === 'object' ? payload : {};
      const state = await bridge.mvuz.patch('mama', (draft) => {
        draft.dashboard = {
          ...(draft.dashboard || {}),
          payload: patch
        };
        return draft;
      });
      return { ok: true, state };
    }
  });

  ROOT.MAMAPlugin = {
    version: '0.1.0',
    bridge,
    openDashboardUrl: ROOT.MAMA_APP_URL || ''
  };
})();
