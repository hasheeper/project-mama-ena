/**
 * MAMA prompt injection runtime.
 */
(function () {
  'use strict';

  const ROOT = typeof window !== 'undefined' ? window : globalThis;
  const RUNTIME = ROOT.MAMAMainRuntime || {};
  ROOT.MAMAMainRuntime = RUNTIME;

  const INJECT_ID = 'mama_status_context';
  const ALLOWED_PATHS = [
    '/mama/affection',
    '/mama/outfit',
    '/mama/expression',
    '/mama/mascotComment',
    '/mama/enaDialogue'
  ];

  function buildMamaPrompt(state) {
    return `<mama_status>
affection: ${state.affection}/255
outfit: ${state.outfit}
expression: ${state.expression}
mascotComment: ${state.mascotComment}
enaDialogue: ${state.enaDialogue}

You may update only these MVU JSONPatch paths:
${ALLOWED_PATHS.map((path) => `- ${path}`).join('\n')}

When MAMA state changes, append an UpdateVariable block like:
<UpdateVariable>
<JSONPatch>[{"op":"replace","path":"/mama/expression","value":"exp_smile_soft"}]</JSONPatch>
</UpdateVariable>
Do not put <exp> portraits into MAMA state. <exp>...</exp> is only for the current message portrait iframe.
</mama_status>`;
  }

  function isDryRun(args) {
    if (args.length >= 3) return args[2] === true;
    const detail = args[0];
    return Boolean(detail && typeof detail === 'object' && detail.dryRun === true);
  }

  RUNTIME.createPromptInjection = function createPromptInjection(stateService) {
    async function injectCurrentState(...args) {
      if (isDryRun(args)) return false;
      if (typeof ROOT.injectPrompts !== 'function') return false;

      let state;
      try {
        state = await stateService.loadState({ persist: false });
      } catch (error) {
        console.warn('[MAMA Prompt] loadState failed:', error);
        return false;
      }

      const content = buildMamaPrompt(state);
      try {
        if (typeof ROOT.uninjectPrompts === 'function') ROOT.uninjectPrompts([INJECT_ID]);
      } catch (_) {}
      ROOT.injectPrompts([{
        id: INJECT_ID,
        position: 'in_chat',
        depth: 2,
        role: 'system',
        should_scan: false,
        content
      }]);
      return true;
    }

    return {
      INJECT_ID,
      ALLOWED_PATHS,
      buildMamaPrompt,
      injectCurrentState
    };
  };
})();
