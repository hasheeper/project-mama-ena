import { DEFAULT_MAMA_STATE, normalizeMamaState } from '../../mama/state';
import { DEFAULT_EXPRESSION, resolveExpression, resolveOutfitName } from '../../mama/standing-assets';
import { createStandingFigure } from '../../mama/standing-renderer';
import { isMamaMessage } from '../../protocol/messages';

interface MamaExpDataMessage {
  type: 'MAMA_EXP_DATA';
  expression?: unknown;
  outfit?: unknown;
}

interface MamaStatePushMessage {
  type: 'MAMA_STATE_PUSH';
  state?: unknown;
  reason?: string;
}

let currentExpression = resolveExpression(getInitialExpression()).name;
let currentOutfit = resolveOutfitName(getInitialOutfit());
let connectedHostName = '';

const root = document.querySelector<HTMLElement>('[data-app-id="expression-portrait"]');

render();
window.addEventListener('message', handleMessage);

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'mama:app-ready', appId: 'expression-portrait' }, '*');
  window.parent.postMessage({ type: 'MAMA_EXP_READY', appId: 'expression-portrait' }, '*');
  window.parent.postMessage({ type: 'MAMA_STATUS_REQUEST', appId: 'expression-portrait', reason: 'expressionPortrait' }, '*');
}

function handleMessage(event: MessageEvent): void {
  if (isMamaMessage(event.data)) {
    if (event.data.type !== 'mama:container-ready') return;
    connectedHostName = event.data.app.name;
    root?.setAttribute('data-host-app', event.data.app.id);
    render();
    return;
  }

  if (isMamaStatePushMessage(event.data)) {
    currentOutfit = resolveOutfitName(normalizeMamaState(event.data.state).outfit);
    render();
    return;
  }

  if (!isMamaExpDataMessage(event.data)) return;
  currentExpression = resolveExpression(event.data.expression).name;
  if (event.data.outfit !== undefined) currentOutfit = resolveOutfitName(event.data.outfit);
  render();
}

function render(): void {
  if (!root) return;
  const expression = resolveExpression(currentExpression);
  root.dataset.expression = expression.name;
  root.dataset.outfit = currentOutfit;
  root.replaceChildren(renderPortrait(expression.name));
}

function renderPortrait(expressionName: string): HTMLElement {
  const frame = document.createElement('section');
  frame.className = 'portrait-frame';
  frame.title = connectedHostName
    ? `Connected through ${connectedHostName}: ${expressionName}`
    : expressionName;

  const crop = document.createElement('div');
  crop.className = 'portrait-crop';
  crop.append(createStandingFigure({
    outfit: currentOutfit,
    expression: expressionName,
    className: 'mama-standing--portrait',
    label: `Ena ${currentOutfit} ${expressionName}`
  }));

  frame.append(crop);
  return frame;
}

function getInitialExpression(): string {
  const params = new URLSearchParams(location.search);
  return params.get('exp') || params.get('expression') || DEFAULT_EXPRESSION;
}

function getInitialOutfit(): string {
  const params = new URLSearchParams(location.search);
  return params.get('outfit') || DEFAULT_MAMA_STATE.outfit;
}

function isMamaExpDataMessage(value: unknown): value is MamaExpDataMessage {
  return Boolean(value && typeof value === 'object' && (value as { type?: unknown }).type === 'MAMA_EXP_DATA');
}

function isMamaStatePushMessage(value: unknown): value is MamaStatePushMessage {
  return Boolean(value && typeof value === 'object' && (value as { type?: unknown }).type === 'MAMA_STATE_PUSH');
}
