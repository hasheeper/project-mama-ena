/**
 * MAMA prompt injection runtime.
 */
import { MAMA_ALLOWED_FIELD_PATHS, MAMA_TIME_PHASE_LABELS } from '../../shared/mama';

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

  const BRIDGE_HOST = resolveBridgeHost();
  const ROOT = BRIDGE_HOST.apiRoot || CURRENT_ROOT.MAMA_ST_API_ROOT || CURRENT_ROOT.MAMA_ST_HOST_ROOT || CURRENT_ROOT;
  const RUNTIME = ROOT.MAMAMainRuntime || CURRENT_ROOT.MAMAMainRuntime || {};
  ROOT.MAMAMainRuntime = RUNTIME;
  CURRENT_ROOT.MAMAMainRuntime = RUNTIME;

  const INJECT_ID = 'mama_status_context';
  const ALLOWED_PATHS = [...MAMA_ALLOWED_FIELD_PATHS];

  function formatCounter(value) {
    const number = Number(value);
    const safeValue = Number.isFinite(number) ? Math.max(1, Math.round(number)) : 1;
    return String(safeValue).padStart(2, '0');
  }

  function getTimePhaseLabel(timePhase) {
    return MAMA_TIME_PHASE_LABELS[timePhase] || MAMA_TIME_PHASE_LABELS.morning;
  }

  function formatTimePhaseGuide() {
    return Object.entries(MAMA_TIME_PHASE_LABELS)
      .map(([key, label]) => `${key}=${label}`)
      .join(', ');
  }

  function buildMamaPrompt(state) {
    const timePhaseLabel = getTimePhaseLabel(state.timePhase);
    return `<mama_status>
affection: ${state.affection}/255
time: WEEK ${formatCounter(state.week)} / DAY ${formatCounter(state.day)} / ${state.timePhase}(${timePhaseLabel})
timePhaseGuide: ${formatTimePhaseGuide()}
location: ${state.location}
outfit: ${state.outfit}
mascotEmotion: ${state.mascotEmotion}
mascotComment: ${state.mascotComment}
enaDialogue: ${state.enaDialogue}

You may update only these MVU JSONPatch paths:
${ALLOWED_PATHS.map((path) => `- ${path}`).join('\n')}

When MAMA state changes, append an UpdateVariable block like:
<UpdateVariable>
<JSONPatch>[{"op":"replace","path":"/mama/timePhase","value":"noon"},{"op":"replace","path":"/mama/location","value":"school_rooftop"}]</JSONPatch>
</UpdateVariable>
Update /mama/week, /mama/day, and /mama/timePhase only when story time advances. Valid timePhase values are morning, noon, dusk, night.
Update /mama/location only when the scene location changes.
Update /mama/outfit only when ENA's persistent form or clothing base changes.
Update /mama/mascotEmotion when the familiar's emotion/diff state changes.
Do not put ENA portrait tags into MAMA state. <ena-exp>...</ena-exp> only controls ENA's instant portrait expression; its outfit base follows /mama/outfit. Do not use it for other characters.
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
