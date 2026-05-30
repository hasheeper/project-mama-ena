import {
  DEFAULT_EXPRESSION,
  emotionAssets,
  expressionAssets,
  expressions,
  outfitAssets,
  resolveExpression,
  resolveOutfitName,
  resolveStandingLayers,
  type ExpressionLayerRef,
  type StandingLayer,
  type StandingLayerKind
} from '../../mama/standing-assets';
import { createStandingFigure } from '../../mama/standing-renderer';
import { DEFAULT_MAMA_STATE } from '../../mama/state';
import { isMamaMessage } from '../../protocol/messages';

type DebugMode = 'base' | 'exp';
type MoodTest = 'none' | 'shadow' | 'pale';

interface ElementOptions {
  className?: string;
  text?: string;
  attributes?: Record<string, string>;
}

const SPECIAL_BASES = new Set(['nephilim', 'seraphim']);
const OUTFIT_ORDER = [
  'streetwear_full',
  'streetwear_inner',
  'school_uniform',
  'outfit_winter',
  'nightwear',
  'underwear',
  'nude',
  'seraphim',
  'nephilim'
];

const LAYER_Z_INDEX: Record<StandingLayerKind, number> = {
  face_fx: 10,
  mouth: 20,
  expression_other: 25,
  base: 30,
  eyes: 40,
  mood_under: 45,
  brow: 50,
  mood_top: 60,
  emotion: 70
};

const LAYER_LABELS: Record<StandingLayerKind, string> = {
  face_fx: 'face fx',
  mouth: 'mouth',
  expression_other: 'exp other',
  base: 'base',
  eyes: 'eyes',
  mood_under: 'mood under',
  brow: 'brow',
  mood_top: 'mood top',
  emotion: 'emotion'
};

const DEFAULT_CANVAS_ZOOM = 0.82;
const MIN_CANVAS_ZOOM = 0.25;
const MAX_CANVAS_ZOOM = 3.5;
const CANVAS_ZOOM_STEP = 0.14;

const root = document.querySelector<HTMLElement>('[data-app-id="layer-debug"]');
const outfitNames = sortOutfits(Object.keys(outfitAssets));
const emotionNames = sortEmotionNames(Object.keys(emotionAssets));
const expressionPresets = sortExpressionsById(expressions);
const assetNameByUrl = buildAssetNameMap();

let mode = readMode();
let selectedOutfit = resolveOutfitName(readParam('outfit') || DEFAULT_MAMA_STATE.outfit);
let selectedExpression = resolveExpression(readParam('exp') || readParam('expression') || DEFAULT_EXPRESSION).name;
let selectedEmotion = readEmotionName();
let moodTest = readMoodTest();
let searchQuery = readParam('q') || '';
let connectedHostName = '';
let canvasZoom = DEFAULT_CANVAS_ZOOM;
let canvasPanX = 0;
let canvasPanY = 0;
let expressionScrollTop = 0;
let baseScrollTop = 0;

render();
window.addEventListener('message', handleMessage);
window.parent?.postMessage({ type: 'mama:app-ready', appId: 'layer-debug' }, '*');

function handleMessage(event: MessageEvent): void {
  if (!isMamaMessage(event.data)) return;
  if (event.data.type !== 'mama:container-ready') return;
  connectedHostName = event.data.app.name;
  root?.setAttribute('data-host-app', event.data.app.id);
  render();
}

function render(): void {
  if (!root) return;
  captureScrollState();
  root.replaceChildren(renderApp());
  restoreScrollState();
  syncUrlState();
}

function renderApp(): HTMLElement {
  const app = createElement('main', { className: 'layer-debug' });
  app.append(
    renderHeader(),
    createElement('div', { className: 'debug-divider' }),
    renderWorkspace()
  );
  return app;
}

function renderHeader(): HTMLElement {
  const header = createElement('header', { className: 'debug-header' });
  const titleBlock = createElement('div', { className: 'title-block' });
  const title = createElement('h1', { text: 'Layer Debug' });
  const meta = createElement('div', {
    className: 'header-meta',
    text: connectedHostName ? `host: ${connectedHostName}` : 'standalone'
  });
  const tabs = createElement('div', {
    className: 'mode-tabs',
    attributes: { role: 'tablist', 'aria-label': 'debug mode' }
  });

  titleBlock.append(title, meta);
  tabs.append(
    renderModeButton('base', 'Base'),
    renderModeButton('exp', 'Exp')
  );
  header.append(titleBlock, tabs);
  return header;
}

