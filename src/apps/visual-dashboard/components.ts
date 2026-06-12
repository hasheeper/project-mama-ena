import {
  DEFAULT_MAMA_MASCOT_EXPRESSION,
  MAMA_LOCATION_KEYS,
  MAMA_LOCATIONS,
  MAMA_MASCOT_EXPRESSION_KEYS,
  MAMA_TIME_PHASE_LABELS,
  MAMA_TIME_PHASES,
  clampNumber,
  clampMamaLevel,
  getAffectionLevel,
  getMamaWeekday,
  normalizeMascotExpression,
  resolveMamaLocation,
  type MamaLocationResolution,
  type MamaLocationKey,
  type MamaMascotExpression,
  type MamaTimePhase,
  type MamaState
} from '../../mama/state';
import type { MamaBgmState, VisualDashboardViewModel } from './types';
import { createStatusStandingFigure } from './status-standing';
import enaAvatarUrl from '../../assets/png/q/ena/ena_q.png?url';

interface ElementOptions {
  className?: string;
  text?: string;
  attributes?: Record<string, string>;
}

const mascotModules = import.meta.glob<string>('../../assets/png/q/mascot/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});
const mascotAssets = buildMascotAssetMap(mascotModules);
const backgroundModules = import.meta.glob<string>('../../assets/png/backgrounds/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default'
});
const backgroundAssets = buildBackgroundAssetMap(backgroundModules);

interface LivingExpenseBill {
  value: number;
  palette: LivingExpenseBillPalette;
}

interface LivingExpenseBillPalette {
  color: string;
  bg: string;
  pattern: string;
  line: string;
  muted: string;
  watermark: string;
  shadow: string;
  hoverShadow: string;
}

const LIVING_EXPENSE_BILL_DENOMINATIONS = [
  500000,
  200000,
  100000,
  50000,
  20000,
  10000,
  5000,
  2000,
  1000,
  500,
  200,
  100,
  50,
  20,
  10
] as const;

const LIVING_EXPENSE_BILL_PALETTES = {
  small: {
    color: '#8fb9a0',
    bg: '#fffef9',
    pattern: 'rgba(143, 185, 160, 0.1)',
    line: 'rgba(143, 185, 160, 0.42)',
    muted: '#a9c9b4',
    watermark: 'rgba(143, 185, 160, 0.13)',
    shadow: 'rgba(143, 185, 160, 0.2)',
    hoverShadow: 'rgba(143, 185, 160, 0.3)'
  },
  medium: {
    color: '#7fb2bc',
    bg: '#fbfffe',
    pattern: 'rgba(127, 178, 188, 0.1)',
    line: 'rgba(127, 178, 188, 0.4)',
    muted: '#9fc4ca',
    watermark: 'rgba(127, 178, 188, 0.13)',
    shadow: 'rgba(127, 178, 188, 0.2)',
    hoverShadow: 'rgba(127, 178, 188, 0.3)'
  },
  large: {
    color: '#b99ac8',
    bg: '#fffafd',
    pattern: 'rgba(185, 154, 200, 0.1)',
    line: 'rgba(185, 154, 200, 0.4)',
    muted: '#c8afd3',
    watermark: 'rgba(185, 154, 200, 0.14)',
    shadow: 'rgba(185, 154, 200, 0.2)',
    hoverShadow: 'rgba(185, 154, 200, 0.3)'
  },
  premium: {
    color: '#d5ae72',
    bg: '#fffdf8',
    pattern: 'rgba(213, 174, 114, 0.1)',
    line: 'rgba(213, 174, 114, 0.42)',
    muted: '#d7bd92',
    watermark: 'rgba(213, 174, 114, 0.14)',
    shadow: 'rgba(213, 174, 114, 0.2)',
    hoverShadow: 'rgba(213, 174, 114, 0.3)'
  }
} satisfies Record<string, LivingExpenseBillPalette>;

export function renderVisualDashboard(root: HTMLElement, model: VisualDashboardViewModel): void {
  root.classList.add('visual-dashboard');
  root.dataset.appId = model.appId;
  root.replaceChildren(
    renderHeader(model.title, model.state, model.connectedHostName, model.bgm, model.onToggleBgm),
    renderTownRoutePanel(model.state),
    renderStatusShowcase(model.state),
    renderScrapbookDesk(model.state),
    renderDialogueStack(model.state)
  );
}

function renderHeader(
  titleText: string,
  state: MamaState,
  connectedHostName = '',
  bgm: MamaBgmState = { available: false, playing: false },
  onToggleBgm?: () => void
): HTMLElement {
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
  header.append(statusGroup, renderLocationBadge(state), renderBgmPlayer(bgm, onToggleBgm));
  return header;
}

function renderLocationBadge(state: MamaState): HTMLElement {
  const resolved = resolveMamaLocation(state.userLocation);
  const labelText = formatLocationLabel(resolved);
  const hasAlert = hasLocationBadgeAlert(state);
  const badge = createElement('button', {
    className: `header-location-badge${hasAlert ? ' has-alert' : ''}`,
    attributes: {
      type: 'button',
      title: hasAlert ? `User location: ${labelText} · 有地点提醒` : `User location: ${labelText}`,
      'aria-label': 'Open town guide route',
      'aria-expanded': 'false'
    }
  });
  const label = createElement('span', { className: 'header-location-text', text: labelText });

  badge.innerHTML = `
    <svg class="header-location-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 21s6.5-5.6 6.5-11A6.5 6.5 0 0 0 5.5 10C5.5 15.4 12 21 12 21zM12 12.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z"/>
    </svg>
  `;
  badge.append(label);
  badge.addEventListener('click', (event) => {
    event.stopPropagation();
    const dashboard = badge.closest('.visual-dashboard');
    const panel = dashboard?.querySelector<HTMLElement>('.town-route-panel');
    const isOpen = !panel?.classList.contains('is-open');
    panel?.classList.toggle('is-open', isOpen);
    panel?.setAttribute('aria-hidden', String(!isOpen));
    badge.setAttribute('aria-expanded', String(isOpen));
    if (isOpen && panel) {
      window.requestAnimationFrame(() => focusTownRoutePanelOnCurrent(panel));
    }
  });
  return badge;
}

function hasLocationBadgeAlert(state: MamaState): boolean {
  if (state.monsterAlertStatus === 'active') return true;
  return !isSameLocationResolution(resolveMamaLocation(state.userLocation), resolveMamaLocation(state.enaLocation));
}

function isSameLocationResolution(left: MamaLocationResolution, right: MamaLocationResolution): boolean {
  if (left.kind === 'known' && right.kind === 'known') return left.key === right.key;
  if (left.kind === 'unknown' && right.kind === 'unknown') return left.raw === right.raw;
  return false;
}

interface TownLocationNode {
  key: MamaLocationKey;
  label: string;
  image: string;
  x: number;
  y: number;
  rotation: number;
  pin: 'pink' | 'yellow' | 'green' | 'purple';
}

const TOWN_LOCATION_NODES: TownLocationNode[] = MAMA_LOCATION_KEYS.map((key) => ({
  key,
  ...MAMA_LOCATIONS[key]
}));

