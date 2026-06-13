import { DEFAULT_MAMA_STATE, normalizeMamaState } from '../../mama/state';
import { isMamaMessage } from '../../protocol/messages';
import { renderVisualDashboard } from './components';
import { visualDashboardDefaults } from './data';
import type { MamaBgmState, MamaBgmStateMessage, MamaStatePushMessage } from './types';

let currentState = normalizeMamaState(getInitialState());
let connectedHostName = '';
let currentBgmState: MamaBgmState = { available: false, playing: false, provider: 'none' };
let lastRenderSignature = '';
let renderScheduled = false;

const root = document.querySelector<HTMLElement>('[data-app-id="visual-dashboard"]');

render();
window.addEventListener('message', handleMessage);

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'mama:app-ready', appId: visualDashboardDefaults.appId }, '*');
  window.parent.postMessage({ type: 'MAMA_STATUS_READY', appId: visualDashboardDefaults.appId }, '*');
  window.parent.postMessage({ type: 'MAMA_BGM_REQUEST', appId: visualDashboardDefaults.appId }, '*');
}

function handleMessage(event: MessageEvent): void {
  if (isMamaMessage(event.data)) {
    if (event.data.type !== 'mama:container-ready') return;
    const nextHostName = event.data.app.name;
    if (connectedHostName === nextHostName && root?.getAttribute('data-host-app') === event.data.app.id) return;
    connectedHostName = event.data.app.name;
    root?.setAttribute('data-host-app', event.data.app.id);
    scheduleRender();
    return;
  }

  if (isMamaStatePushMessage(event.data)) {
    const nextState = normalizeMamaState(event.data.state);
    if (stableStringify(currentState) === stableStringify(nextState)) return;
    currentState = nextState;
    scheduleRender();
    return;
  }

  if (isMamaBgmStateMessage(event.data)) {
    const nextBgmState = normalizeBgmState(event.data.state);
    if (stableStringify(currentBgmState) === stableStringify(nextBgmState)) return;
    currentBgmState = nextBgmState;
    scheduleRender();
  }
}

function scheduleRender(): void {
  if (renderScheduled) return;
  renderScheduled = true;
  window.requestAnimationFrame(() => {
    renderScheduled = false;
    render();
  });
}

function render(): void {
  if (!root) return;
  const signature = stableStringify({
    state: currentState,
    connectedHostName,
    bgm: currentBgmState
  });
  if (signature === lastRenderSignature) return;
  lastRenderSignature = signature;
  renderVisualDashboard(root, {
    ...visualDashboardDefaults,
    state: currentState,
    connectedHostName,
    bgm: currentBgmState,
    onToggleBgm: toggleBgm
  });
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

function toggleBgm(): void {
  if (!window.parent || window.parent === window) return;
  window.parent.postMessage({ type: 'MAMA_BGM_TOGGLE', appId: visualDashboardDefaults.appId }, '*');
}

function getInitialState(): unknown {
  const params = new URLSearchParams(location.search);
  return {
    ...DEFAULT_MAMA_STATE,
    affection: params.get('affection') ?? DEFAULT_MAMA_STATE.affection,
    fatigueLevel: params.get('fatigueLevel') ?? DEFAULT_MAMA_STATE.fatigueLevel,
    manaLevel: params.get('manaLevel') ?? DEFAULT_MAMA_STATE.manaLevel,
    livingExpense: params.get('livingExpense') ?? DEFAULT_MAMA_STATE.livingExpense,
    corruptionLevel: params.get('corruptionLevel') ?? DEFAULT_MAMA_STATE.corruptionLevel,
    week: params.get('week') ?? DEFAULT_MAMA_STATE.week,
    day: params.get('day') ?? DEFAULT_MAMA_STATE.day,
    timePhase: params.get('timePhase') || DEFAULT_MAMA_STATE.timePhase,
    userLocation: params.get('userLocation') || DEFAULT_MAMA_STATE.userLocation,
    enaLocation: params.get('enaLocation') || DEFAULT_MAMA_STATE.enaLocation,
    monsterAlertStatus: params.get('monsterAlertStatus') || DEFAULT_MAMA_STATE.monsterAlertStatus,
    monsterAlertLocation: params.get('monsterAlertLocation') || DEFAULT_MAMA_STATE.monsterAlertLocation,
    monsterAlertRollKey: params.get('monsterAlertRollKey') || DEFAULT_MAMA_STATE.monsterAlertRollKey,
    outfit: params.get('outfit') || DEFAULT_MAMA_STATE.outfit,
    mascotEmotion: params.get('mascotEmotion') || DEFAULT_MAMA_STATE.mascotEmotion
  };
}

function isMamaStatePushMessage(value: unknown): value is MamaStatePushMessage {
  return Boolean(value && typeof value === 'object' && (value as { type?: unknown }).type === 'MAMA_STATE_PUSH');
}

function isMamaBgmStateMessage(value: unknown): value is MamaBgmStateMessage {
  return Boolean(value && typeof value === 'object' && (value as { type?: unknown }).type === 'MAMA_BGM_STATE');
}

function normalizeBgmState(value: unknown): MamaBgmState {
  if (!value || typeof value !== 'object') return { available: false, playing: false, provider: 'none' };
  const source = value as MamaBgmState;
  return {
    available: source.available !== false,
    playing: source.playing === true,
    provider: typeof source.provider === 'string' ? source.provider : 'host',
    title: typeof source.title === 'string' ? source.title : undefined,
    url: typeof source.url === 'string' ? source.url : undefined,
    error: typeof source.error === 'string' ? source.error : undefined
  };
}