function renderModeButton(nextMode: DebugMode, label: string): HTMLButtonElement {
  const button = createElement('button', {
    className: `mode-tab${mode === nextMode ? ' is-active' : ''}`,
    text: label,
    attributes: {
      type: 'button',
      role: 'tab',
      'aria-selected': String(mode === nextMode)
    }
  });
  button.addEventListener('click', () => {
    mode = nextMode;
    render();
  });
  return button;
}

function renderWorkspace(): HTMLElement {
  const workspace = createElement('section', { className: 'debug-workspace' });
  const browser = mode === 'base' ? renderBaseBrowser() : renderExpressionBrowser();
  workspace.append(renderPreviewPanel(), browser);
  return workspace;
}

function renderPreviewPanel(): HTMLElement {
  const expression = getCurrentExpression();
  const resolved = resolveStandingLayers(selectedOutfit, expression);
  const debugEmotionLayers = resolveDebugEmotionLayers();
  const layers = [...resolved.layers, ...debugEmotionLayers];
  const panel = createElement('section', { className: 'preview-panel' });
  const top = createElement('div', { className: 'panel-topline' });
  const title = createElement('div', { className: 'panel-title', text: resolved.expression.name });
  const outfit = createElement('div', { className: 'panel-subtitle', text: resolved.outfit });
  const stage = createElement('div', {
    className: 'preview-stage',
    attributes: { role: 'application', 'aria-label': 'draggable zoomable layer preview' }
  });
  const viewport = createElement('div', { className: 'canvas-viewport' });
  const figure = createStandingFigure({
    outfit: resolved.outfit,
    expression: resolved.expression,
    className: 'mama-standing--layer-debug',
    label: `Ena ${resolved.outfit} ${resolved.expression.name}`,
    extraLayers: debugEmotionLayers
  });

  viewport.append(figure);
  top.append(title, outfit);
  stage.append(renderCanvasGrid(), viewport, renderCanvasTools(stage, viewport));
  bindCanvasPanZoom(stage, viewport);
  applyCanvasTransform(viewport);
  panel.append(
    top,
    stage,
    renderTagSummary(resolved.expression),
    renderLayerStack(layers, resolved.expression)
  );
  return panel;
}

function renderCanvasGrid(): HTMLElement {
  return createElement('div', { className: 'canvas-grid', attributes: { 'aria-hidden': 'true' } });
}

function renderCanvasTools(stage: HTMLElement, viewport: HTMLElement): HTMLElement {
  const tools = createElement('div', { className: 'canvas-tools' });
  tools.append(
    renderCanvasButton('-', 'Zoom out', () => setCanvasZoom(canvasZoom - CANVAS_ZOOM_STEP, viewport)),
    createElement('span', { className: 'zoom-readout', text: `${Math.round(canvasZoom * 100)}%` }),
    renderCanvasButton('+', 'Zoom in', () => setCanvasZoom(canvasZoom + CANVAS_ZOOM_STEP, viewport)),
    renderCanvasButton('1:1', 'Actual size', () => setCanvasZoom(1, viewport)),
    renderCanvasButton('Fit', 'Fit to canvas', () => fitCanvas(stage, viewport))
  );
  return tools;
}

function renderCanvasButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
  const button = createElement('button', {
    className: 'canvas-tool',
    text: label,
    attributes: { type: 'button', title, 'aria-label': title }
  });
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick();
    render();
  });
  return button;
}

