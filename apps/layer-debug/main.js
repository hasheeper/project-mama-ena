const SOURCE_ASSET_BASE = '../../src/assets/png/standing';
const DIST_ASSET_BASE = '../../mama-assets/standing';
const DEFAULT_EXPRESSION = 'exp_smile_soft';
const DEFAULT_OUTFIT = 'streetwear_full';
const DEFAULT_ZOOM = 0.82;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.5;
const ZOOM_STEP = 0.14;
const SPECIAL_BASES = new Set(['nephilim', 'seraphim']);
const OUTFITS = [
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
const EMOTION_ASSETS = [
  'Emotion_Amazed',
  'Emotion_Angry',
  'Emotion_Confusion',
  'Emotion_Curiosity',
  'Emotion_Distress',
  'Emotion_Excited',
  'Emotion_Fearful',
  'Emotion_Glee',
  'Emotion_Heart',
  'Emotion_Laughter',
  'Emotion_Line',
  'Emotion_Shocked',
  'Emotion_Sigh',
  'Emotion_Sleepy',
  'Emotion_Sparkle',
  'Emotion_Star',
  'Emotion_Steam',
  'Emotion_Surprise',
  'Emotion_Surprise2',
  'Emotion_Sweat',
  'Emotion_zzz'
];
const Z_INDEX = {
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
const LABELS = {
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
const FOLDERS = {
  base: 'base',
  face: 'expression/face_fx',
  eye: 'expression/eyes',
  mouth: 'expression/mouth',
  brow: 'expression/brow',
  other: 'expression/other',
  emotion: 'emotion'
};

const root = document.querySelector('[data-app-id="layer-debug"]');
const state = {
  mode: readParam('mode') === 'base' ? 'base' : 'exp',
  outfit: readParam('outfit') || DEFAULT_OUTFIT,
  expression: readParam('exp') || readParam('expression') || DEFAULT_EXPRESSION,
  emotion: EMOTION_ASSETS.includes(readParam('emotion')) ? readParam('emotion') : 'none',
  mood: ['shadow', 'pale'].includes(readParam('mood')) ? readParam('mood') : 'none',
  query: readParam('q') || '',
  zoom: DEFAULT_ZOOM,
  panX: 0,
  panY: 0
};

let assetBase = SOURCE_ASSET_BASE;
let expressions = [];
let expressionMap = new Map();
let expressionScrollTop = 0;
let baseScrollTop = 0;

boot();

async function boot() {
  renderLoading();
  try {
    const loaded = await loadExpressionData();
    assetBase = loaded.assetBase;
    expressions = loaded.data.expressions || [];
    expressionMap = new Map(expressions.map((expression) => [expression.name, expression]));
    state.outfit = OUTFITS.includes(state.outfit) ? state.outfit : DEFAULT_OUTFIT;
    state.expression = expressionMap.has(state.expression) ? state.expression : DEFAULT_EXPRESSION;
    render();
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  }
}

async function loadExpressionData() {
  const bases = [SOURCE_ASSET_BASE, DIST_ASSET_BASE];
  for (const base of bases) {
    try {
      const response = await fetch(`${base}/expression/exp.json`, { cache: 'no-cache' });
      if (!response.ok) continue;
      return { assetBase: base, data: await response.json() };
    } catch (_) {}
  }
  throw new Error('Failed to load exp.json from source or built assets.');
}

function renderLoading() {
  if (!root) return;
  root.innerHTML = '<main class="layer-debug"><section class="empty-state">Loading layer debug...</section></main>';
}

function renderError(message) {
  if (!root) return;
  root.innerHTML = '';
  root.append(el('main', { className: 'layer-debug' }, [
    el('section', { className: 'empty-state', text: message })
  ]));
}

function render() {
  if (!root) return;
  captureScrollState();
  root.replaceChildren(renderApp());
  restoreScrollState();
  syncUrl();
}

function renderApp() {
  return el('main', { className: 'layer-debug' }, [
    renderHeader(),
    el('div', { className: 'debug-divider' }),
    renderWorkspace()
  ]);
}

function renderHeader() {
  return el('header', { className: 'debug-header' }, [
    el('div', { className: 'title-block' }, [
      el('h1', { text: 'Layer Debug' }),
      el('div', { className: 'header-meta', text: `static app / ${assetBase}` })
    ]),
    el('div', { className: 'mode-tabs', attrs: { role: 'tablist' } }, [
      modeButton('base', 'Base'),
      modeButton('exp', 'Exp')
    ])
  ]);
}

function modeButton(mode, label) {
  const button = el('button', {
    className: `mode-tab${state.mode === mode ? ' is-active' : ''}`,
    text: label,
    attrs: { type: 'button', role: 'tab', 'aria-selected': String(state.mode === mode) }
  });
  button.addEventListener('click', () => {
    state.mode = mode;
    render();
  });
  return button;
}

function renderWorkspace() {
  return el('section', { className: 'debug-workspace' }, [
    renderPreviewPanel(),
    state.mode === 'base' ? renderBasePanel() : renderExpressionPanel()
  ]);
}

function renderPreviewPanel() {
  const expression = currentExpression();
  const layers = resolveLayers(state.outfit, expression);
  const stage = el('div', {
    className: 'preview-stage',
    attrs: { role: 'application', 'aria-label': 'draggable zoomable layer preview' }
  });
  const viewport = el('div', { className: 'canvas-viewport' });
  viewport.append(renderFigure(state.outfit, expression, layers));
  stage.append(
    el('div', { className: 'canvas-grid', attrs: { 'aria-hidden': 'true' } }),
    viewport,
    renderCanvasTools(stage, viewport)
  );
  bindCanvas(stage, viewport);
  applyTransform(viewport);

  return el('section', { className: 'preview-panel' }, [
    el('div', { className: 'panel-topline' }, [
      el('div', { className: 'panel-title', text: expression.name }),
      el('div', { className: 'panel-subtitle', text: state.outfit })
    ]),
    stage,
    renderTagSummary(expression),
    renderLayerStack(layers, expression)
  ]);
}

function renderCanvasTools(stage, viewport) {
  return el('div', { className: 'canvas-tools' }, [
    canvasButton('-', 'Zoom out', () => setZoom(state.zoom - ZOOM_STEP, viewport)),
    el('span', { className: 'zoom-readout', text: `${Math.round(state.zoom * 100)}%` }),
    canvasButton('+', 'Zoom in', () => setZoom(state.zoom + ZOOM_STEP, viewport)),
    canvasButton('1:1', 'Actual size', () => setZoom(1, viewport)),
    canvasButton('Fit', 'Fit to canvas', () => fitCanvas(stage, viewport))
  ]);
}

function canvasButton(label, title, onClick) {
  const button = el('button', {
    className: 'canvas-tool',
    text: label,
    attrs: { type: 'button', title, 'aria-label': title }
  });
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick();
    render();
  });
  return button;
}

function bindCanvas(stage, viewport) {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  stage.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button, select, input')) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    stage.classList.add('is-dragging');
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    state.panX += event.clientX - lastX;
    state.panY += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    applyTransform(viewport);
  });

  const stop = (event) => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    try {
      stage.releasePointerCapture(event.pointerId);
    } catch (_) {}
  };

  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setZoom(state.zoom + (event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), viewport);
    const readout = stage.querySelector('.zoom-readout');
    if (readout) readout.textContent = `${Math.round(state.zoom * 100)}%`;
  }, { passive: false });
}