const TOWN_TIME_PHASE_ICONS: Record<MamaTimePhase, string> = {
  morning: '<path d="M240,148H203.89c.07-1.33.11-2.66.11-4a76,76,0,0,0-152,0c0,1.34,0,2.67.11,4H16a12,12,0,0,0,0,24H240a12,12,0,0,0,0-24ZM76,144a52,52,0,0,1,104,0c0,1.34-.07,2.67-.17,4H76.17C76.07,146.67,76,145.34,76,144Zm144,56a12,12,0,0,1-12,12H48a12,12,0,0,1,0-24H208A12,12,0,0,1,220,200ZM12.62,92.21a12,12,0,0,1,15.17-7.59l12,4a12,12,0,1,1-7.58,22.77l-12-4A12,12,0,0,1,12.62,92.21Zm56-48.41a12,12,0,1,1,22.76-7.59l4,12A12,12,0,1,1,72.62,55.8Zm140,60a12,12,0,0,1,7.59-15.18l12-4a12,12,0,0,1,7.58,22.77l-12,4a12,12,0,0,1-15.17-7.59Zm-48-55.59,4-12a12,12,0,1,1,22.76,7.59l-4,12a12,12,0,1,1-22.76-7.59Z"></path>',
  noon: '<path d="M116,36V32a12,12,0,0,1,24,0v4a12,12,0,0,1-24,0Zm80,92a68,68,0,1,1-68-68A68.07,68.07,0,0,1,196,128Zm-24,0a44,44,0,1,0-44,44A44.05,44.05,0,0,0,172,128ZM51.51,68.49a12,12,0,1,0,17-17l-4-4a12,12,0,0,0-17,17Zm0,119-4,4a12,12,0,0,0,17,17l4-4a12,12,0,1,0-17-17ZM196,72a12,12,0,0,0,8.49-3.51l4-4a12,12,0,0,0-17-17l-4,4A12,12,0,0,0,196,72Zm8.49,115.51a12,12,0,0,0-17,17l4,4a12,12,0,0,0,17-17ZM48,128a12,12,0,0,0-12-12H32a12,12,0,0,0,0,24h4A12,12,0,0,0,48,128Zm80,80a12,12,0,0,0-12,12v4a12,12,0,0,0,24,0v-4A12,12,0,0,0,128,208Zm96-92h-4a12,12,0,0,0,0,24h4a12,12,0,0,0,0-24Z"></path>',
  dusk: '<g transform="scale(-1, 1) translate(-256, 0)"><path d="M240,148H203.89c.07-1.33.11-2.66.11-4a76,76,0,0,0-152,0c0,1.34,0,2.67.11,4H16a12,12,0,0,0,0,24H240a12,12,0,0,0,0-24ZM76,144a52,52,0,0,1,104,0c0,1.34-.07,2.67-.17,4H76.17C76.07,146.67,76,145.34,76,144Zm144,56a12,12,0,0,1-12,12H48a12,12,0,0,1,0-24H208A12,12,0,0,1,220,200ZM12.62,92.21a12,12,0,0,1,15.17-7.59l12,4a12,12,0,1,1-7.58,22.77l-12-4A12,12,0,0,1,12.62,92.21Zm56-48.41a12,12,0,1,1,22.76-7.59l4,12A12,12,0,1,1,72.62,55.8Zm140,60a12,12,0,0,1,7.59-15.18l12-4a12,12,0,0,1,7.58,22.77l-12,4a12,12,0,0,1-15.17-7.59Zm-48-55.59,4-12a12,12,0,1,1,22.76,7.59l-4,12a12,12,0,1,1-22.76-7.59Z"></path></g>',
  night: '<path d="M236.37,139.4a12,12,0,0,0-12-3A84.07,84.07,0,0,1,119.6,31.59a12,12,0,0,0-15-15A108.86,108.86,0,0,0,49.69,55.07,108,108,0,0,0,136,228a107.09,107.09,0,0,0,64.93-21.69,108.86,108.86,0,0,0,38.44-54.94A12,12,0,0,0,236.37,139.4Zm-49.88,47.74A84,84,0,0,1,68.86,69.51,84.93,84.93,0,0,1,92.27,48.29Q92,52.13,92,56A108.12,108.12,0,0,0,200,164q3.87,0,7.71-.27A84.79,84.79,0,0,1,186.49,187.14Z"></path>'
};

