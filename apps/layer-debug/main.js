const SOURCE_ASSET_BASE = '../../src/assets/png/standing';
const DIST_ASSET_BASE = '../../mama-assets/standing';
const DEFAULT_EXPRESSION = 'exp_smile_soft';
const DEFAULT_OUTFIT = 'streetwear_full';
const DEFAULT_ZOOM = 0.82;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.5;
const ZOOM_STEP = 0.14;
const SPECIAL_BASES = new Set(['nephilim', 'seraphim']);
const EMOTION_LAYER_RANK = {
  Emotion_HeartBurst: 10,
  Emotion_HeartBubble: 20
};
const FALLBACK_DEFAULTS = {
  face: 'face_default',
  mouth: 'mouth_neutral',
  eye: 'eye_normal',
  brow: 'brow_normal'
};
const EXPLICIT_COMPONENT_PRIORITY = 90;
const VISUAL_KEYWORD_PRIORITY = 50;
const SECONDARY_KEYWORD_PRIORITY = 40;
const EMOTION_KEYWORD_PRIORITY = 30;
const OUTFITS = [
  'streetwear_full',
  'streetwear_inner',
  'school_uniform',
  'outfit_winter',
  'outfit_gym',
  'outfit_maid_jersey',
  'nightwear',
  'outfit_swimsuit',
  'outfit_yukata',
  'underwear',
  'nude',
  'seraphim',
  'nephilim'
];
const EMOTION_ASSETS = [
  'Emotion_Amazed',
  'Emotion_Angry',
  'Emotion_Cloud',
  'Emotion_Confusion',
  'Emotion_Curiosity',
  'Emotion_Distress',
  'Emotion_Excited',
  'Emotion_Fearful',
  'Emotion_Glee',
  'Emotion_Heart',
  'Emotion_HeartBubble',
  'Emotion_HeartBurst',
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
let fallbackAssets = null;
let expressionScrollTop = 0;
let baseScrollTop = 0;

boot();

async function boot() {
  renderLoading();
  try {
    const loaded = await loadExpressionData();
    assetBase = loaded.assetBase;
    expressions = sortExpressionsById(loaded.data.expressions || []);
    expressionMap = new Map(expressions.map((expression) => [expression.name, expression]));
    fallbackAssets = buildFallbackAssets(expressions);
    state.outfit = OUTFITS.includes(state.outfit) ? state.outfit : DEFAULT_OUTFIT;
    state.expression = resolveExpression(state.expression).name;
    render();
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  }
}

async function loadExpressionData() {
  const bases = [SOURCE_ASSET_BASE, DIST_ASSET_BASE];
  for (const base of bases) {
    try {
      const cacheBust = `v=${Date.now()}`;
      const response = await fetch(`${base}/expression/exp.json?${cacheBust}`, { cache: 'reload' });
      if (!response.ok) continue;
      return { assetBase: base, data: await response.json() };
    } catch (_) {}
  }
  throw new Error('Failed to load exp.json from source or built assets.');
}

function sortExpressionsById(items) {
  return [...items].sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
}

function buildFallbackAssets(items) {
  const refs = {
    face: new Set(['face_default', 'face_pale', 'face_shadow', 'face_blush_light', 'face_blush_heavy']),
    mouth: new Set(['mouth_neutral']),
    eye: new Set(['eye_normal']),
    brow: new Set(['brow_normal']),
    other: new Set(['sweat', 'mist']),
    emotion: new Set(EMOTION_ASSETS)
  };
  items.forEach((expression) => {
    refs.face.add(expression.face);
    refs.mouth.add(expression.mouth);
    refs.eye.add(expression.eye);
    refs.brow.add(expression.brow);
    otherTags(expression).forEach((name) => refs.other.add(name));
    emotionTags(expression).forEach((name) => refs.emotion.add(name));
  });
  return Object.fromEntries(Object.entries(refs).map(([key, value]) => [key, [...value].filter(Boolean)]));
}

function resolveExpression(value) {
  const requested = readExpressionName(value);
  if (!requested) return defaultExpression();

  const exact = findExactExpression(requested);
  if (exact) return exact;

  const canonical = canonicalizeExpressionName(requested);
  const normalized = expressions.find((expression) => canonicalizeExpressionName(expression.name) === canonical);
  if (normalized) return normalized;

  const typo = findTypoExpression(canonical);
  if (typo) return typo;

  const synthetic = buildSyntheticExpression(requested, canonical);
  return synthetic || defaultExpression();
}

function readExpressionName(value) {
  if (value && typeof value === 'object' && typeof value.name === 'string') return normalizeExpressionText(value.name);
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return normalizeExpressionText(String(value));
}

function normalizeExpressionText(value) {
  let text = value.trim();
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'string' || typeof parsed === 'number') text = String(parsed).trim();
  } catch (_) {}
  return text.replace(/<\/?ena-exp>/gi, '').replace(/^["'`]+|["'`]+$/g, '').trim();
}

function canonicalizeExpressionName(value) {
  return normalizeExpressionText(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(exp_)+/, '');
}

function canonicalizeAssetName(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function findExactExpression(requested) {
  const byId = Number(requested);
  if (Number.isFinite(byId)) return expressions.find((expression) => expression.id === Math.round(byId)) || null;
  return expressionMap.get(requested) || null;
}

function findTypoExpression(canonical) {
  if (canonical.length < 5) return null;
  const ranked = expressions
    .map((expression) => ({ expression, distance: levenshtein(canonical, canonicalizeExpressionName(expression.name)) }))
    .sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;
  const allowed = best.distance <= 1 || (canonical.length >= 8 && best.distance <= 2);
  const uniqueBest = !second || second.distance > best.distance;
  return allowed && uniqueBest ? best.expression : null;
}

function buildSyntheticExpression(sourceName, canonical) {
  const tokens = canonical.split('_').filter(Boolean);
  if (!tokens.length || !fallbackAssets) return null;

  const rules = buildKeywordRules();
  const slots = {
    face: { value: FALLBACK_DEFAULTS.face, priority: 0, order: -1 },
    mouth: { value: FALLBACK_DEFAULTS.mouth, priority: 0, order: -1 },
    eye: { value: FALLBACK_DEFAULTS.eye, priority: 0, order: -1 },
    brow: { value: FALLBACK_DEFAULTS.brow, priority: 0, order: -1 }
  };
  const listSlots = { other: [], emotion: [] };
  const matchedTokens = [];
  const matchedIndexes = new Set();
  let order = 0;

  for (let index = 0; index < tokens.length;) {
    const match = findRuleMatch(tokens, index, rules);
    if (!match) {
      index += 1;
      continue;
    }
    matchedTokens.push(match.alias);
    for (let offset = 0; offset < match.length; offset += 1) matchedIndexes.add(index + offset);
    match.effects.forEach((effect) => applyKeywordEffect(effect, slots, listSlots, order));
    order += 1;
    index += match.length;
  }

  if (!matchedTokens.length) return null;
  const expression = {
    id: 0,
    name: `exp_${canonical}`,
    face: slots.face.value,
    mouth: slots.mouth.value,
    eye: slots.eye.value,
    brow: slots.brow.value,
    synthetic: true,
    sourceName,
    matchedTokens: unique(matchedTokens),
    unmatchedTokens: unique(tokens.filter((_, index) => !matchedIndexes.has(index)))
  };
  if (listSlots.other.length) expression.other = listSlots.other;
  if (listSlots.emotion.length) expression.emotion = listSlots.emotion;
  return expression;
}

function buildKeywordRules() {
  const rules = new Map();
  addExplicitAssetRules(rules, 'face', 'face_', fallbackAssets.face);
  addExplicitAssetRules(rules, 'mouth', 'mouth_', fallbackAssets.mouth);
  addExplicitAssetRules(rules, 'eye', 'eye_', fallbackAssets.eye);
  addExplicitAssetRules(rules, 'brow', 'brow_', fallbackAssets.brow);
  addExplicitAssetRules(rules, 'other', '', fallbackAssets.other);
  addExplicitAssetRules(rules, 'emotion', 'Emotion_', fallbackAssets.emotion);

  addRuleIfAvailable(rules, 'jitome', [{ slot: 'eye', value: 'eye_jitome', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'pout', [
    { slot: 'mouth', value: 'mouth_pout_2', priority: VISUAL_KEYWORD_PRIORITY },
    { slot: 'brow', value: 'brow_up_max', priority: SECONDARY_KEYWORD_PRIORITY }
  ]);
  addRuleIfAvailable(rules, 'smile', [{ slot: 'mouth', value: 'mouth_smile', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'smirk', [{ slot: 'mouth', value: 'mouth_smirk_1', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'laugh', [{ slot: 'mouth', value: 'mouth_laugh', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'cat', [{ slot: 'mouth', value: 'mouth_cat', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'huh', [{ slot: 'mouth', value: 'mouth_huh', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'drool', [{ slot: 'mouth', value: 'mouth_drool', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'chu', [{ slot: 'mouth', value: 'mouth_chu', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'shock', [{ slot: 'mouth', value: 'mouth_shock', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'panic', [{ slot: 'mouth', value: 'mouth_panic_open', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'awawa', [{ slot: 'mouth', value: 'mouth_awawa', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'tremble', [{ slot: 'mouth', value: 'mouth_tremble_1', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'blank', [{ slot: 'mouth', value: 'mouth_blank_1', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'fang', [{ slot: 'mouth', value: 'mouth_fang_open', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'tongue', [{ slot: 'mouth', value: 'mouth_tongue_2', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'neutral', [{ slot: 'mouth', value: 'mouth_neutral', priority: SECONDARY_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, 'closed', [{ slot: 'eye', value: 'eye_closed_1', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'wink', [{ slot: 'eye', value: 'eye_wink_2', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'line', [{ slot: 'eye', value: 'eye_line', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'slit', [{ slot: 'eye', value: 'eye_slit', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'drowsy', [
    { slot: 'eye', value: 'eye_slit', priority: VISUAL_KEYWORD_PRIORITY },
    { slot: 'emotion', value: 'Emotion_Sleepy', priority: EMOTION_KEYWORD_PRIORITY }
  ]);
  addRuleIfAvailable(rules, 'star', [
    { slot: 'eye', value: 'eye_star', priority: VISUAL_KEYWORD_PRIORITY },
    { slot: 'emotion', value: 'Emotion_Star', priority: EMOTION_KEYWORD_PRIORITY }
  ]);
  addRuleIfAvailable(rules, 'heart', [
    { slot: 'eye', value: 'eye_heart', priority: VISUAL_KEYWORD_PRIORITY },
    { slot: 'emotion', value: 'Emotion_Heart', priority: EMOTION_KEYWORD_PRIORITY }
  ]);
  addRuleIfAvailable(rules, 'xd', [{ slot: 'eye', value: 'eye_xd', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'wide', [{ slot: 'eye', value: 'eye_wide', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'cry', [{ slot: 'eye', value: 'eye_cry_2', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'dizzy', [{ slot: 'eye', value: 'eye_dizzy_2', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'puppy', [{ slot: 'eye', value: 'eye_puppy', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'dark', [{ slot: 'eye', value: 'eye_dark', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'disgust', [{ slot: 'eye', value: 'eye_disgust', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'roll', [{ slot: 'eye', value: 'eye_roll', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'avert', [{ slot: 'eye', value: 'eye_avert', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'half', [{ slot: 'eye', value: 'eye_half_1', priority: SECONDARY_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, 'up', [{ slot: 'brow', value: 'brow_up', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'down', [{ slot: 'brow', value: 'brow_down', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'up_max', [{ slot: 'brow', value: 'brow_up_max', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'down_max', [{ slot: 'brow', value: 'brow_down_max', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'question', [{ slot: 'brow', value: 'brow_question', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'normal', [{ slot: 'brow', value: 'brow_normal', priority: SECONDARY_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, 'default', [{ slot: 'face', value: 'face_default', priority: SECONDARY_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'shadow', [{ slot: 'face', value: 'face_shadow', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'pale', [{ slot: 'face', value: 'face_pale', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'blush', [{ slot: 'face', value: 'face_blush_light', priority: SECONDARY_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'heavy', [{ slot: 'face', value: 'face_blush_heavy', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'light', [{ slot: 'face', value: 'face_blush_light', priority: VISUAL_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, 'sweat', [{ slot: 'other', value: 'sweat', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'mist', [{ slot: 'other', value: 'mist', priority: VISUAL_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, 'angry', [{ slot: 'emotion', value: 'Emotion_Angry', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'sleepy', [{ slot: 'emotion', value: 'Emotion_Sleepy', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'sparkle', [{ slot: 'emotion', value: 'Emotion_Sparkle', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'confusion', [{ slot: 'emotion', value: 'Emotion_Confusion', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'confused', [{ slot: 'emotion', value: 'Emotion_Confusion', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'fearful', [{ slot: 'emotion', value: 'Emotion_Fearful', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'surprise', [{ slot: 'emotion', value: 'Emotion_Surprise', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'cloud', [{ slot: 'emotion', value: 'Emotion_Cloud', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'heartbubble', [{ slot: 'emotion', value: 'Emotion_HeartBubble', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'heart_bubble', [{ slot: 'emotion', value: 'Emotion_HeartBubble', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'heartburst', [{ slot: 'emotion', value: 'Emotion_HeartBurst', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'heart_burst', [{ slot: 'emotion', value: 'Emotion_HeartBurst', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, 'zzz', [{ slot: 'emotion', value: 'Emotion_zzz', priority: EMOTION_KEYWORD_PRIORITY }]);
  return rules;
}

function addExplicitAssetRules(rules, slot, prefix, names) {
  names.forEach((name) => {
    const canonical = canonicalizeAssetName(name);
    const stripped = prefix ? canonicalizeAssetName(name.replace(new RegExp(`^${prefix}`, 'i'), '')) : canonical;
    const effect = { slot, value: name, priority: EXPLICIT_COMPONENT_PRIORITY };
    addRule(rules, canonical, [effect]);
    addRule(rules, stripped, [effect]);
  });
}

function addRuleIfAvailable(rules, alias, effects) {
  const available = effects.filter((effect) => fallbackAssets[effect.slot]?.includes(effect.value));
  if (available.length) addRule(rules, alias, available);
}

function addRule(rules, alias, effects) {
  const canonical = canonicalizeAssetName(alias);
  if (!canonical) return;
  unique([canonical, canonical.replace(/_/g, '')]).forEach((item) => {
    rules.set(item, [...(rules.get(item) || []), ...effects]);
  });
}

function findRuleMatch(tokens, index, rules) {
  const maxLength = Math.min(4, tokens.length - index);
  for (let length = maxLength; length >= 1; length -= 1) {
    const alias = tokens.slice(index, index + length).join('_');
    const effects = rules.get(alias);
    if (effects) return { alias, effects, length };
  }
  const fuzzyAlias = findFuzzyRuleAlias(tokens[index], rules);
  const fuzzyEffects = fuzzyAlias ? rules.get(fuzzyAlias) : null;
  return fuzzyAlias && fuzzyEffects ? { alias: fuzzyAlias, effects: fuzzyEffects, length: 1 } : null;
}

function findFuzzyRuleAlias(token, rules) {
  if (token.length < 4) return null;
  const ranked = [...rules.keys()]
    .filter((alias) => !alias.includes('_') && alias.length >= 4)
    .map((alias) => ({ alias, distance: levenshtein(token, alias) }))
    .sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;
  const allowed = best.distance <= 1 || (token.length >= 6 && best.distance <= 2);
  const uniqueBest = !second || second.distance > best.distance;
  return allowed && uniqueBest ? best.alias : null;
}

function applyKeywordEffect(effect, slots, listSlots, order) {
  if (effect.slot === 'other' || effect.slot === 'emotion') {
    if (!listSlots[effect.slot].includes(effect.value)) listSlots[effect.slot].push(effect.value);
    return;
  }
  const current = slots[effect.slot];
  if (effect.priority > current.priority || (effect.priority === current.priority && order >= current.order)) {
    slots[effect.slot] = { value: effect.value, priority: effect.priority, order };
  }
}

function defaultExpression() {
  return expressionMap.get(DEFAULT_EXPRESSION) || expressions[0];
}

function levenshtein(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);
  for (let row = 1; row <= a.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + cost);
    }
    for (let column = 0; column <= b.length; column += 1) previous[column] = current[column];
  }
  return previous[b.length];
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
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
    ...(expression.nsfw ? ['nsfw'] : []),
    ...(expression.synthetic ? [
      'fallback:synthetic',
      expression.sourceName ? `source:${expression.sourceName}` : '',
      ...(expression.matchedTokens || []).map((name) => `match:${name}`),
      ...(expression.unmatchedTokens || []).map((name) => `miss:${name}`)
    ] : []),
    ...otherTags(expression).map((name) => `other:${name}`),
    ...emotionTags(expression).map((name) => `emotion:${name}`),
    ...autoDiffTags(state.outfit, expression),
    ...(state.emotion !== 'none' ? [`debug:${state.emotion}`] : [])
  ];
  return el('div', { className: 'tag-summary' }, tags.filter(Boolean).map((tag) => {
    const debugTag = tag.startsWith('emotion:')
      || tag.startsWith('debug:')
      || tag.startsWith('fallback:')
      || tag.startsWith('source:')
      || tag.startsWith('match:');
    return el('span', {
      className: `tag${tag.startsWith('auto:') || tag.startsWith('miss:') ? ' tag-auto' : ''}${debugTag ? ' tag-debug' : ''}`,
      text: tag
    });
  }));
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
  const title = state.query
    ? `Exp Presets · ${filtered.length}/${expressions.length}`
    : `Exp Presets · ${expressions.length}`;
  return el('section', { className: 'browser-panel' }, [
    el('div', { className: 'toolbar' }, [
      el('div', { className: 'toolbar-title', text: title }),
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
  return resolveExpression(state.expression);
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
  const names = Array.isArray(expression.emotion) ? expression.emotion : expression.emotion ? [expression.emotion] : [];
  return sortEmotionLayerNames(names);
}

function sortEmotionLayerNames(names) {
  return names
    .map((name, index) => ({ name, index }))
    .sort((a, b) => (EMOTION_LAYER_RANK[a.name] || 0) - (EMOTION_LAYER_RANK[b.name] || 0) || a.index - b.index)
    .map((item) => item.name);
}

function expressionTags(expression) {
  return [
    expression.face,
    expression.mouth,
    expression.eye,
    expression.brow,
    ...(expression.nsfw ? ['nsfw'] : []),
    ...(expression.synthetic ? ['synthetic', expression.sourceName || '', ...(expression.matchedTokens || []), ...(expression.unmatchedTokens || [])] : []),
    ...otherTags(expression),
    ...emotionTags(expression)
  ];
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