function setZoom(zoom, viewport) {
  state.zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  applyTransform(viewport);
}

function fitCanvas(stage, viewport) {
  const stageRect = stage.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const unscaledWidth = viewportRect.width / state.zoom;
  const unscaledHeight = viewportRect.height / state.zoom;
  state.zoom = clamp(Math.min((stageRect.width * 0.78) / unscaledWidth, (stageRect.height * 0.78) / unscaledHeight), MIN_ZOOM, MAX_ZOOM);
  state.panX = 0;
  state.panY = 0;
  applyTransform(viewport);
}

function applyTransform(viewport) {
  viewport.style.transform = `translate(-50%, -50%) translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
}

function renderFigure(outfit, expression, layers) {
  const figure = el('div', {
    className: 'mama-standing mama-standing--layer-debug',
    attrs: {
      role: 'img',
      'aria-label': `Ena ${outfit} ${expression.name}`,
      'data-outfit': outfit,
      'data-expression': expression.name
    }
  });
  layers.forEach((layer) => {
    const image = document.createElement('img');
    image.className = `mama-standing__layer mama-standing__layer--${layer.kind.replace(/_/g, '-')}`;
    image.src = layer.url;
    image.alt = '';
    image.decoding = 'async';
    image.draggable = false;
    figure.append(image);
  });
  return figure;
}

function renderTagSummary(expression) {
  const tags = [
    `base:${state.outfit}`,
    `face:${expression.face}`,
    `mouth:${expression.mouth}`,
    `eye:${expression.eye}`,
    `brow:${expression.brow}`,
    ...otherTags(expression).map((name) => `other:${name}`),
    ...emotionTags(expression).map((name) => `emotion:${name}`),
    ...autoDiffTags(state.outfit, expression),
    ...(state.emotion !== 'none' ? [`debug:${state.emotion}`] : [])
  ];
  return el('div', { className: 'tag-summary' }, tags.map((tag) => el('span', {
    className: `tag${tag.startsWith('auto:') ? ' tag-auto' : ''}${tag.startsWith('emotion:') || tag.startsWith('debug:') ? ' tag-debug' : ''}`,
    text: tag
  })));
}

function renderLayerStack(layers, expression) {
  const stack = el('section', { className: 'layer-stack' }, [
    el('div', { className: 'stack-header' }, [
      el('span', { text: 'Resolved Stack' }),
      el('span'),
      el('span'),
      el('strong', { text: String(layers.length) })
    ])
  ]);

  layers.forEach((layer, index) => {
    stack.append(el('div', { className: 'layer-row' }, [
      el('span', { className: 'layer-order', text: String(index + 1).padStart(2, '0') }),
      el('div', { className: 'layer-main' }, [
        el('strong', { text: LABELS[layer.kind] || layer.kind }),
        el('span', { text: layer.asset })
      ]),
      el('span', { className: 'layer-source', text: layerSource(layer, expression) }),
      el('span', { className: 'layer-z', text: `z${Z_INDEX[layer.kind]}` })
    ]));
  });

  return stack;
}

function renderBasePanel() {
  return el('section', { className: 'browser-panel' }, [
    el('div', { className: 'toolbar' }, [
      el('div', { className: 'toolbar-title', text: 'Base Diff' }),
      el('div', { className: 'segmented-control' }, [
        moodButton('none', 'normal'),
        moodButton('shadow', 'shadow'),
        moodButton('pale', 'pale')
      ])
    ]),
    renderEmotionPanel(),
    el('div', { className: 'base-grid' }, OUTFITS.map(renderBaseCard))
  ]);
}

function captureScrollState() {
  const expressionList = root?.querySelector('.expression-list');
  const baseGrid = root?.querySelector('.base-grid');
  if (expressionList) expressionScrollTop = expressionList.scrollTop;
  if (baseGrid) baseScrollTop = baseGrid.scrollTop;
}

function restoreScrollState() {
  const expressionList = root?.querySelector('.expression-list');
  const baseGrid = root?.querySelector('.base-grid');
  if (expressionList) expressionList.scrollTop = expressionScrollTop;
  if (baseGrid) baseGrid.scrollTop = baseScrollTop;
}

function moodButton(mood, label) {
  const button = el('button', {
    className: `segment${state.mood === mood ? ' is-active' : ''}`,
    text: label,
    attrs: { type: 'button', 'aria-pressed': String(state.mood === mood) }
  });
  button.addEventListener('click', () => {
    state.mood = mood;
    render();
  });
  return button;
}

function renderEmotionPanel() {
  return el('section', { className: 'emotion-debug' }, [
    el('div', { className: 'emotion-debug-head' }, [
      el('strong', { text: 'Emotion' }),
      el('span', { text: state.emotion === 'none' ? 'none' : state.emotion })
    ]),
    el('div', { className: 'emotion-grid' }, ['none', ...EMOTION_ASSETS].map(renderEmotionButton))
  ]);
}

function renderEmotionButton(emotion) {
  const button = el('button', {
    className: `emotion-button${state.emotion === emotion ? ' is-selected' : ''}`,
    text: emotion === 'none' ? 'none' : emotion.replace(/^Emotion_/, ''),
    attrs: {
      type: 'button',
      title: emotion,
      'aria-pressed': String(state.emotion === emotion)
    }
  });
  button.addEventListener('click', () => {
    state.emotion = emotion;
    render();
  });
  return button;
}

function renderBaseCard(outfit) {
  const image = document.createElement('img');
  image.src = assetUrl('base', outfit);
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;
  const button = el('button', {
    className: `base-card${state.outfit === outfit ? ' is-selected' : ''}`,
    attrs: { type: 'button', 'aria-pressed': String(state.outfit === outfit) }
  }, [
    el('span', { className: 'base-thumb' }, [image]),
    el('strong', { text: outfit }),
    el('span', { className: 'base-diff-line' }, [
      miniTag(SPECIAL_BASES.has(outfit) ? 'special' : 'standard'),
      miniTag(moodUnder(outfit, 'shadow')),
      miniTag(moodUnder(outfit, 'pale'))
    ])
  ]);
  button.addEventListener('click', () => {
    state.outfit = outfit;
    render();
  });
  return button;
}

function renderExpressionPanel() {
  const filtered = expressions.filter((expression) => matchesQuery(expression, state.query));
  return el('section', { className: 'browser-panel' }, [
    el('div', { className: 'toolbar' }, [
      el('div', { className: 'toolbar-title', text: 'Exp Presets' }),
      el('div', { className: 'toolbar-controls' }, [renderOutfitSelect(), renderSearch()])
    ]),
    renderEmotionPanel(),
    el('div', { className: 'expression-list' }, filtered.length ? filtered.map(renderExpressionRow) : [
      el('div', { className: 'empty-state', text: 'No presets' })
    ])
  ]);
}

function renderOutfitSelect() {
  const select = document.createElement('select');
  select.className = 'outfit-select';
  select.setAttribute('aria-label', 'preview base');
  OUTFITS.forEach((outfit) => {
    const option = document.createElement('option');
    option.value = outfit;
    option.textContent = outfit;
    option.selected = outfit === state.outfit;
    select.append(option);
  });
  select.addEventListener('change', () => {
    state.outfit = select.value;
    render();
  });
  return select;
}

function renderSearch() {
  const input = document.createElement('input');
  input.className = 'search-input';
  input.type = 'search';
  input.placeholder = 'filter tags';
  input.value = state.query;
  input.addEventListener('input', () => {
    state.query = input.value;
    render();
  });
  return input;
}

function renderExpressionRow(expression) {
  const button = el('button', {
    className: `expression-row${state.expression === expression.name ? ' is-selected' : ''}`,
    attrs: { type: 'button', 'aria-pressed': String(state.expression === expression.name) }
  }, [
    el('span', { className: 'exp-id', text: `#${expression.id}` }),
    el('span', { className: 'exp-main' }, [
      el('strong', { text: expression.name }),
      el('span', { className: 'exp-chips' }, [
        ...expressionTags(expression).map(miniTag),
        ...autoDiffTags(state.outfit, expression).map(miniTag)
      ])
    ])
  ]);
  button.addEventListener('click', () => {
    state.expression = expression.name;
    render();
  });
  return button;
}

