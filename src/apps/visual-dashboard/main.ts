import { DEFAULT_MAMA_STATE, normalizeMamaState } from '../../mama/state';
import { isMamaMessage } from '../../protocol/messages';
import { renderVisualDashboard } from './components';
import { visualDashboardDefaults } from './data';
import type { MamaStatePushMessage } from './types';

let currentState = normalizeMamaState(getInitialState());
let connectedHostName = '';

const root = document.querySelector<HTMLElement>('[data-app-id="visual-dashboard"]');

render();
window.addEventListener('message', handleMessage);

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'mama:app-ready', appId: visualDashboardDefaults.appId }, '*');
  window.parent.postMessage({ type: 'MAMA_STATUS_READY', appId: visualDashboardDefaults.appId }, '*');
}

function handleMessage(event: MessageEvent): void {
  if (isMamaMessage(event.data)) {
    if (event.data.type !== 'mama:container-ready') return;
    connectedHostName = event.data.app.name;
    root?.setAttribute('data-host-app', event.data.app.id);
    render();
    return;
  }

  if (!isMamaStatePushMessage(event.data)) return;
  currentState = normalizeMamaState(event.data.state);
  render();
}

function render(): void {
  if (!root) return;
  renderVisualDashboard(root, {
    ...visualDashboardDefaults,
    state: currentState,
    connectedHostName
  });
}

function getInitialState(): unknown {
  const params = new URLSearchParams(location.search);
  return {
    ...DEFAULT_MAMA_STATE,
    affection: params.get('affection') ?? DEFAULT_MAMA_STATE.affection,
    week: params.get('week') ?? DEFAULT_MAMA_STATE.week,
    day: params.get('day') ?? DEFAULT_MAMA_STATE.day,
    timePhase: params.get('timePhase') || DEFAULT_MAMA_STATE.timePhase,
    location: params.get('location') || DEFAULT_MAMA_STATE.location,
    outfit: params.get('outfit') || DEFAULT_MAMA_STATE.outfit,
    mascotEmotion: params.get('mascotEmotion') || DEFAULT_MAMA_STATE.mascotEmotion
  };
}

function isMamaStatePushMessage(value: unknown): value is MamaStatePushMessage {
  return Boolean(value && typeof value === 'object' && (value as { type?: unknown }).type === 'MAMA_STATE_PUSH');
}