function bindCanvasPanZoom(stage: HTMLElement, viewport: HTMLElement): void {
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  stage.addEventListener('pointerdown', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, select, input')) return;
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    stage.classList.add('is-dragging');
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    canvasPanX += dx;
    canvasPanY += dy;
    applyCanvasTransform(viewport);
  });

  const stopDrag = (event: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;
    stage.classList.remove('is-dragging');
    try {
      stage.releasePointerCapture(event.pointerId);
    } catch (_) {}
  };

  stage.addEventListener('pointerup', stopDrag);
  stage.addEventListener('pointercancel', stopDrag);
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    setCanvasZoom(canvasZoom + direction * CANVAS_ZOOM_STEP, viewport);
    const readout = stage.querySelector<HTMLElement>('.zoom-readout');
    if (readout) readout.textContent = `${Math.round(canvasZoom * 100)}%`;
  }, { passive: false });
}

function setCanvasZoom(nextZoom: number, viewport: HTMLElement): void {
  canvasZoom = clamp(nextZoom, MIN_CANVAS_ZOOM, MAX_CANVAS_ZOOM);
  applyCanvasTransform(viewport);
}

function fitCanvas(stage: HTMLElement, viewport: HTMLElement): void {
  const stageRect = stage.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const unscaledWidth = viewportRect.width / canvasZoom;
  const unscaledHeight = viewportRect.height / canvasZoom;
  const nextZoom = Math.min(
    (stageRect.width * 0.78) / unscaledWidth,
    (stageRect.height * 0.78) / unscaledHeight
  );
  canvasZoom = clamp(nextZoom, MIN_CANVAS_ZOOM, MAX_CANVAS_ZOOM);
  canvasPanX = 0;
  canvasPanY = 0;
  applyCanvasTransform(viewport);
}

function applyCanvasTransform(viewport: HTMLElement): void {
  viewport.style.transform = `translate(-50%, -50%) translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasZoom})`;
}

function renderTagSummary(expression: ExpressionLayerRef): HTMLElement {
  const wrapper = createElement('div', { className: 'tag-summary' });
  wrapper.append(
    renderTag(`base:${selectedOutfit}`),
    renderTag(`face:${expression.face}`),
    renderTag(`mouth:${expression.mouth}`),
    renderTag(`eye:${expression.eye}`),
    renderTag(`brow:${expression.brow}`)
  );

  getOtherTags(expression).forEach((tag) => wrapper.append(renderTag(`other:${tag}`)));
  getEmotionTags(expression).forEach((tag) => wrapper.append(renderTag(`emotion:${tag}`, 'debug')));
  getAutoDiffTags(selectedOutfit, expression).forEach((tag) => wrapper.append(renderTag(tag, 'auto')));
  if (selectedEmotion !== 'none') wrapper.append(renderTag(`debug:${selectedEmotion}`, 'debug'));

  return wrapper;
}

function renderLayerStack(layers: StandingLayer[], expression: ExpressionLayerRef): HTMLElement {
  const stack = createElement('section', { className: 'layer-stack' });
  const header = createElement('div', { className: 'stack-header' });
  header.append(
    createElement('span', { text: 'Resolved Stack' }),
    createElement('strong', { text: String(layers.length) })
  );
  stack.append(header);

  layers.forEach((layer, index) => {
    const row = createElement('div', { className: 'layer-row' });
    const order = createElement('span', { className: 'layer-order', text: String(index + 1).padStart(2, '0') });
    const label = createElement('div', { className: 'layer-main' });
    const asset = getAssetName(layer.url);
    label.append(
      createElement('strong', { text: LAYER_LABELS[layer.kind] }),
      createElement('span', { text: asset })
    );
    row.append(
      order,
      label,
      createElement('span', { className: 'layer-source', text: getLayerSource(layer, asset, expression) }),
      createElement('span', { className: 'layer-z', text: `z${LAYER_Z_INDEX[layer.kind]}` })
    );
    stack.append(row);
  });

  return stack;
}

function renderBaseBrowser(): HTMLElement {
  const section = createElement('section', { className: 'browser-panel' });
  section.append(renderBaseToolbar(), renderEmotionPanel(), renderBaseGrid());
  return section;
}

function renderBaseToolbar(): HTMLElement {
  const toolbar = createElement('div', { className: 'toolbar' });
  const moodGroup = createElement('div', {
    className: 'segmented-control',
    attributes: { role: 'group', 'aria-label': 'mood diff' }
  });
  moodGroup.append(
    renderMoodButton('none', 'normal'),
    renderMoodButton('shadow', 'shadow'),
    renderMoodButton('pale', 'pale')
  );
  toolbar.append(
    createElement('div', { className: 'toolbar-title', text: 'Base Diff' }),
    moodGroup
  );
  return toolbar;
}