const TOWN_BASE_MAP_SVG = `
  <svg class="town-base-map-svg" viewBox="0 0 1200 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="mama-town-bldg-shadow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="3" dy="5" stdDeviation="4" flood-opacity="0.06" flood-color="#29242d" />
        <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.04" flood-color="#29242d" />
      </filter>
      <filter id="mama-town-tree-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="2" dy="3" stdDeviation="2" flood-opacity="0.12" flood-color="#29242d" />
      </filter>
    </defs>
    <g id="mama-town-layer-nature" transform="translate(0, 100)">
      <path d="M -100 750 C 200 800, 400 650, 600 700 C 800 750, 1000 500, 1300 550" fill="none" stroke="#d6e4ed" stroke-width="120" stroke-linecap="round"/>
      <path d="M -100 750 C 200 800, 400 650, 600 700 C 800 750, 1000 500, 1300 550" fill="none" stroke="#e1e8db" stroke-width="150" stroke-linecap="round" opacity="0.6"/>
      <path d="M -100 750 C 200 800, 400 650, 600 700 C 800 750, 1000 500, 1300 550" fill="none" stroke="#d6e4ed" stroke-width="100" stroke-linecap="round"/>
      <path d="M 650 -50 C 600 150, 750 300, 950 250 C 1100 200, 1250 350, 1250 -50 Z" fill="#dce6d5"/>
      <path d="M 700 -50 C 680 100, 800 220, 950 180 C 1050 150, 1150 250, 1250 -50 Z" fill="#d2dec8"/>
    </g>
    <g id="mama-town-layer-bases" fill="#ece9ef">
      <g transform="translate(191, 260) rotate(97) scale(1.05)"><polygon points="-150,-100 150,-100 100,200 -150,100"/></g>
      <g transform="translate(457, 398) rotate(-104) scale(0.85)"><polygon points="-80,-150 120,-100 70,200 -130,150" /></g>
      <g transform="translate(192, 553) rotate(-5) scale(0.85)"><polygon points="-200,-160 130,-60 50,140 -200,70" /></g>
      <g transform="translate(504, 586) rotate(-4) scale(0.95)"><polygon points="-200,-120 250,-50 200,150 -250,50" /></g>
    </g>
    <g id="mama-town-layer-roads" transform="translate(0, 100)">
      <g stroke="#e2dde6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M 350 -100 C 350 200, 250 400, 300 900" stroke-width="50"/>
        <path d="M -100 300 C 200 350, 600 450, 1300 400" stroke-width="54"/>
        <path d="M 700 -100 C 650 200, 600 300, 750 900" stroke-width="46"/>
        <path d="M -50 100 L 450 200 L 850 100" stroke-width="30"/>
        <path d="M 150 -50 L 100 350" stroke-width="26"/>
        <path d="M 450 150 L 500 500" stroke-width="26"/>
        <path d="M 850 200 L 950 600" stroke-width="26"/>
        <path d="M 50 500 L 300 550" stroke-width="26"/>
      </g>
      <g stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M 350 -100 C 350 200, 250 400, 300 900" stroke-width="42"/>
        <path d="M -100 300 C 200 350, 600 450, 1300 400" stroke-width="46"/>
        <path d="M 700 -100 C 650 200, 600 300, 750 900" stroke-width="38"/>
        <path d="M -50 100 L 450 200 L 850 100" stroke-width="24"/>
        <path d="M 150 -50 L 100 350" stroke-width="20"/>
        <path d="M 450 150 L 500 500" stroke-width="20"/>
        <path d="M 850 200 L 950 600" stroke-width="20"/>
        <path d="M 50 500 L 300 550" stroke-width="20"/>
      </g>
    </g>
    <g filter="url(#mama-town-bldg-shadow)" id="mama-town-layer-buildings">
      <g transform="translate(154, 311) rotate(96) scale(1.05)"><rect x="-160" y="-110" width="80" height="60" fill="#ffffff" rx="6"/></g>
      <g transform="translate(164, 310) rotate(96) scale(1.05)"><rect x="-160" y="-30" width="80" height="60" fill="#ffffff" rx="6"/></g>
      <g transform="translate(215, 318) rotate(97) scale(0.6)"><rect x="-60" y="-110" width="100" height="140" fill="#dfd1eb" rx="8"/></g>
      <g transform="translate(240, 336) rotate(96) scale(1.05)"><rect x="-60" y="50" width="100" height="50" fill="#ffffff" rx="4"/></g>
      <g transform="translate(131, 474) rotate(97) scale(1.05)"><rect x="-160" y="50" width="40" height="50" fill="#ffffff" rx="4"/></g>
      <g transform="translate(138, 376) rotate(100) scale(1.05)"><rect x="-110" y="50" width="30" height="50" fill="#ffffff" rx="4"/></g>
      <g transform="translate(483, 188) rotate(-99) scale(0.7)"><path d="M -100 -130 L 0 -130 L 0 -30 L -40 -30 L -40 -90 L -100 -90 Z" fill="#ffffff" /></g>
      <g transform="translate(458, 374) rotate(-97) scale(0.75)"><rect x="20" y="-130" width="60" height="100" fill="#eae6ee" rx="4"/></g>
      <g transform="translate(502, 385) rotate(-97) scale(0.75)"><rect x="-100" y="-10" width="180" height="120" fill="#ffffff" rx="12"/></g>
      <g transform="translate(501, 386) rotate(-97) scale(0.75)"><rect x="-80" y="10" width="140" height="80" fill="#dfd1eb" rx="6"/></g>
      <g transform="translate(388, 572) rotate(3) scale(0.7)"><rect x="-90" y="-80" width="50" height="50" fill="#ffffff" rx="4"/></g>
      <g transform="translate(387, 574) rotate(3) scale(0.7)"><rect x="-30" y="-80" width="90" height="50" fill="#ffffff" rx="4"/></g>
      <g transform="translate(393, 585) rotate(-7) scale(0.7)"><rect x="70" y="-80" width="50" height="120" fill="#eae6ee" rx="4"/></g>
      <g transform="translate(388, 576) rotate(3) scale(0.7)"><rect x="-90" y="-20" width="150" height="60" fill="#fcfbfd" rx="4"/></g>
      <g transform="translate(387, 579) rotate(3) scale(0.7)"><rect x="-90" y="50" width="60" height="40" fill="#ffffff" rx="4"/></g>
      <g transform="translate(388, 581) rotate(3) scale(0.7)"><rect x="-20" y="50" width="140" height="40" fill="#ffffff" rx="4"/></g>
      <g transform="translate(204, 544) rotate(3) scale(0.85)"><rect x="-130" y="-80" width="40" height="30" fill="#ffffff" rx="3"/></g>
      <g transform="translate(201, 548) rotate(3) scale(0.85)"><rect x="-80" y="-80" width="40" height="30" fill="#ffffff" rx="3"/></g>
      <g transform="translate(200, 555) rotate(3) scale(0.85)"><rect x="-30" y="-80" width="40" height="30" fill="#ffffff" rx="3"/></g>
      <g transform="translate(201, 556) rotate(3) scale(0.85)"><rect x="20" y="-80" width="40" height="30" fill="#ffffff" rx="3"/></g>
      <g transform="translate(204, 544) rotate(3) scale(0.85)"><rect x="-130" y="-40" width="40" height="30" fill="#ffffff" rx="3"/></g>
      <g transform="translate(200, 547) rotate(3) scale(0.85)"><rect x="-80" y="-40" width="40" height="30" fill="#ffffff" rx="3"/></g>
      <g transform="translate(200, 555) rotate(3) scale(0.85)"><rect x="-30" y="-40" width="40" height="30" fill="#ffffff" rx="3"/></g>
      <g transform="translate(201, 556) rotate(3) scale(0.85)"><rect x="20" y="-40" width="40" height="30" fill="#ffffff" rx="3"/></g>
      <g transform="translate(210, 561) rotate(10) scale(0.85)"><rect x="-130" y="10" width="190" height="50" fill="#e4dbe8" rx="4"/></g>
      <g transform="translate(612, 605) rotate(4) scale(0.9)"><rect x="-100" y="-80" width="120" height="60" fill="#ffffff" rx="4"/></g>
      <g transform="translate(471, 284) rotate(-12) scale(1)"><rect x="30" y="-80" width="120" height="60" fill="#ffffff" rx="4"/></g>
      <g transform="translate(796, 357) rotate(-4) scale(0.95)"><path d="M -100 0 L 50 0 L 50 120 L 10 120 L 10 40 L -60 40 L -60 120 L -100 120 Z" fill="#ffffff"/></g>
      <g transform="translate(815, 364) rotate(-16) scale(1)"><rect x="70" y="0" width="80" height="120" fill="#f3efe8" rx="8"/></g>
      <g transform="translate(798, 354) rotate(-4) scale(0.95)"><circle cx="-25" cy="80" r="25" fill="#dfd1eb"/></g>
      <g transform="translate(995, 170) rotate(24) scale(1)"><rect x="-50" y="-50" width="100" height="80" fill="#ffffff" rx="12"/></g>
      <g transform="translate(995, 170) rotate(24) scale(1)"><rect x="-30" y="-30" width="60" height="40" fill="#f2eff5" rx="6"/></g>
    </g>
    <g filter="url(#mama-town-tree-shadow)" id="mama-town-layer-trees">
      <circle cx="373" cy="252" r="10" fill="#d2dec8" /> <circle cx="68" cy="482" r="18" fill="#d2dec8" />
      <circle cx="60" cy="112" r="10" fill="#d2dec8" /> <circle cx="80" cy="390" r="10" fill="#d2dec8" />
      <circle cx="325" cy="674" r="11" fill="#d2dec8" /> <circle cx="702" cy="978" r="13" fill="#d2dec8" />
      <circle cx="1086" cy="99" r="18" fill="#a5bc93" /> <circle cx="717" cy="134" r="17" fill="#b8cda8" />
      <circle cx="999" cy="468" r="11" fill="#d2dec8" /> <circle cx="709" cy="336" r="16" fill="#d2dec8" />
      <circle cx="1141" cy="116" r="24" fill="#b8cda8" /> <circle cx="1099" cy="144" r="15" fill="#c3d5b5" />
      <circle cx="707" cy="183" r="18" fill="#d2dec8" /> <circle cx="759" cy="169" r="24" fill="#b8cda8" />
      <circle cx="768" cy="553" r="13" fill="#d2dec8" /> <circle cx="264" cy="415" r="18" fill="#d2dec8" />
      <circle cx="274" cy="377" r="10" fill="#d2dec8" /> <circle cx="1020" cy="426" r="15" fill="#d2dec8" />
    </g>
  </svg>
`;

