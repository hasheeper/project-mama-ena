export interface ExpressionLayerRef {
  id: number;
  name: string;
  face: string;
  mouth: string;
  eye: string;
  brow: string;
  nsfw?: boolean;
  synthetic?: true;
  sourceName?: string;
  matchedTokens?: string[];
  unmatchedTokens?: string[];
  other?: string | string[];
  emotion?: string | string[];
}

export interface ExpressionFallbackAssets {
  face: readonly string[];
  mouth: readonly string[];
  eye: readonly string[];
  brow: readonly string[];
  other: readonly string[];
  emotion: readonly string[];
}

type SingularSlot = 'face' | 'mouth' | 'eye' | 'brow';
type ListSlot = 'other' | 'emotion';
type ExpressionSlot = SingularSlot | ListSlot;

interface KeywordEffect {
  slot: ExpressionSlot;
  value: string;
  priority: number;
}

interface SlotState {
  value: string;
  priority: number;
  order: number;
}

const DEFAULT_SYNTHETIC_EXPRESSION = {
  face: 'face_default',
  mouth: 'mouth_neutral',
  eye: 'eye_normal',
  brow: 'brow_normal'
} as const;

const EXPLICIT_COMPONENT_PRIORITY = 90;
const VISUAL_KEYWORD_PRIORITY = 50;
const SECONDARY_KEYWORD_PRIORITY = 40;
const EMOTION_KEYWORD_PRIORITY = 30;

export function resolveExpressionWithFallback(
  value: unknown,
  expressions: readonly ExpressionLayerRef[],
  defaultExpression: string,
  assets: ExpressionFallbackAssets
): ExpressionLayerRef {
  const requested = readExpressionName(value);
  if (!requested) return resolveDefaultExpression(expressions, defaultExpression);

  const exact = findExactExpression(requested, expressions);
  if (exact) return exact;

  const canonical = canonicalizeExpressionName(requested);
  const normalized = findNormalizedExpression(canonical, expressions);
  if (normalized) return normalized;

  const typo = findTypoExpression(canonical, expressions);
  if (typo) return typo;

  const synthetic = buildSyntheticExpression(requested, canonical, assets);
  if (synthetic) return synthetic;

  return resolveDefaultExpression(expressions, defaultExpression);
}

export function readExpressionName(value: unknown): string {
  if (isExpressionObject(value)) return normalizeExpressionText(value.name);
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return normalizeExpressionText(String(value));
}

export function canonicalizeExpressionName(value: string): string {
  return normalizeExpressionText(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(exp_)+/, '');
}

