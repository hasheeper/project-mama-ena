import { MAMA_TIME_PHASE_LABELS, MAMA_TIME_PHASES, type MamaState } from '../../mama/state';
import type { VisualDashboardViewModel } from './types';
import { createStatusStandingFigure } from './status-standing';
import enaBgmUrl from '../../assets/mp3/bgm/ena_bgm.mp3?url';

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
    renderDialogueStack(model.state)
  );
}

function renderHeader(titleText: string, connectedHostName = ''): HTMLElement {
  const header = createElement('header', { className: 'dash-header' });
  const statusGroup = createElement('div', { className: 'header-status-group' });
  const title = createElement('div', { className: 'header-title', text: titleText });
  const statusDot = createElement('div', {
    className: 'status-dot',
    attributes: { 'aria-hidden': 'true' }
  });

  if (connectedHostName) {
    statusDot.setAttribute('title', `Connected through ${connectedHostName}`);
  }

  statusGroup.append(title, statusDot);
  header.append(statusGroup, renderBgmPlayer());
  return header;
}

function renderBgmPlayer(): HTMLElement {
  const mask = createElement('div', { className: 'bgm-mask-container' });
  const button = createElement('button', {
    className: 'bgm-pull-tab',
    attributes: {
      type: 'button',
      title: 'BGM: Ena Theme',
      'aria-label': 'Toggle ENA BGM',
      'aria-pressed': 'false'
    }
  });
  const audio = document.createElement('audio');
  const setPlaying = (isPlaying: boolean): void => {
    button.classList.toggle('is-playing', isPlaying);
    button.setAttribute('aria-pressed', String(isPlaying));
  };

  audio.src = enaBgmUrl;
  audio.loop = true;
  audio.preload = 'metadata';
  button.append(
    createElement('span', { className: 'vinyl-record', attributes: { 'aria-hidden': 'true' } }),
    renderPlayerInfo(),
    renderEqualizer(),
    audio
  );
  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => setPlaying(false));
  audio.addEventListener('error', () => setPlaying(false));
  button.addEventListener('click', () => {
    if (audio.paused) {
      void audio.play().catch(() => setPlaying(false));
      return;
    }
    audio.pause();
  });

  mask.append(button);
  return mask;
}

function renderPlayerInfo(): HTMLElement {
  const info = createElement('span', { className: 'player-info' });
  info.append(createElement('span', { className: 'track-name', text: 'ENA THEME' }));
  return info;
}

function renderEqualizer(): HTMLElement {
  const equalizer = createElement('span', {
    className: 'eq-visualizer',
    attributes: { 'aria-hidden': 'true' }
  });
  equalizer.append(
    createElement('span', { className: 'eq-bar' }),
    createElement('span', { className: 'eq-bar' }),
    createElement('span', { className: 'eq-bar' })
  );
  return equalizer;
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

  stage.append(figure);
  frame.append(
    stage,
    renderStatusWidgets(state),
    renderNameTag(state),
    renderPinnedNameTag(),
    renderOutfitManifest(state),
    renderStampBadge()
  );
  wrapper.append(backdrop, frame);

  return wrapper;
}

function renderStatusWidgets(state: MamaState): HTMLElement {
  const widgets = createElement('div', {
    className: 'status-widgets',
    attributes: { 'aria-label': 'MAMA status meters' }
  });
  const affectionPercent = Math.round((state.affection / 255) * 100);
  const capsule = createElement('div', {
    className: 'w-status-capsule w-affection',
    attributes: { style: `--c: #e57091; --p: ${affectionPercent}%;` }
  });
  const info = createElement('div', { className: 'widget-info' });

  info.append(
    createElement('div', { className: 'w-label', text: 'Affection / 好感度' }),
    createWidgetValue(String(state.affection), '/255')
  );
  capsule.append(info, renderRingChart('r-affection', affectionPercent, '#e57091', 34));
  widgets.append(
    capsule,
    renderCircleBadge('r-form', 100, '#2cb8ce', 'Outfit base is synced'),
    renderCircleBadge('r-link', 100, '#5c6593', 'MAMA status bridge is active')
  );

  return widgets;
}

function createWidgetValue(value: string, suffix: string): HTMLElement {
  const wrapper = createElement('div', { className: 'w-val' });
  wrapper.append(value, createElement('span', { className: 'pct', text: suffix }));
  return wrapper;
}

function renderCircleBadge(ringClass: string, percent: number, color: string, title: string): HTMLElement {
  const badge = createElement('div', {
    className: 'w-circle-badge',
    attributes: {
      title,
      style: `--c: ${color}; --p: ${Math.max(0, Math.min(100, percent))}%;`
    }
  });
  badge.append(renderRingChart(ringClass, percent, color, 28));
  return badge;
}