const TOWN_ROUTES_SVG = `
  <svg class="town-routes-svg" viewBox="0 0 1200 1000" xmlns="http://www.w3.org/2000/svg">
    <g class="town-route-path-bg">
      <path d="M 395 344 C 452 321, 552 178, 421 121"/>
      <path d="M 397 338 C 527 310, 702 465, 777 360"/>
      <path d="M 389 342 C 398 422, 385 461, 390 509"/>
      <path d="M 203 324 C 293 364, 325 349, 397 342"/>
      <path d="M 780 359 C 849 326, 868 316, 943 344"/>
      <path d="M 384 506 C 344 623, 363 661, 386 702"/>
      <path d="M 380 693 C 519 732, 671 678, 786 614"/>
      <path d="M 786 615 C 757 547, 986 511, 945 349"/>
      <path d="M 999 117 C 1055 196, 1069 299, 947 342"/>
      <path d="M 200 541 C 283 578, 343 540, 386 509"/>
      <path d="M 64 262 C 76 335, 151 344, 201 325"/>
      <path d="M 67 258 C 52 222, 153 137, 235 142"/>
      <path d="M 236 142 C 282 132, 369 117, 423 129"/>
      <path d="M 205 324 C 163 412, 137 473, 200 545"/>
    </g>
    <g class="town-route-path">
      <path d="M 395 344 C 452 321, 552 178, 421 121"/>
      <path d="M 397 338 C 527 310, 702 465, 777 360"/>
      <path d="M 389 342 C 398 422, 385 461, 390 509"/>
      <path d="M 203 324 C 293 364, 325 349, 397 342"/>
      <path d="M 780 359 C 849 326, 868 316, 943 344"/>
      <path d="M 384 506 C 344 623, 363 661, 386 702"/>
      <path d="M 380 693 C 519 732, 671 678, 786 614"/>
      <path d="M 786 615 C 757 547, 986 511, 945 349"/>
      <path d="M 999 117 C 1055 196, 1069 299, 947 342"/>
      <path d="M 200 541 C 283 578, 343 540, 386 509"/>
      <path d="M 64 262 C 76 335, 151 344, 201 325"/>
      <path d="M 67 258 C 52 222, 153 137, 235 142"/>
      <path d="M 236 142 C 282 132, 369 117, 423 129"/>
      <path d="M 205 324 C 163 412, 137 473, 200 545"/>
    </g>
  </svg>
`;

function renderTownRoutePanel(state: MamaState): HTMLElement {
  const panel = createElement('section', {
    className: `town-route-panel town-theme-${state.timePhase}`,
    attributes: { 'aria-hidden': 'true', 'aria-label': 'Town guide route' }
  });
  const shell = createElement('div', { className: 'town-route-shell' });
  const header = createElement('header', { className: 'town-route-header' });
  const userLocation = resolveMamaLocation(state.userLocation);
  const enaLocation = resolveMamaLocation(state.enaLocation);
  const monsterLocation: MamaLocationResolution | null = state.monsterAlertStatus === 'active'
    ? state.monsterAlertLocation
      ? resolveMamaLocation(state.monsterAlertLocation)
      : resolveMamaLocation('unregistered')
    : null;
  const userNode = getResolvedTownNode(userLocation);
  const enaNode = getResolvedTownNode(enaLocation);
  const monsterNode = monsterLocation ? getResolvedTownNode(monsterLocation) : null;
  const userLabel = formatLocationLabel(userLocation);
  const viewport = createElement('div', { className: 'town-map-viewport' });
  const canvas = createElement('div', { className: 'town-map-canvas' });
  const closeButton = createElement('button', {
    className: 'town-route-close',
    text: '×',
    attributes: { type: 'button', 'aria-label': 'Close town guide route' }
  });
  const controls = createElement('div', { className: 'town-route-controls' });
  if (userNode) {
    viewport.dataset.focusX = String(userNode.x);
    viewport.dataset.focusY = String(userNode.y);
  }

  controls.append(renderTownTimeButton(state.timePhase), closeButton);
  header.append(
    createElement('div', { className: 'town-route-tag', text: 'TOWN GUIDE ROUTE' }),
    createElement('div', {
      className: 'town-route-current',
      text: userLabel,
      attributes: { 'data-user-label': userLabel }
    }),
    controls
  );
  canvas.innerHTML = `${TOWN_BASE_MAP_SVG}<div class="town-map-fade-overlay"></div>${TOWN_ROUTES_SVG}<div class="town-tod-overlay"></div>`;
  const polaroids = createElement('div', { className: 'town-polaroids-container' });
  TOWN_LOCATION_NODES.forEach((node) => {
    polaroids.append(renderTownLocationNode(
      node,
      node.key === userNode?.key,
      node.key === enaNode?.key,
      node.key === monsterNode?.key,
      state.timePhase
    ));
  });
  canvas.append(polaroids);
  viewport.append(canvas);
  shell.append(header, viewport, renderTownUnknownLocationNotes(userLocation, enaLocation, monsterLocation));
  panel.append(shell);

  closeButton.addEventListener('click', () => closeTownRoutePanel(panel));
  panel.addEventListener('click', (event) => {
    if (event.target === panel) closeTownRoutePanel(panel);
  });
  setupTownMapDrag(viewport, canvas);
  return panel;
}

function renderTownTimeButton(timePhase: MamaTimePhase): HTMLElement {
  const label = MAMA_TIME_PHASE_LABELS[timePhase];
  const button = createElement('button', {
    className: `town-time-button town-time-${timePhase}`,
    attributes: {
      type: 'button',
      title: `${label} · ${timePhase}`,
      'aria-label': `Current time phase: ${label}`
    }
  });

  button.innerHTML = `
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      ${TOWN_TIME_PHASE_ICONS[timePhase]}
    </svg>
  `;
  button.addEventListener('click', (event) => event.stopPropagation());
  return button;
}

