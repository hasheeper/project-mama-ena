import { createStandingFigure } from '../../mama/standing-renderer';
import { resolveExpression } from '../../mama/standing-assets';
import type { MamaState } from '../../mama/state';
import type { VisualDashboardViewModel } from './types';

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
  const expression = resolveExpression(state.expression);
  const wrapper = createElement('section', {
    className: 'status-showcase',
    attributes: { 'aria-label': 'MAMA visual status' }
  });
  const backdrop = createElement('div', { className: 'purple-backdrop' });
  const frame = createElement('div', { className: 'white-frame' });
  const stage = createElement('div', { className: 'standing-stage' });
  const figure = createStandingFigure({
    outfit: state.outfit,
    expression: state.expression,
    className: 'mama-standing--dashboard',
    label: `Ena ${state.outfit} ${expression.name}`
  });
  const label = createElement('div', { className: 'top-torn-label' });
  const highlight = createElement('span', { className: 'label-highlight', text: expression.name });
  const note = createElement('div', { className: 'bottom-tag-note' });

  label.append('{ EXP ', highlight, ' }');
  note.append(
    createElement('div', { className: 'display-tape tape-bottom' }),
    createElement('div', { className: 'note-title', text: `OUTFIT: ${state.outfit}` }),
    createElement('div', { className: 'note-sub', text: `AFFECTION ${state.affection}/255` })
  );
  stage.append(figure);
  frame.append(stage, label, note);
  wrapper.append(backdrop, frame);

  return wrapper;
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
    renderStatePill('服装', state.outfit),
    renderStatePill('差分', resolveExpression(state.expression).name)
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