function miniTag(text) {
  return el('span', { className: 'mini-tag', text });
}

function currentExpression() {
  if (state.mode === 'base') {
    const face = state.mood === 'shadow' ? 'face_shadow' : state.mood === 'pale' ? 'face_pale' : 'face_default';
    return {
      id: 0,
      name: `debug_${face}`,
      face,
      mouth: 'mouth_neutral',
      eye: 'eye_normal',
      brow: 'brow_normal'
    };
  }
  return expressionMap.get(state.expression) || expressionMap.get(DEFAULT_EXPRESSION) || expressions[0];
}

function resolveLayers(outfit, expression) {
  const mood = expression.face === 'face_shadow' ? 'shadow' : expression.face === 'face_pale' ? 'pale' : '';
  const layers = [
    layer('face_fx', 'face', 'face_default'),
    expression.face !== 'face_default' ? layer('face_fx', 'face', expression.face) : null,
    layer('mouth', 'mouth', expression.mouth || 'mouth_neutral'),
    ...otherTags(expression).map((name) => layer('expression_other', 'other', name)),
    layer('base', 'base', outfit || DEFAULT_OUTFIT),
    layer('eyes', 'eye', expression.eye || 'eye_normal'),
    mood ? layer('mood_under', 'other', moodUnder(outfit, mood)) : null,
    layer('brow', 'brow', expression.brow || 'brow_normal'),
    mood ? layer('mood_top', 'other', `${mood}_1`) : null,
    ...emotionTags(expression).map((name) => layer('emotion', 'emotion', name)),
    state.emotion !== 'none' ? layer('emotion', 'emotion', state.emotion) : null
  ];
  return layers.filter(Boolean);
}