function renderRingChart(className: string, percent: number, color: string, size: number): HTMLElement {
  return createElement('div', {
    className: `ring-chart ${className}`,
    attributes: {
      style: `--c: ${color}; --p: ${Math.max(0, Math.min(100, percent))}%; --size: ${size}px;`
    }
  });
}

function renderNameTag(state: MamaState): HTMLElement {
  const tag = createElement('div', { className: 'ena-name-tag' });
  const paper = createElement('div', { className: 'paper' });
  const header = createElement('div', { className: 'date-header' });
  const timeline = createElement('div', { className: 'timeline' });

  header.append(
    createElement('div', { className: 'week-txt', text: `WEEK ${formatCounter(state.week)}` }),
    createElement('div', { className: 'day-txt', text: `DAY ${formatCounter(state.day)}` })
  );
  MAMA_TIME_PHASES.forEach((phase) => {
    timeline.append(createElement('div', {
      className: `tl-node${state.timePhase === phase ? ' active' : ''}`,
      text: MAMA_TIME_PHASE_LABELS[phase]
    }));
  });
  paper.append(header, timeline);
  tag.append(paper);
  return tag;
}

function renderPinnedNameTag(): HTMLElement {
  const tag = createElement('div', { className: 'pinned-name-tag' });
  const paper = createElement('div', { className: 'pinned-name-paper' });

  paper.append(
    createElement('div', { className: 'pinned-name-cn', text: '天宫 绘奈' }),
    createElement('div', { className: 'pinned-name-en', text: 'AMAHA ENA' })
  );
  tag.append(renderPaperclip(), paper);
  return tag;
}

function renderPaperclip(): HTMLElement {
  const wrapper = createElement('div', { className: 'paperclip-wrapper' });

  wrapper.innerHTML = `
    <svg width="32" height="72" viewBox="0 0 28 68" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g filter="url(#mama-paperclip-shadow)">
        <path d="M14,35 L14,15 A 3,3 0 0,0 8,15 L8,54 A 6,6 0 0,0 20,54 L20,11 A 9,9 0 0,0 2,11 L2,42"
          stroke="#a09ca6" stroke-width="3" stroke-linecap="round"/>
      </g>
      <defs>
        <filter id="mama-paperclip-shadow" x="-5" y="-5" width="40" height="80" filterUnits="userSpaceOnUse">
          <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.15"/>
        </filter>
      </defs>
    </svg>
  `;
  return wrapper;
}

function renderOutfitManifest(state: MamaState): HTMLElement {
  const manifest = createElement('div', { className: 'outfit-manifest' });
  const header = createElement('div', { className: 'om-header' });

  header.append(
    createElement('div', { className: 'om-dot' }),
    createElement('span', { text: 'FORM_MANIFEST' })
  );
  manifest.append(
    header,
    createElement('div', { className: 'om-title', text: formatOutfitTitle(state.outfit) }),
    createElement('div', { className: 'om-meta', text: `TYPE::${formatOutfitCode(state.outfit)}` }),
    createElement('div', { className: 'om-barcode' })
  );

  return manifest;
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

function renderDialogueStack(state: MamaState): HTMLElement {
  const stack = createElement('section', { className: 'dialogue-stack' });
  stack.append(renderDialogueLine('使魔 涅露露', state.mascotComment));
  return stack;
}

function renderDialogueLine(speaker: string, text: string): HTMLElement {
  const wrapper = createElement('div', { className: 'dialogue-wrapper' });
  const bubble = createElement('div', { className: 'msg-bubble' });

  bubble.append(
    createElement('div', { className: 'name-label label-mascot', text: speaker }),
    createElement('div', { className: 'flat-pin pin-mascot' }),
    createElement('div', { className: 'vertical-line' }),
    createElement('div', { className: 'msg-text', text })
  );
  wrapper.append(bubble);
  return wrapper;
}

function formatOutfitTitle(outfit: string): string {
  const titles: Record<string, string> = {
    school_uniform: 'School Uniform',
    streetwear_inner: 'Streetwear Inner',
    streetwear_full: 'Streetwear Full',
    outfit_winter: 'Winter Outfit',
    nightwear: 'Nightwear',
    underwear: 'Underwear',
    nude: 'Nude',
    seraphim: 'Seraphim',
    nephilim: 'Nephilim'
  };
  return titles[outfit] || outfit.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatOutfitCode(outfit: string): string {
  const codes: Record<string, string> = {
    school_uniform: 'CIVILIAN_01',
    streetwear_inner: 'CASUAL_INNER',
    streetwear_full: 'CASUAL_FULL',
    outfit_winter: 'WINTER_01',
    nightwear: 'SLEEP_01',
    underwear: 'PRIVATE_01',
    nude: 'PRIVATE_00',
    seraphim: 'SERAPHIM',
    nephilim: 'NEPHILIM'
  };
  return codes[outfit] || outfit.toUpperCase();
}

function formatCounter(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
  return String(safeValue).padStart(2, '0');
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