function renderTownLocationNode(
  node: TownLocationNode,
  isCurrent: boolean,
  hasEna: boolean,
  hasMonster: boolean,
  timePhase: MamaTimePhase
): HTMLElement {
  const wrapper = createElement('button', {
    className: `town-node${isCurrent ? ' is-current' : ''}${hasEna ? ' has-ena' : ''}${hasMonster ? ' has-monster' : ''}`,
    attributes: {
      type: 'button',
      title: hasMonster ? `${node.label} / 厄兽出没` : node.label,
      'aria-label': node.label,
      style: `left: ${node.x}px; top: ${node.y}px;`
    }
  });
  const polaroid = createElement('span', {
    className: 'town-polaroid',
    attributes: { style: `transform: rotate(${node.rotation}deg);` }
  });
  const image = createElement('span', {
    className: 'town-polaroid-img',
    attributes: {
      style: `background-image: url("${getBackgroundUrl(node.image, timePhase)}");`
    }
  });
  if (hasMonster) image.append(createElement('span', { className: 'town-ink-bleed-bg' }));

  polaroid.append(
    createElement('span', { className: `town-push-pin pin-${node.pin}` }),
    image,
    createElement('span', { className: 'town-polaroid-label', text: node.label })
  );
  if (hasMonster) {
    polaroid.append(
      renderTownMonsterWarning(),
      createElement('span', { className: 'town-ink-smudge-line' }),
      renderTownInkStainOverlay()
    );
  }
  if (isCurrent) polaroid.append(renderTownUserLocationBadge());
  if (hasEna) polaroid.append(renderTownEnaMarker(node.label));
  wrapper.append(polaroid);
  wrapper.append(renderTownMarkerRing());
  wrapper.addEventListener('click', (event) => {
    event.stopPropagation();
    const panel = wrapper.closest('.town-route-panel');
    panel?.querySelectorAll<HTMLElement>('.town-node.is-previewed').forEach((item) => {
      item.classList.remove('is-previewed');
    });
    wrapper.classList.add('is-previewed');
    const currentLabel = panel?.querySelector<HTMLElement>('.town-route-current');
    if (currentLabel) {
      currentLabel.textContent = node.label;
      currentLabel.classList.add('is-previewing');
    }
  });
  return wrapper;
}

function renderTownUserLocationBadge(): HTMLElement {
  return createElement('span', {
    className: 'town-user-location-badge',
    text: '你在这里',
    attributes: { 'aria-hidden': 'true' }
  });
}

function renderTownMonsterWarning(): HTMLElement {
  const warning = createElement('span', {
    className: 'town-monster-warning',
    attributes: { 'aria-hidden': 'true' }
  });
  warning.innerHTML = `
    <span class="town-monster-warning-day">厄兽出没</span>
    <span class="town-monster-warning-night">夜间厄兽出没</span>
  `;
  return warning;
}

function renderTownInkStainOverlay(): HTMLElement {
  const overlay = createElement('span', {
    className: 'town-ink-stain-overlay',
    attributes: { 'aria-hidden': 'true' }
  });
  overlay.innerHTML = `
    <svg viewBox="0 0 110 130" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <g fill="var(--ink-bleed)" opacity="0.4">
        <path d="M5 20C15 5 30 10 40 20C35 35 15 40 5 20Z"/>
        <path d="M105 60C90 50 75 70 85 90C95 110 110 95 105 60Z"/>
        <path d="M40 120C50 110 60 115 55 128C45 125 35 128 40 120Z"/>
      </g>
      <g fill="var(--ink-core)">
        <path d="M10 25C18 12 32 18 28 32C22 42 8 35 10 25Z"/>
        <circle cx="38" cy="18" r="2.5"/>
        <circle cx="15" cy="42" r="1.5"/>
        <circle cx="85" cy="12" r="3"/>
        <circle cx="92" cy="18" r="1.5"/>
        <circle cx="80" cy="22" r="1"/>
        <path d="M102 65C88 58 78 75 88 88C96 98 105 82 102 65Z"/>
        <path d="M85 85C80 95 72 92 75 82Z"/>
        <circle cx="70" cy="72" r="2"/>
        <circle cx="98" cy="100" r="2.5"/>
        <path d="M45 122C52 115 58 118 52 126C48 125 42 126 45 122Z"/>
        <circle cx="35" cy="118" r="1"/>
        <circle cx="65" cy="122" r="1.5"/>
      </g>
    </svg>
  `;
  return overlay;
}

function renderTownEnaMarker(label: string): HTMLElement {
  const marker = createElement('span', {
    className: 'town-ena-marker',
    attributes: {
      'aria-hidden': 'true',
      title: `Ena: ${label}`
    }
  });
  marker.innerHTML = `<img src="${enaAvatarUrl}" alt="">`;
  return marker;
}

function renderTownUnknownLocationNotes(
  userLocation: MamaLocationResolution,
  enaLocation: MamaLocationResolution,
  monsterLocation: MamaLocationResolution | null = null
): HTMLElement {
  const notes = createElement('div', { className: 'town-unknown-notes', attributes: { 'aria-live': 'polite' } });
  if (userLocation.kind === 'unknown' && enaLocation.kind === 'unknown' && userLocation.raw === enaLocation.raw) {
    notes.append(renderTownUnknownLocationNote('USER / ENA', userLocation.raw));
  } else {
    if (userLocation.kind === 'unknown') notes.append(renderTownUnknownLocationNote('USER', userLocation.raw));
    if (enaLocation.kind === 'unknown') notes.append(renderTownUnknownLocationNote('ENA', enaLocation.raw));
  }
  if (monsterLocation?.kind === 'unknown') {
    notes.append(renderTownUnknownLocationNote('厄兽', monsterLocation.raw, 'is-monster'));
  }
  return notes;
}

function renderTownUnknownLocationNote(role: string, raw: string, modifier = ''): HTMLElement {
  const note = createElement('div', { className: `town-unknown-note${modifier ? ` ${modifier}` : ''}` });
  note.append(
    createElement('span', { className: 'town-unknown-note-role', text: `${role} · ` }),
    createElement('span', { className: 'town-unknown-note-text', text: raw })
  );
  return note;
}

function renderTownMarkerRing(): HTMLElement {
  const marker = createElement('span', { className: 'town-marker-ring', attributes: { 'aria-hidden': 'true' } });
  marker.innerHTML = `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M 55,10 C 15,15 0,60 20,95 C 45,125 105,110 115,70 C 120,30 85,-5 45,15 C 20,25 15,55 30,75"/>
    </svg>
  `;
  return marker;
}

function closeTownRoutePanel(panel: Element): void {
  resetTownRoutePreview(panel);
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  const dashboard = panel.closest('.visual-dashboard');
  dashboard?.querySelector<HTMLElement>('.header-location-badge')?.setAttribute('aria-expanded', 'false');
}

function focusTownRoutePanelOnCurrent(panel: Element): void {
  const viewport = panel.querySelector<TownMapViewport>('.town-map-viewport');
  viewport?.__focusTownMap?.();
}

