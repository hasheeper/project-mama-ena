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
    }
  });

  ROOT.MAMAPlugin = {
    version: '0.1.0',
    bridge,
    openDashboardUrl: ROOT.MAMA_APP_URL || ''
  };
})();