function renderMoodButton(nextMood: MoodTest, label: string): HTMLButtonElement {
  const button = createElement('button', {
    className: `segment${moodTest === nextMood ? ' is-active' : ''}`,
    text: label,
    attributes: { type: 'button', 'aria-pressed': String(moodTest === nextMood) }
  });
  button.addEventListener('click', () => {
    moodTest = nextMood;
    render();
  });
  return button;
}

function renderEmotionPanel(): HTMLElement {
  const panel = createElement('section', { className: 'emotion-debug' });
  const heading = createElement('div', { className: 'emotion-debug-head' });
  heading.append(
    createElement('strong', { text: 'Emotion' }),
    createElement('span', { text: selectedEmotion === 'none' ? 'none' : selectedEmotion })
  );

  const grid = createElement('div', { className: 'emotion-grid' });
  ['none', ...emotionNames].forEach((emotion) => grid.append(renderEmotionButton(emotion)));
  panel.append(heading, grid);
  return panel;
}

function renderEmotionButton(emotion: string): HTMLButtonElement {
  const isSelected = selectedEmotion === emotion;
  const button = createElement('button', {
    className: `emotion-button${isSelected ? ' is-selected' : ''}`,
    text: emotion === 'none' ? 'none' : emotion.replace(/^Emotion_/, ''),
    attributes: {
      type: 'button',
      title: emotion,
      'aria-pressed': String(isSelected)
    }
  });
  button.addEventListener('click', () => {
    selectedEmotion = emotion;
    render();
  });
  return button;
}

function renderBaseGrid(): HTMLElement {
  const grid = createElement('div', { className: 'base-grid' });
  outfitNames.forEach((outfit) => grid.append(renderBaseCard(outfit)));
  return grid;
}

function captureScrollState(): void {
  const expressionList = root?.querySelector<HTMLElement>('.expression-list');
  const baseGrid = root?.querySelector<HTMLElement>('.base-grid');
  if (expressionList) expressionScrollTop = expressionList.scrollTop;
  if (baseGrid) baseScrollTop = baseGrid.scrollTop;
}

function restoreScrollState(): void {
  const expressionList = root?.querySelector<HTMLElement>('.expression-list');
  const baseGrid = root?.querySelector<HTMLElement>('.base-grid');
  if (expressionList) expressionList.scrollTop = expressionScrollTop;
  if (baseGrid) baseGrid.scrollTop = baseScrollTop;
}

function renderBaseCard(outfit: string): HTMLButtonElement {
  const button = createElement('button', {
    className: `base-card${selectedOutfit === outfit ? ' is-selected' : ''}`,
    attributes: { type: 'button', 'aria-pressed': String(selectedOutfit === outfit) }
  });
  const thumb = createElement('span', { className: 'base-thumb' });
  const image = document.createElement('img');
  image.src = outfitAssets[outfit];
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;
  thumb.append(image);
  button.append(
    thumb,
    createElement('strong', { text: outfit }),
    renderBaseDiffLine(outfit)
  );
  button.addEventListener('click', () => {
    selectedOutfit = outfit;
    render();
  });
  return button;
}

function renderBaseDiffLine(outfit: string): HTMLElement {
  const line = createElement('span', { className: 'base-diff-line' });
  line.append(
    renderMiniTag(SPECIAL_BASES.has(outfit) ? 'special' : 'standard'),
    renderMiniTag(getMoodUnderName(outfit, 'shadow')),
    renderMiniTag(getMoodUnderName(outfit, 'pale'))
  );
  return line;
}

function renderExpressionBrowser(): HTMLElement {
  const section = createElement('section', { className: 'browser-panel' });
  const filteredExpressions = expressionPresets.filter((expression) => expressionMatchesSearch(expression, searchQuery));
  section.append(
    renderExpressionToolbar(filteredExpressions.length),
    renderEmotionPanel(),
    renderExpressionList(filteredExpressions)
  );
  return section;
}

