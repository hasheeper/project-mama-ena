import { DEFAULT_MAMA_STATE } from '../../mama/state';
import { resolveExpression } from '../../mama/standing-assets';
import { createStandingFigure } from '../../mama/standing-renderer';
import { isMamaMessage } from '../../protocol/messages';

interface MamaExpDataMessage {
  type: 'MAMA_EXP_DATA';
  expression?: unknown;
}

let currentExpression = resolveExpression(getInitialExpression()).name;
let connectedHostName = '';

const root = document.querySelector<HTMLElement>('[data-app-id="expression-portrait"]');

render();
window.addEventListener('message', handleMessage);

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'mama:app-ready', appId: 'expression-portrait' }, '*');
  window.parent.postMessage({ type: 'MAMA_EXP_READY', appId: 'expression-portrait' }, '*');
}

function handleMessage(event: MessageEvent): void {
  if (isMamaMessage(event.data)) {
    if (event.data.type !== 'mama:container-ready') return;
    connectedHostName = event.data.app.name;
    root?.setAttribute('data-host-app', event.data.app.id);
    render();
    return;
  }

  if (!isMamaExpDataMessage(event.data)) return;
  currentExpression = resolveExpression(event.data.expression).name;
  render();
}

function render(): void {
  if (!root) return;
  const expression = resolveExpression(currentExpression);
  root.dataset.expression = expression.name;
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
    outfit: DEFAULT_MAMA_STATE.outfit,
    expression: expressionName,
    className: 'mama-standing--portrait',
    label: `Ena ${expressionName}`
  }));

  frame.append(crop);
  return frame;
}

function getInitialExpression(): string {
  const params = new URLSearchParams(location.search);
  return params.get('exp') || params.get('expression') || DEFAULT_MAMA_STATE.expression;
}

function isMamaExpDataMessage(value: unknown): value is MamaExpDataMessage {
  return Boolean(value && typeof value === 'object' && (value as { type?: unknown }).type === 'MAMA_EXP_DATA');
}