function normalizeExpressionText(value: string): string {
  let text = value.trim();
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === 'string' || typeof parsed === 'number') text = String(parsed).trim();
  } catch (_) {}
  return text
    .replace(/<\/?ena-exp>/gi, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

function isExpressionObject(value: unknown): value is { name: string } {
  return Boolean(value && typeof value === 'object' && typeof (value as { name?: unknown }).name === 'string');
}

function findExactExpression(requested: string, expressions: readonly ExpressionLayerRef[]): ExpressionLayerRef | null {
  const byId = Number(requested);
  if (Number.isFinite(byId)) {
    return expressions.find((expression) => expression.id === Math.round(byId)) || null;
  }
  return expressions.find((expression) => expression.name === requested) || null;
}

function findNormalizedExpression(canonical: string, expressions: readonly ExpressionLayerRef[]): ExpressionLayerRef | null {
  if (!canonical) return null;
  return expressions.find((expression) => canonicalizeExpressionName(expression.name) === canonical) || null;
}

function findTypoExpression(canonical: string, expressions: readonly ExpressionLayerRef[]): ExpressionLayerRef | null {
  if (canonical.length < 5) return null;
  const ranked = expressions
    .map((expression) => ({
      expression,
      distance: levenshteinDistance(canonical, canonicalizeExpressionName(expression.name))
    }))
    .sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;

  const allowed = best.distance <= 1 || (canonical.length >= 8 && best.distance <= 2);
  const unique = !second || second.distance > best.distance;
  return allowed && unique ? best.expression : null;
}

function buildSyntheticExpression(
  sourceName: string,
  canonical: string,
  assets: ExpressionFallbackAssets
): ExpressionLayerRef | null {
  const tokens = canonical.split('_').filter(Boolean);
  if (!tokens.length) return null;

  const rules = buildKeywordRuleMap(assets);
  const slots: Record<SingularSlot, SlotState> = {
    face: { value: DEFAULT_SYNTHETIC_EXPRESSION.face, priority: 0, order: -1 },
    mouth: { value: DEFAULT_SYNTHETIC_EXPRESSION.mouth, priority: 0, order: -1 },
    eye: { value: DEFAULT_SYNTHETIC_EXPRESSION.eye, priority: 0, order: -1 },
    brow: { value: DEFAULT_SYNTHETIC_EXPRESSION.brow, priority: 0, order: -1 }
  };
  const listSlots: Record<ListSlot, string[]> = { other: [], emotion: [] };
  const matchedTokens: string[] = [];
  const matchedIndexes = new Set<number>();
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

  const expression: ExpressionLayerRef = {
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

function applyKeywordEffect(
  effect: KeywordEffect,
  slots: Record<SingularSlot, SlotState>,
  listSlots: Record<ListSlot, string[]>,
  order: number
): void {
  if (effect.slot === 'other' || effect.slot === 'emotion') {
    const values = listSlots[effect.slot];
    if (!values.includes(effect.value)) values.push(effect.value);
    return;
  }

  const current = slots[effect.slot];
  if (effect.priority > current.priority || (effect.priority === current.priority && order >= current.order)) {
    slots[effect.slot] = { value: effect.value, priority: effect.priority, order };
  }
}

function buildKeywordRuleMap(assets: ExpressionFallbackAssets): Map<string, KeywordEffect[]> {
  const rules = new Map<string, KeywordEffect[]>();
  addExplicitAssetRules(rules, 'face', 'face_', assets.face);
  addExplicitAssetRules(rules, 'mouth', 'mouth_', assets.mouth);
  addExplicitAssetRules(rules, 'eye', 'eye_', assets.eye);
  addExplicitAssetRules(rules, 'brow', 'brow_', assets.brow);
  addExplicitAssetRules(rules, 'other', '', assets.other);
  addExplicitAssetRules(rules, 'emotion', 'Emotion_', assets.emotion);

  addRuleIfAvailable(rules, assets, 'jitome', [{ slot: 'eye', value: 'eye_jitome', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'pout', [
    { slot: 'mouth', value: 'mouth_pout_2', priority: VISUAL_KEYWORD_PRIORITY },
    { slot: 'brow', value: 'brow_up_max', priority: SECONDARY_KEYWORD_PRIORITY }
  ]);
  addRuleIfAvailable(rules, assets, 'smile', [{ slot: 'mouth', value: 'mouth_smile', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'smirk', [{ slot: 'mouth', value: 'mouth_smirk_1', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'laugh', [{ slot: 'mouth', value: 'mouth_laugh', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'cat', [{ slot: 'mouth', value: 'mouth_cat', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'huh', [{ slot: 'mouth', value: 'mouth_huh', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'drool', [{ slot: 'mouth', value: 'mouth_drool', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'chu', [{ slot: 'mouth', value: 'mouth_chu', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'shock', [{ slot: 'mouth', value: 'mouth_shock', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'panic', [{ slot: 'mouth', value: 'mouth_panic_open', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'awawa', [{ slot: 'mouth', value: 'mouth_awawa', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'tremble', [{ slot: 'mouth', value: 'mouth_tremble_1', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'blank', [{ slot: 'mouth', value: 'mouth_blank_1', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'fang', [{ slot: 'mouth', value: 'mouth_fang_open', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'tongue', [{ slot: 'mouth', value: 'mouth_tongue_2', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'neutral', [{ slot: 'mouth', value: 'mouth_neutral', priority: SECONDARY_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, assets, 'closed', [{ slot: 'eye', value: 'eye_closed_1', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'wink', [{ slot: 'eye', value: 'eye_wink_2', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'line', [{ slot: 'eye', value: 'eye_line', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'slit', [{ slot: 'eye', value: 'eye_slit', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'drowsy', [
    { slot: 'eye', value: 'eye_slit', priority: VISUAL_KEYWORD_PRIORITY },
    { slot: 'emotion', value: 'Emotion_Sleepy', priority: EMOTION_KEYWORD_PRIORITY }
  ]);
  addRuleIfAvailable(rules, assets, 'star', [
    { slot: 'eye', value: 'eye_star', priority: VISUAL_KEYWORD_PRIORITY },
    { slot: 'emotion', value: 'Emotion_Star', priority: EMOTION_KEYWORD_PRIORITY }
  ]);
  addRuleIfAvailable(rules, assets, 'heart', [
    { slot: 'eye', value: 'eye_heart', priority: VISUAL_KEYWORD_PRIORITY },
    { slot: 'emotion', value: 'Emotion_Heart', priority: EMOTION_KEYWORD_PRIORITY }
  ]);
  addRuleIfAvailable(rules, assets, 'xd', [{ slot: 'eye', value: 'eye_xd', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'wide', [{ slot: 'eye', value: 'eye_wide', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'cry', [{ slot: 'eye', value: 'eye_cry_2', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'dizzy', [{ slot: 'eye', value: 'eye_dizzy_2', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'puppy', [{ slot: 'eye', value: 'eye_puppy', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'dark', [{ slot: 'eye', value: 'eye_dark', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'disgust', [{ slot: 'eye', value: 'eye_disgust', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'roll', [{ slot: 'eye', value: 'eye_roll', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'avert', [{ slot: 'eye', value: 'eye_avert', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'half', [{ slot: 'eye', value: 'eye_half_1', priority: SECONDARY_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, assets, 'up', [{ slot: 'brow', value: 'brow_up', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'down', [{ slot: 'brow', value: 'brow_down', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'up_max', [{ slot: 'brow', value: 'brow_up_max', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'down_max', [{ slot: 'brow', value: 'brow_down_max', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'question', [{ slot: 'brow', value: 'brow_question', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'normal', [{ slot: 'brow', value: 'brow_normal', priority: SECONDARY_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, assets, 'default', [{ slot: 'face', value: 'face_default', priority: SECONDARY_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'shadow', [{ slot: 'face', value: 'face_shadow', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'pale', [{ slot: 'face', value: 'face_pale', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'blush', [{ slot: 'face', value: 'face_blush_light', priority: SECONDARY_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'heavy', [{ slot: 'face', value: 'face_blush_heavy', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'light', [{ slot: 'face', value: 'face_blush_light', priority: VISUAL_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, assets, 'sweat', [{ slot: 'other', value: 'sweat', priority: VISUAL_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'mist', [{ slot: 'other', value: 'mist', priority: VISUAL_KEYWORD_PRIORITY }]);

  addRuleIfAvailable(rules, assets, 'angry', [{ slot: 'emotion', value: 'Emotion_Angry', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'sleepy', [{ slot: 'emotion', value: 'Emotion_Sleepy', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'sparkle', [{ slot: 'emotion', value: 'Emotion_Sparkle', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'confusion', [{ slot: 'emotion', value: 'Emotion_Confusion', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'confused', [{ slot: 'emotion', value: 'Emotion_Confusion', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'fearful', [{ slot: 'emotion', value: 'Emotion_Fearful', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'surprise', [{ slot: 'emotion', value: 'Emotion_Surprise', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'cloud', [{ slot: 'emotion', value: 'Emotion_Cloud', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'heartbubble', [{ slot: 'emotion', value: 'Emotion_HeartBubble', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'heart_bubble', [{ slot: 'emotion', value: 'Emotion_HeartBubble', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'heartburst', [{ slot: 'emotion', value: 'Emotion_HeartBurst', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'heart_burst', [{ slot: 'emotion', value: 'Emotion_HeartBurst', priority: EMOTION_KEYWORD_PRIORITY }]);
  addRuleIfAvailable(rules, assets, 'zzz', [{ slot: 'emotion', value: 'Emotion_zzz', priority: EMOTION_KEYWORD_PRIORITY }]);

  return rules;
}

function addExplicitAssetRules(
  rules: Map<string, KeywordEffect[]>,
  slot: ExpressionSlot,
  prefix: string,
  names: readonly string[]
): void {
  names.forEach((name) => {
    const canonical = canonicalizeAssetName(name);
    const stripped = prefix ? canonicalizeAssetName(name.replace(new RegExp(`^${prefix}`, 'i'), '')) : canonical;
    const effect = { slot, value: name, priority: EXPLICIT_COMPONENT_PRIORITY };
    addRule(rules, canonical, [effect]);
    addRule(rules, stripped, [effect]);
  });
}

function addRuleIfAvailable(
  rules: Map<string, KeywordEffect[]>,
  assets: ExpressionFallbackAssets,
  alias: string,
  effects: KeywordEffect[]
): void {
  const available = effects.filter((effect) => assets[effect.slot].includes(effect.value));
  if (available.length) addRule(rules, alias, available);
}

function addRule(rules: Map<string, KeywordEffect[]>, alias: string, effects: KeywordEffect[]): void {
  const canonical = canonicalizeAssetName(alias);
  if (!canonical) return;
  const aliases = unique([canonical, canonical.replace(/_/g, '')]);
  aliases.forEach((item) => {
    const current = rules.get(item) || [];
    rules.set(item, [...current, ...effects]);
  });
}

function findRuleMatch(
  tokens: string[],
  index: number,
  rules: Map<string, KeywordEffect[]>
): { alias: string; effects: KeywordEffect[]; length: number } | null {
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

function findFuzzyRuleAlias(token: string, rules: Map<string, KeywordEffect[]>): string | null {
  if (token.length < 4) return null;
  const ranked = Array.from(rules.keys())
    .filter((alias) => !alias.includes('_') && alias.length >= 4)
    .map((alias) => ({ alias, distance: levenshteinDistance(token, alias) }))
    .sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;

  const allowed = best.distance <= 1 || (token.length >= 6 && best.distance <= 2);
  const unique = !second || second.distance > best.distance;
  return allowed && unique ? best.alias : null;
}

function canonicalizeAssetName(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveDefaultExpression(expressions: readonly ExpressionLayerRef[], defaultExpression: string): ExpressionLayerRef {
  return expressions.find((expression) => expression.name === defaultExpression) || expressions[0];
}

function levenshteinDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let row = 1; row <= a.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost
      );
    }
    for (let column = 0; column <= b.length; column += 1) previous[column] = current[column];
  }

  return previous[b.length];
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}