function layer(kind, group, name) {
  return {
    kind,
    group,
    name,
    asset: `${group}/${name}`,
    url: assetUrl(group, name)
  };
}

function assetUrl(group, name) {
  return `${assetBase}/${FOLDERS[group]}/${encodeURIComponent(name)}.png`;
}

function otherTags(expression) {
  return Array.isArray(expression.other) ? expression.other : expression.other ? [expression.other] : [];
}

function emotionTags(expression) {
  return Array.isArray(expression.emotion) ? expression.emotion : expression.emotion ? [expression.emotion] : [];
}

function expressionTags(expression) {
  return [expression.face, expression.mouth, expression.eye, expression.brow, ...otherTags(expression), ...emotionTags(expression)];
}

function autoDiffTags(outfit, expression) {
  const mood = expression.face === 'face_shadow' ? 'shadow' : expression.face === 'face_pale' ? 'pale' : '';
  return mood ? [`auto:${moodUnder(outfit, mood)}`, `auto:${mood}_1`] : [];
}

function moodUnder(outfit, mood) {
  return `${mood}_${SPECIAL_BASES.has(outfit) ? '3' : '2'}`;
}

function layerSource(layer, expression) {
  if (layer.kind === 'face_fx') return layer.name === 'face_default' ? 'default' : 'exp.face';
  if (layer.kind === 'mouth') return 'exp.mouth';
  if (layer.kind === 'expression_other') return 'exp.other';
  if (layer.kind === 'base') return 'base';
  if (layer.kind === 'eyes') return 'exp.eye';
  if (layer.kind === 'brow') return 'exp.brow';
  if (layer.kind === 'mood_under' || layer.kind === 'mood_top') return expression.face === 'face_pale' ? 'auto pale' : 'auto shadow';
  if (layer.kind === 'emotion') return emotionTags(expression).includes(layer.name) ? 'exp.emotion' : 'debug emotion';
  return 'layer';
}

function matchesQuery(expression, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [expression.name, ...expressionTags(expression)]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

function readParam(key) {
  return new URLSearchParams(location.search).get(key) || '';
}

function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set('mode', state.mode);
  url.searchParams.set('outfit', state.outfit);
  if (state.emotion !== 'none') url.searchParams.set('emotion', state.emotion);
  else url.searchParams.delete('emotion');
  if (state.mode === 'exp') url.searchParams.set('expression', state.expression);
  else url.searchParams.delete('expression');
  if (state.mode === 'base' && state.mood !== 'none') url.searchParams.set('mood', state.mood);
  else url.searchParams.delete('mood');
  if (state.query) url.searchParams.set('q', state.query);
  else url.searchParams.delete('q');
  history.replaceState(null, '', url.href);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([name, value]) => node.setAttribute(name, value));
  }
  children.filter(Boolean).forEach((child) => node.append(child));
  return node;
}