function resetTownRoutePreview(panel: Element): void {
  panel.querySelectorAll<HTMLElement>('.town-node.is-previewed').forEach((item) => item.classList.remove('is-previewed'));
  const currentLabel = panel.querySelector<HTMLElement>('.town-route-current');
  if (!currentLabel) return;
  currentLabel.textContent = currentLabel.dataset.userLabel || currentLabel.textContent;
  currentLabel.classList.remove('is-previewing');
}

type TownMapViewport = HTMLElement & {
  __focusTownMap?: () => void;
};

function setupTownMapDrag(viewport: HTMLElement, canvas: HTMLElement): void {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = -90;
  let currentY = -18;
  const canvasWidth = 1200;
  const canvasHeight = 1000;

  const clampPosition = (x: number, y: number) => {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: currentX, y: currentY };
    const minX = Math.min(0, rect.width - canvasWidth);
    const minY = Math.min(0, rect.height - canvasHeight);
    return {
      x: Math.max(minX, Math.min(0, x)),
      y: Math.max(minY, Math.min(0, y))
    };
  };
  const updateTransform = () => {
    canvas.style.transform = `translate(${currentX}px, ${currentY}px)`;
  };
  const centerOnPoint = (x: number, y: number) => {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const next = clampPosition(Math.round(rect.width / 2 - x), Math.round(rect.height / 2 - y));
    currentX = next.x;
    currentY = next.y;
    updateTransform();
  };
  (viewport as TownMapViewport).__focusTownMap = () => {
    const x = Number(viewport.dataset.focusX);
    const y = Number(viewport.dataset.focusY);
    if (Number.isFinite(x) && Number.isFinite(y)) centerOnPoint(x, y);
    else updateTransform();
  };
  const getPoint = (event: MouseEvent | TouchEvent) => {
    if ('touches' in event) return { x: event.touches[0]?.clientX || 0, y: event.touches[0]?.clientY || 0 };
    return { x: event.clientX, y: event.clientY };
  };
  const dragStart = (event: MouseEvent | TouchEvent) => {
    if ((event.target as Element | null)?.closest('.town-polaroid')) return;
    isDragging = true;
    const point = getPoint(event);
    startX = point.x - currentX;
    startY = point.y - currentY;
  };
  const drag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    if (event.cancelable) event.preventDefault();
    const point = getPoint(event);
    const next = clampPosition(point.x - startX, point.y - startY);
    currentX = next.x;
    currentY = next.y;
    updateTransform();
  };
  const dragEnd = () => {
    isDragging = false;
  };

  updateTransform();
  viewport.addEventListener('mousedown', dragStart);
  viewport.addEventListener('mousemove', drag);
  viewport.addEventListener('mouseup', dragEnd);
  viewport.addEventListener('mouseleave', dragEnd);
  viewport.addEventListener('touchstart', dragStart, { passive: true });
  viewport.addEventListener('touchmove', drag, { passive: false });
  viewport.addEventListener('touchend', dragEnd);
}