function renderExpressionToolbar(filteredCount: number): HTMLElement {
  const titleText = searchQuery
    ? `Exp Presets · ${filteredCount}/${expressionPresets.length}`
    : `Exp Presets · ${expressionPresets.length}`;
  const toolbar = createElement('div', { className: 'toolbar' });
  const title = createElement('div', { className: 'toolbar-title', text: titleText });
  const controls = createElement('div', { className: 'toolbar-controls' });
  controls.append(renderOutfitSelect(), renderSearchInput());
  toolbar.append(title, controls);
  return toolbar;
}

function renderOutfitSelect(): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'outfit-select';
  select.setAttribute('aria-label', 'preview base');
  outfitNames.forEach((outfit) => {
    const option = document.createElement('option');
    option.value = outfit;
    option.textContent = outfit;
    option.selected = outfit === selectedOutfit;
    select.append(option);
  });
  select.addEventListener('change', () => {
    selectedOutfit = resolveOutfitName(select.value);
    render();
  });
  return select;
}

function renderSearchInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.className = 'search-input';
  input.type = 'search';
  input.placeholder = 'filter tags';
  input.value = searchQuery;
  input.addEventListener('input', () => {
    searchQuery = input.value;
    render();
  });
  return input;
}

function renderExpressionList(filtered: ExpressionLayerRef[]): HTMLElement {
  const list = createElement('div', { className: 'expression-list' });
  filtered.forEach((expression) => list.append(renderExpressionRow(expression)));
  if (!filtered.length) {
    list.append(createElement('div', { className: 'empty-state', text: 'No presets' }));
  }
  return list;
}

function sortExpressionsById(items: ExpressionLayerRef[]): ExpressionLayerRef[] {
  return [...items].sort((a, b) => a.id - b.id);
}

function renderExpressionRow(expression: ExpressionLayerRef): HTMLButtonElement {
  const button = createElement('button', {
    className: `expression-row${selectedExpression === expression.name ? ' is-selected' : ''}`,
    attributes: { type: 'button', 'aria-pressed': String(selectedExpression === expression.name) }
  });
  const id = createElement('span', { className: 'exp-id', text: `#${expression.id}` });
  const main = createElement('span', { className: 'exp-main' });
  const chips = createElement('span', { className: 'exp-chips' });

  main.append(createElement('strong', { text: expression.name }));
  getExpressionTags(expression).forEach((tag) => chips.append(renderMiniTag(tag)));
  getAutoDiffTags(selectedOutfit, expression).forEach((tag) => chips.append(renderMiniTag(tag)));

  button.append(id, main, chips);
  button.addEventListener('click', () => {
    selectedExpression = expression.name;
    render();
  });
  return button;
}

function renderTag(text: string, tone = ''): HTMLElement {
  return createElement('span', { className: `tag${tone ? ` tag-${tone}` : ''}`, text });
}

function renderMiniTag(text: string): HTMLElement {
  return createElement('span', { className: 'mini-tag', text });
}

function getCurrentExpression(): ExpressionLayerRef {
  if (mode === 'base') return makeBaseDebugExpression();
  return resolveExpression(selectedExpression);
}

function makeBaseDebugExpression(): ExpressionLayerRef {
  const face = moodTest === 'shadow'
    ? 'face_shadow'
    : moodTest === 'pale'
      ? 'face_pale'
      : 'face_default';

  return {
    id: 0,
    name: `debug_${face}`,
    face,
    mouth: 'mouth_neutral',
    eye: 'eye_normal',
    brow: 'brow_normal'
  };
}

function resolveDebugEmotionLayers(): StandingLayer[] {
  if (selectedEmotion === 'none') return [];
  const url = emotionAssets[selectedEmotion];
  return url ? [{ kind: 'emotion', url }] : [];
}

function getOtherTags(expression: ExpressionLayerRef): string[] {
  return Array.isArray(expression.other) ? expression.other : expression.other ? [expression.other] : [];
}

function getEmotionTags(expression: ExpressionLayerRef): string[] {
  return Array.isArray(expression.emotion) ? expression.emotion : expression.emotion ? [expression.emotion] : [];
}

