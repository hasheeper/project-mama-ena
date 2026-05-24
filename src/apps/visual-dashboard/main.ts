import { isMamaMessage } from '../../protocol/messages';

const appId = 'visual-dashboard';
const root = document.querySelector<HTMLElement>('[data-app-id="visual-dashboard"]');
const statusDot = document.querySelector<HTMLElement>('.status-dot');

window.addEventListener('message', handleMessage);

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'mama:app-ready', appId }, '*');
}

function handleMessage(event: MessageEvent): void {
  if (!isMamaMessage(event.data)) return;
  if (event.data.type !== 'mama:container-ready') return;

  root?.setAttribute('data-host-app', event.data.app.id);
  statusDot?.setAttribute('title', `Connected through ${event.data.app.name}`);
}