function renderBgmPlayer(bgm: MamaBgmState, onToggleBgm?: () => void): HTMLElement {
  const mask = createElement('div', { className: 'bgm-mask-container' });
  const isPlaying = Boolean(bgm.playing);
  const isAvailable = bgm.available !== false;
  const button = createElement('button', {
    className: `bgm-pull-tab${isPlaying ? ' is-playing' : ''}`,
    attributes: {
      type: 'button',
      title: isAvailable ? 'BGM: Ena Theme' : 'BGM unavailable in this host',
      'aria-label': 'Toggle ENA BGM',
      'aria-pressed': String(isPlaying),
      'data-provider': bgm.provider || 'none'
    }
  });

  button.append(
    createElement('span', { className: 'vinyl-record', attributes: { 'aria-hidden': 'true' } }),
    renderPlayerInfo(),
    renderEqualizer()
  );
  button.addEventListener('click', () => {
    if (!isAvailable) return;
    onToggleBgm?.();
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

function renderScrapbookDesk(state: MamaState): HTMLElement {
  const desk = createElement('section', {
    className: 'scrapbook-desk',
    attributes: { 'aria-label': 'MAMA scrapbook resources' }
  });

  desk.append(renderWalletEnvelope(state.livingExpense), renderErosionPaper(state.corruptionLevel));
  return desk;
}

function renderWalletEnvelope(value: number): HTMLElement {
  const amount = clampNumber(value, 0, 999999, 0);
  const bills = buildLivingExpenseBills(amount);
  const envelope = createElement('div', {
    className: 'wallet-envelope',
    attributes: { title: `同居生活费：¥${formatMoney(amount)}` }
  });
  const billStack = createElement('div', { className: 'bill-stack' });

  bills.forEach((billModel, billIndex) => {
    const stackIndex = billIndex + 1;
    const bill = createElement('div', {
      className: 'bill',
      attributes: {
        'data-face': formatBillFace(billModel.value),
        title: `¥${formatMoney(billModel.value)}`,
        style: formatBillStyle(stackIndex, billModel.palette)
      }
    });
    const left = createElement('div', { className: 'bill-left' });
    left.append(
      createElement('div', { className: 'bill-icon', text: '¥' }),
      createElement('div', { className: 'bill-text', text: formatBillLabel(billModel.value) })
    );
    bill.append(left, createElement('div', { className: 'bill-amount', text: formatBillFace(billModel.value) }));
    billStack.append(bill);
  });

  const front = createElement('div', { className: 'envelope-front' });
  front.append(
    createElement('div', { className: 'env-label', text: '同居生活费' }),
    createElement('div', { className: 'env-val', text: `¥ ${formatMoney(amount)}` })
  );

  envelope.append(
    createElement('div', { className: 'envelope-back' }),
    billStack,
    front
  );
  return envelope;
}

function buildLivingExpenseBills(value: number): LivingExpenseBill[] {
  const target = Math.max(0, Math.round(value));
  if (target <= 0) return [];

  let bestValues: number[] = [];
  let bestScore = Number.POSITIVE_INFINITY;

  const scoreCandidate = (values: number[], sum: number): void => {
    if (values.length === 0) return;

    const difference = Math.abs(sum - target);
    const overshootPenalty = sum > target ? 1 : 0;
    const uniqueCount = new Set(values).size;
    const repeatPenalty = (values.length - uniqueCount) * 0.03;
    const densityPenalty = values.length * 0.02;
    const varietyBonus = uniqueCount * 0.015;
    const score = difference + overshootPenalty + repeatPenalty + densityPenalty - varietyBonus;

    if (score < bestScore) {
      bestScore = score;
      bestValues = [...values];
    }
  };

  const visit = (startIndex: number, values: number[], sum: number): void => {
    scoreCandidate(values, sum);
    if (values.length >= 5) return;

    for (let index = startIndex; index < LIVING_EXPENSE_BILL_DENOMINATIONS.length; index += 1) {
      const denomination = LIVING_EXPENSE_BILL_DENOMINATIONS[index];
      values.push(denomination);
      visit(index, values, sum + denomination);
      values.pop();
    }
  };

  visit(0, [], 0);

  return bestValues
    .sort((left, right) => right - left)
    .map((billValue) => ({
      value: billValue,
      palette: getLivingExpenseBillPalette(billValue)
    }));
}

function getLivingExpenseBillPalette(value: number): LivingExpenseBillPalette {
  if (value >= 100000) return LIVING_EXPENSE_BILL_PALETTES.premium;
  if (value >= 10000) return LIVING_EXPENSE_BILL_PALETTES.large;
  if (value >= 1000) return LIVING_EXPENSE_BILL_PALETTES.medium;
  return LIVING_EXPENSE_BILL_PALETTES.small;
}

function formatBillStyle(stackIndex: number, palette: LivingExpenseBillPalette): string {
  return [
    `--i: ${stackIndex}`,
    `--bill-color: ${palette.color}`,
    `--bill-bg: ${palette.bg}`,
    `--bill-pattern: ${palette.pattern}`,
    `--bill-line: ${palette.line}`,
    `--bill-muted: ${palette.muted}`,
    `--bill-watermark: ${palette.watermark}`,
    `--bill-shadow: ${palette.shadow}`,
    `--bill-hover-shadow: ${palette.hoverShadow}`
  ].join('; ');
}

function formatBillFace(value: number): string {
  return String(value);
}

function formatBillLabel(value: number): string {
  if (value >= 100000) return 'RES';
  if (value >= 10000) return 'SAV';
  if (value >= 1000) return 'JPY';
  return 'YEN';
}

function renderErosionPaper(value: number): HTMLElement {
  const corruption = clampNumber(value, 0, 100, 0);
  const wrapper = createElement('div', {
    className: 'erosion-wrapper',
    attributes: {
      title: `侵蚀度：${corruption}%`,
      style: `--corruption-level: ${corruption / 100};`
    }
  });
  const paper = createElement('div', { className: 'erosion-paper' });
  const valueGroup = createElement('div', { className: 'scrap-val-group' });
  const valueNode = createElement('div', { className: 'scrap-val' });
  valueNode.append(String(corruption), createElement('span', { text: '%' }));
  valueGroup.append(valueNode);

  paper.append(
    createElement('div', { className: 'scrap-header', text: 'CORRUPTION' }),
    createElement('div', { className: 'scrap-title', text: '侵蚀度' }),
    valueGroup,
    createElement('div', { className: 'ink-scribble' }),
    createElement('div', { className: 'ink-corruption' })
  );
  wrapper.append(paper, createElement('div', { className: 'paperclip' }));
  return wrapper;
}

function renderStatusWidgets(state: MamaState): HTMLElement {
  const widgets = createElement('div', {
    className: 'status-widgets',
    attributes: { 'aria-label': 'MAMA status meters' }
  });

  widgets.append(
    renderStatusCapsule({
      className: 'w-affection',
      ringClass: 'r-affection',
      icon: 'heart',
      label: '好感',
      level: getAffectionLevel(state.affection),
      color: '#ee9fb5',
      iconColor: '#d9829c',
      trackColor: '#ebe8ef',
      title: '好感：纯爱情感与温馨羁绊'
    }),
    renderStatusCapsule({
      className: 'w-fatigue',
      ringClass: 'r-fatigue',
      icon: 'moon',
      label: '疲劳',
      level: state.fatigueLevel,
      color: '#aeb2c1',
      iconColor: '#8f94a6',
      trackColor: '#ebe8ef',
      title: '疲劳：熬夜打怪后的困倦与电量槽，满值会断电秒睡'
    }),
    renderStatusCapsule({
      className: 'w-mana',
      ringClass: 'r-mana',
      icon: 'hex',
      label: '魔力',
      level: state.manaLevel,
      color: '#85ccd6',
      iconColor: '#58b5c2',
      trackColor: '#ebe8ef',
      title: '魔力：治愈魔法与战斗大招的蓝条'
    })
  );

  return widgets;
}

function renderStatusCapsule(options: {
  className: string;
  ringClass: string;
  icon: StatusIconName;
  label: string;
  level: number;
  color: string;
  iconColor: string;
  trackColor: string;
  title: string;
}): HTMLElement {
  const level = clampMamaLevel(options.level);
  const capsule = createElement('button', {
    className: `w-status-capsule ${options.className}`,
    attributes: {
      type: 'button',
      'aria-label': `${options.label}: LV ${level}/5`,
      'aria-expanded': 'false',
      title: `${options.title}: LV ${level}/5`,
      style: `--c: ${options.color}; --icon: ${options.iconColor}; --track: ${options.trackColor}; --level: ${level};`
    }
  });

  const info = createElement('div', { className: 'widget-info' });
  info.append(
    createElement('div', { className: 'w-label', text: options.label }),
    createWidgetValue(`LV ${level}`, '/5')
  );
  capsule.addEventListener('click', () => toggleStatusCapsule(capsule));
  capsule.append(info, renderRingChart(options.ringClass, level, options.color, options.icon));
  return capsule;
}

function toggleStatusCapsule(capsule: HTMLElement): void {
  const shouldExpand = !capsule.classList.contains('is-expanded');
  const group = capsule.closest('.status-widgets');

  group?.querySelectorAll<HTMLElement>('.w-status-capsule.is-expanded').forEach((item) => {
    item.classList.remove('is-expanded');
    item.setAttribute('aria-expanded', 'false');
  });

  capsule.classList.toggle('is-expanded', shouldExpand);
  capsule.setAttribute('aria-expanded', String(shouldExpand));
}

function createWidgetValue(value: string, suffix: string): HTMLElement {
  const wrapper = createElement('div', { className: 'w-val' });
  wrapper.append(value, createElement('span', { className: 'pct', text: suffix }));
  return wrapper;
}

type StatusIconName = 'heart' | 'moon' | 'hex';

function renderRingChart(className: string, level: number, color: string, icon: StatusIconName): HTMLElement {
  const safeLevel = clampMamaLevel(level);
  const chart = createElement('div', {
    className: `ring-chart ${className}`,
    attributes: {
      style: `--c: ${color}; --level: ${safeLevel};`
    }
  });
  const segments = Array.from({ length: 5 }, (_, index) => {
    const offset = index * -20;
    const fillClass = index < safeLevel ? ' status-ring-segment-fill' : '';
    return `<circle class="status-ring-segment${fillClass}" cx="20" cy="20" r="17" pathLength="100" stroke-dasharray="16 84" stroke-dashoffset="${offset}"></circle>`;
  }).join('');

  chart.innerHTML = `
    <svg class="status-ring-svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      ${segments}
    </svg>
  `;
  chart.append(renderStatusIcon(icon));
  return chart;
}

function renderStatusIcon(icon: StatusIconName): HTMLElement {
  const wrapper = createElement('span', {
    className: 'status-meter-icon',
    attributes: { 'aria-hidden': 'true' }
  });

  wrapper.innerHTML = STATUS_ICON_SVG[icon];
  return wrapper;
}

const STATUS_ICON_SVG: Record<StatusIconName, string> = {
  heart: '<svg viewBox="0 0 256 256" focusable="false"><path d="M178,36c-20.09,0-37.92,7.93-50,21.56C115.92,43.93,98.09,36,78,36a66.08,66.08,0,0,0-66,66c0,72.34,105.81,130.14,110.31,132.57a12,12,0,0,0,11.38,0C138.19,232.14,244,174.34,244,102A66.08,66.08,0,0,0,178,36Zm-5.49,142.36A328.69,328.69,0,0,1,128,210.16a328.69,328.69,0,0,1-44.51-31.8C61.82,159.77,36,131.42,36,102A42,42,0,0,1,78,60c17.8,0,32.7,9.4,38.89,24.54a12,12,0,0,0,22.22,0C145.3,69.4,160.2,60,178,60a42,42,0,0,1,42,42C220,131.42,194.18,159.77,172.51,178.36Z"></path></svg>',
  moon: '<svg viewBox="0 0 256 256" focusable="false"><path d="M236.37,139.4a12,12,0,0,0-12-3A84.07,84.07,0,0,1,119.6,31.59a12,12,0,0,0-15-15A108.86,108.86,0,0,0,49.69,55.07,108,108,0,0,0,136,228a107.09,107.09,0,0,0,64.93-21.69,108.86,108.86,0,0,0,38.44-54.94A12,12,0,0,0,236.37,139.4Zm-49.88,47.74A84,84,0,0,1,68.86,69.51,84.93,84.93,0,0,1,92.27,48.29Q92,52.13,92,56A108.12,108.12,0,0,0,200,164q3.87,0,7.71-.27A84.79,84.79,0,0,1,186.49,187.14Z"></path></svg>',
  hex: '<svg viewBox="0 0 256 256" focusable="false"><path d="M225.6,62.64l-88-48.17a19.91,19.91,0,0,0-19.2,0l-88,48.17A20,20,0,0,0,20,80.19v95.62a20,20,0,0,0,10.4,17.55l88,48.17a19.89,19.89,0,0,0,19.2,0l88-48.17A20,20,0,0,0,236,175.81V80.19A20,20,0,0,0,225.6,62.64ZM212,173.44l-84,46-84-46V82.56l84-46,84,46Z"></path></svg>'
};

function renderNameTag(state: MamaState): HTMLElement {
  const tag = createElement('div', { className: 'ena-name-tag' });
  const paper = createElement('div', { className: 'paper' });
  const header = createElement('div', { className: 'date-header' });
  const weekday = getMamaWeekday(state.day);
  const dayRow = createElement('div', { className: 'day-row' });
  const dayText = createElement('div', { className: 'day-txt', text: `DAY ${formatCounter(state.day)}` });
  const timeline = createElement('div', { className: 'timeline' });

  dayText.append(createElement('span', {
    className: 'weekday-txt',
    text: weekday.short,
    attributes: { title: weekday.label }
  }));
  dayRow.append(dayText);
  header.append(
    createElement('div', { className: 'week-txt', text: `WEEK ${formatCounter(state.week)}` }),
    dayRow
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
    createElement('div', { className: 'pinned-name-cn', text: '天羽 绘奈' }),
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
  stack.append(renderDialogueLine('使魔 涅露露', state.mascotComment, state.mascotEmotion));
  return stack;
}

function renderDialogueLine(speaker: string, text: string, mascotEmotion: unknown): HTMLElement {
  const expression = resolveMascotExpression(mascotEmotion);
  const wrapper = createElement('div', {
    className: 'mascot-dialogue-section',
    attributes: { 'data-mascot-expression': expression }
  });
  const bubble = createElement('div', { className: 'mascot-bubble' });
  const avatar = createElement('div', {
    className: 'mascot-raw-avatar',
    attributes: {
      'data-mascot-expression': expression
    }
  });
  const image = createElement('img', {
    className: 'mascot-avatar-img',
    attributes: {
      src: getMascotExpressionUrl(expression),
      alt: `${speaker} ${expression}`
    }
  });

  bubble.append(
    createElement('div', { className: 'name-label', text: speaker }),
    createElement('div', { className: 'flat-pin' }),
    createElement('div', { className: 'vertical-line' }),
    createElement('div', { className: 'msg-text', text })
  );
  avatar.append(image);
  wrapper.append(bubble, avatar);
  return wrapper;
}

function formatOutfitTitle(outfit: string): string {
  const titles: Record<string, string> = {
    school_uniform: 'School Uniform',
    streetwear_inner: 'Streetwear Inner',
    streetwear_full: 'Streetwear Full',
    outfit_winter: 'Winter Outfit',
    outfit_gym: 'Gym Uniform',
    outfit_maid_jersey: 'Jersey Maid',
    nightwear: 'Nightwear',
    outfit_swimsuit: 'Swimsuit',
    outfit_yukata: 'Yukata',
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
    outfit_gym: 'GYM_01',
    outfit_maid_jersey: 'MAID_JERSEY',
    nightwear: 'SLEEP_01',
    outfit_swimsuit: 'SWIM_01',
    outfit_yukata: 'YUKATA_01',
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

function formatMoney(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return safeValue.toLocaleString('en-US');
}

function resolveMascotExpression(value: unknown): MamaMascotExpression {
  const expression = normalizeMascotExpression(value);
  return mascotAssets[expression] ? expression : DEFAULT_MAMA_MASCOT_EXPRESSION;
}

function getMascotExpressionUrl(expression: MamaMascotExpression): string {
  return mascotAssets[expression] || mascotAssets[DEFAULT_MAMA_MASCOT_EXPRESSION] || '';
}

function formatLocationLabel(location: MamaLocationResolution): string {
  return location.kind === 'known' ? location.detail.label : location.raw;
}

function getResolvedTownNode(location: MamaLocationResolution): TownLocationNode | null {
  if (location.kind !== 'known') return null;
  return TOWN_LOCATION_NODES.find((node) => node.key === location.key) || null;
}

function getBackgroundUrl(key: string, timePhase: MamaTimePhase): string {
  const normalizedKey = key.replace(/_(?:d|n)$/i, '');
  const phaseKey = `${normalizedKey}_${timePhase === 'night' ? 'n' : 'd'}`;
  return backgroundAssets[phaseKey] || backgroundAssets[normalizedKey] || backgroundAssets[key] || '';
}

function buildBackgroundAssetMap(modules: Record<string, string>): Record<string, string> {
  return Object.entries(modules).reduce<Record<string, string>>((map, [path, url]) => {
    const key = path.split('/').pop()?.replace(/\.jpe?g$/i, '');
    if (key) map[key] = url;
    return map;
  }, {});
}

function buildMascotAssetMap(modules: Record<string, string>): Partial<Record<MamaMascotExpression, string>> {
  const expressionKeys = new Set<string>(MAMA_MASCOT_EXPRESSION_KEYS);
  return Object.entries(modules).reduce<Partial<Record<MamaMascotExpression, string>>>((map, [path, url]) => {
    const key = path.split('/').pop()?.replace(/\.png$/i, '');
    if (key && expressionKeys.has(key)) {
      map[key as MamaMascotExpression] = url;
    }
    return map;
  }, {});
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