function getExpressionTags(expression: ExpressionLayerRef): string[] {
  return [
    expression.face,
    expression.mouth,
    expression.eye,
    expression.brow,
    ...getOtherTags(expression),
    ...getEmotionTags(expression)
  ];
}

function getAutoDiffTags(outfit: string, expression: ExpressionLayerRef): string[] {
  const mood = expression.face === 'face_shadow'
    ? 'shadow'
    : expression.face === 'face_pale'
      ? 'pale'
      : '';
  if (!mood) return [];
  return [`auto:${getMoodUnderName(outfit, mood)}`, `auto:${mood}_1`];
}

function getMoodUnderName(outfit: string, mood: 'shadow' | 'pale'): string {
  return `${mood}_${SPECIAL_BASES.has(outfit) ? '3' : '2'}`;
}

function getLayerSource(layer: StandingLayer, asset: string, expression: ExpressionLayerRef): string {
  if (layer.kind === 'face_fx') return asset.endsWith('/face_default') ? 'default' : 'exp.face';
  if (layer.kind === 'mouth') return 'exp.mouth';
  if (layer.kind === 'expression_other') return 'exp.other';
  if (layer.kind === 'base') return 'base';
  if (layer.kind === 'eyes') return 'exp.eye';
  if (layer.kind === 'brow') return 'exp.brow';
  if (layer.kind === 'mood_under' || layer.kind === 'mood_top') {
    return expression.face === 'face_pale' ? 'auto pale' : 'auto shadow';
  }
  if (layer.kind === 'emotion') return getEmotionTags(expression).some((name) => asset.endsWith(`/${name}`))
    ? 'exp.emotion'
    : 'debug emotion';
  return 'layer';
}

function getAssetName(url: string): string {
  return assetNameByUrl.get(url) || url.split('/').pop()?.replace(/-[\w-]+\.png$/i, '').replace(/\.png$/i, '') || 'inline';
}

function buildAssetNameMap(): Map<string, string> {
  const map = new Map<string, string>();
  const groups = {
    base: outfitAssets,
    face: expressionAssets.face,
    mouth: expressionAssets.mouth,
    eye: expressionAssets.eye,
    brow: expressionAssets.brow,
    other: expressionAssets.other,
    emotion: emotionAssets
  };
  Object.entries(groups).forEach(([group, assets]) => {
    Object.entries(assets).forEach(([name, url]) => map.set(url, `${group}/${name}`));
  });
  return map;
}

function expressionMatchesSearch(expression: ExpressionLayerRef, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    expression.name,
    expression.face,
    expression.mouth,
    expression.eye,
    expression.brow,
    ...getOtherTags(expression)
  ].some((value) => value.toLowerCase().includes(needle));
}

function sortOutfits(values: string[]): string[] {
  const known = OUTFIT_ORDER.filter((name) => values.includes(name));
  const rest = values.filter((name) => !OUTFIT_ORDER.includes(name)).sort();
  return [...known, ...rest];
}

function sortEmotionNames(values: string[]): string[] {
  return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function readParam(key: string): string {
  return new URLSearchParams(location.search).get(key) || '';
}

function readMode(): DebugMode {
  return readParam('mode') === 'base' ? 'base' : 'exp';
}

function readMoodTest(): MoodTest {
  const value = readParam('mood');
  return value === 'shadow' || value === 'pale' ? value : 'none';
}

function readEmotionName(): string {
  const value = readParam('emotion');
  return value && emotionAssets[value] ? value : 'none';
}

function syncUrlState(): void {
  const next = new URL(location.href);
  next.searchParams.set('mode', mode);
  next.searchParams.set('outfit', selectedOutfit);
  if (selectedEmotion !== 'none') next.searchParams.set('emotion', selectedEmotion);
  else next.searchParams.delete('emotion');
  if (mode === 'exp') next.searchParams.set('expression', selectedExpression);
  else next.searchParams.delete('expression');
  if (mode === 'base' && moodTest !== 'none') next.searchParams.set('mood', moodTest);
  else next.searchParams.delete('mood');
  if (searchQuery) next.searchParams.set('q', searchQuery);
  else next.searchParams.delete('q');
  history.replaceState(null, '', next.href);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: ElementOptions = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([name, value]) => element.setAttribute(name, value));
  }

  return element;
}
