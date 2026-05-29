import type { MamaState } from '../../mama/state';
import type { VisualDashboardViewModel } from './types';
import { createStatusStandingFigure } from './status-standing';

interface ElementOptions {
  className?: string;
  text?: string;
  attributes?: Record<string, string>;
}

export function renderVisualDashboard(root: HTMLElement, model: VisualDashboardViewModel): void {
  root.classList.add('visual-dashboard');
  root.dataset.appId = model.appId;
  root.replaceChildren(
    renderHeader(model.title, model.connectedHostName),
    renderStatusShowcase(model.state),
    renderStateStrip(model.state),
    renderDialogueStack(model.state)
  );
}

function renderHeader(titleText: string, connectedHostName = ''): HTMLElement {
  const header = createElement('div', { className: 'dash-header' });
  const title = createElement('div', { className: 'header-title', text: titleText });
  const statusDot = createElement('div', {
    className: 'status-dot',
    attributes: { 'aria-hidden': 'true' }
  });

  if (connectedHostName) {
    statusDot.setAttribute('title', `Connected through ${connectedHostName}`);
  }

  header.append(title, statusDot);
  return header;
}

function renderStatusShowcase(state: MamaState): HTMLElement {
  const wrapper = createElement('section', {
    className: 'status-showcase',
    attributes: { 'aria-label': 'MAMA visual status' }
  });
  const backdrop = createElement('div', { className: 'purple-backdrop' });
  const frame = createElement('div', { className: 'white-frame' });
  const stage = createElement('div', { className: 'standing-stage' });
  const figure = createStatusStandingFigure({
    outfit: state.outfit,
    className: 'mama-standing--dashboard',
    label: `Ena ${state.outfit} status`
  });
  const label = createElement('div', { className: 'top-torn-label' });
  const note = createElement('div', { className: 'bottom-tag-note' });

  label.append('ENA');
  note.append(
    createElement('div', { className: 'display-tape tape-bottom' }),
    createElement('div', { className: 'note-title', text: `OUTFIT: ${state.outfit}` }),
    createElement('div', { className: 'note-sub', text: `AFFECTION ${state.affection}/255` })
  );
  stage.append(figure, renderStatusDots());
  frame.append(stage, label, note, renderStampBadge());
  wrapper.append(backdrop, frame);

  return wrapper;
}

function renderStatusDots(): HTMLElement {
  const dots = createElement('div', {
    className: 'status-dots',
    attributes: { 'aria-hidden': 'true' }
  });

  dots.append(
    createElement('div', { className: 'dot dot-red' }),
    createElement('div', { className: 'dot dot-blue' }),
    createElement('div', { className: 'dot dot-yellow' })
  );

  return dots;
}

function renderStampBadge(): HTMLElement {
  const badge = createElement('div', {
    className: 'stamp-badge',
    attributes: { 'aria-hidden': 'true' }
  });

  badge.innerHTML = `
    <svg viewBox="-20 -20 140 140" fill="currentColor">
      <circle cx="50" cy="50" r="66" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="58" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 5"/>
      <path id="mama-status-stamp-path" d="M 50, 3 A 47 47 0 0 1 50, 97 A 47 47 0 0 1 50, 3" fill="none"/>
      <text font-size="7.8" font-weight="900" letter-spacing="1.4" fill="currentColor">
        <textPath href="#mama-status-stamp-path" startOffset="10%">★ M.A.M.A. PROTOCOL SYSTEM ★</textPath>
      </text>
      <g transform="translate(6, 4) scale(0.88)">
        <path d="m50 6.25c-24.125 0-43.75 19.625-43.75 43.75s19.625 43.75 43.75 43.75 43.75-19.625 43.75-43.75-19.625-43.75-43.75-43.75zm0 84.375c-22.398 0-40.625-18.227-40.625-40.625s18.227-40.625 40.625-40.625 40.625 18.227 40.625 40.625-18.227 40.625-40.625 40.625z"/>
        <path d="m51.105 34.992c-0.60938 0.60937-1.5977 0.60937-2.2109 0-2.6875-2.6875-6.2148-4.0273-9.7422-4.0273-3.5234 0-7.0508 1.3438-9.7383 4.0273-5.3672 5.3672-5.3672 14.109 0 19.48l20.586 20.582 20.586-20.586c5.3672-5.3711 5.3672-14.109 0-19.48-5.375-5.3711-14.113-5.3633-19.48 0.003907z"/>
        <path d="m50 12.5c-20.68 0-37.5 16.82-37.5 37.5s16.82 37.5 37.5 37.5 37.5-16.82 37.5-37.5-16.82-37.5-37.5-37.5zm22.793 44.18-21.688 21.688c-0.30469 0.30859-0.70703 0.46094-1.1055 0.46094s-0.80078-0.15234-1.1055-0.45703l-21.688-21.688c-6.5898-6.5938-6.5898-17.312 0-23.898 6.2305-6.2383 16.164-6.5664 22.793-1.0156 6.6289-5.5508 16.566-5.2227 22.793 1.0117 6.5859 6.5898 6.5859 17.309 0 23.898z"/>
      </g>
    </svg>
  `;

  return badge;
}

function renderStateStrip(state: MamaState): HTMLElement {
  const strip = createElement('section', { className: 'state-strip' });
  const affection = createElement('div', { className: 'affection-meter' });
  const affectionFill = createElement('div', {
    className: 'affection-meter-fill',
    attributes: { style: `width: ${(state.affection / 255) * 100}%` }
  });

  affection.append(
    createElement('div', { className: 'state-label', text: '好感度' }),
    createElement('div', { className: 'affection-meter-track' })
  );
  affection.querySelector('.affection-meter-track')?.append(affectionFill);
  strip.append(
    affection,
    renderStatePill('服装', state.outfit)
  );

  return strip;
}

function renderStatePill(label: string, value: string): HTMLElement {
  const pill = createElement('div', { className: 'state-pill' });
  pill.append(
    createElement('span', { className: 'state-label', text: label }),
    createElement('strong', { text: value })
  );
  return pill;
}

function renderDialogueStack(state: MamaState): HTMLElement {
  const stack = createElement('section', { className: 'dialogue-stack' });
  stack.append(
    renderDialogueLine('使魔 涅露露', state.mascotComment, 'mascot'),
    renderDialogueLine('绘奈', state.enaDialogue, 'ena')
  );
  return stack;
}

function renderDialogueLine(speaker: string, text: string, tone: 'mascot' | 'ena'): HTMLElement {
  const wrapper = createElement('div', { className: 'dialogue-wrapper' });
  const bubble = createElement('div', { className: 'msg-bubble' });

  bubble.append(
    createElement('div', { className: `name-label label-${tone}`, text: speaker }),
    createElement('div', { className: `flat-pin pin-${tone}` }),
    createElement('div', { className: 'vertical-line' }),
    createElement('div', { className: 'msg-text', text })
  );
  wrapper.append(bubble);
  return wrapper;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: ElementOptions = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });
  }

  return element;
}
