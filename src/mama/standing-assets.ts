import expressionData from '../assets/png/standing/expression/exp.json';
import {
  resolveExpressionWithFallback,
  type ExpressionFallbackAssets,
  type ExpressionLayerRef
} from './expression-fallback';
import { DEFAULT_MAMA_STATE, normalizeString } from './state';

export type { ExpressionLayerRef } from './expression-fallback';

export interface StandingLayers {
  outfit: string;
  expression: ExpressionLayerRef;
  layers: StandingLayer[];
}

export type StandingLayerKind =
  | 'face_fx'
  | 'mouth'
  | 'expression_other'
  | 'base'
  | 'eyes'
  | 'mood_under'
  | 'brow'
  | 'mood_top'
  | 'emotion';

export interface StandingLayer {
  kind: StandingLayerKind;
  url: string;
}

interface ExpressionFile {
  count: number;
  expressions: ExpressionLayerRef[];
}

type AssetMap = Record<string, string>;

const EMOTION_LAYER_RANK: Record<string, number> = {
  Emotion_HeartBurst: 10,
  Emotion_HeartBubble: 20
};

const baseModules = import.meta.glob<string>([
  '../assets/png/standing/base/*.png',
  '!../assets/png/standing/base/*_old.png'
], {
  eager: true,
  query: '?url',
  import: 'default'
});

const faceModules = import.meta.glob<string>('../assets/png/standing/expression/face_fx/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

const browModules = import.meta.glob<string>('../assets/png/standing/expression/brow/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

const eyeModules = import.meta.glob<string>('../assets/png/standing/expression/eyes/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

const mouthModules = import.meta.glob<string>('../assets/png/standing/expression/mouth/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

const otherModules = import.meta.glob<string>('../assets/png/standing/expression/other/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

const emotionModules = import.meta.glob<string>('../assets/png/standing/emotion/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

export const outfitAssets = buildAssetMap(baseModules);
export const expressionAssets = {
  face: buildAssetMap(faceModules),
  brow: buildAssetMap(browModules),
  eye: buildAssetMap(eyeModules),
  mouth: buildAssetMap(mouthModules),
  other: buildAssetMap(otherModules)
};
export const emotionAssets = buildAssetMap(emotionModules);

export const expressions: ExpressionLayerRef[] = (expressionData as ExpressionFile).expressions;
export const DEFAULT_EXPRESSION = 'exp_smile_soft';
const expressionFallbackAssets: ExpressionFallbackAssets = {
  face: Object.keys(expressionAssets.face),
  mouth: Object.keys(expressionAssets.mouth),
  eye: Object.keys(expressionAssets.eye),
  brow: Object.keys(expressionAssets.brow),
  other: Object.keys(expressionAssets.other),
  emotion: Object.keys(emotionAssets)
};

export function resolveStandingLayers(outfitInput: unknown, expressionInput: unknown): StandingLayers {
  const expression = isExpressionRef(expressionInput) ? normalizeExpressionRef(expressionInput) : resolveExpression(expressionInput);
  return resolveStandingLayersForExpression(outfitInput, expression);
}

export function resolveStandingLayersForExpression(outfitInput: unknown, expressionInput: ExpressionLayerRef): StandingLayers {
  const outfit = resolveOutfitName(outfitInput);
  const expression = normalizeExpressionRef(expressionInput);
  const baseUrl = outfitAssets[outfit] || outfitAssets[DEFAULT_MAMA_STATE.outfit] || '';
  const moodLayers = resolveMoodLayers(outfit, expression.face);
  const layers = [
    ...resolveFaceLayers(expression.face),
    { kind: 'mouth', url: expressionAssets.mouth[expression.mouth] || expressionAssets.mouth.mouth_neutral },
    ...resolveExpressionOtherLayers(expression.other),
    { kind: 'base', url: baseUrl },
    { kind: 'eyes', url: expressionAssets.eye[expression.eye] || expressionAssets.eye.eye_normal },
    moodLayers.under,
    { kind: 'brow', url: expressionAssets.brow[expression.brow] || expressionAssets.brow.brow_normal },
    moodLayers.top,
    ...resolveEmotionLayers(expression.emotion)
  ].filter((layer): layer is StandingLayer => Boolean(layer?.url));

  return {
    outfit,
    expression,
    layers
  };
}

function isExpressionRef(value: unknown): value is ExpressionLayerRef {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as { name?: unknown }).name === 'string' &&
    typeof (value as { face?: unknown }).face === 'string'
  );
}

function normalizeExpressionRef(expression: ExpressionLayerRef): ExpressionLayerRef {
  return {
    id: Number.isFinite(Number(expression.id)) ? Math.round(Number(expression.id)) : 0,
    name: normalizeString(expression.name, DEFAULT_EXPRESSION),
    face: normalizeString(expression.face, 'face_default'),
    mouth: normalizeString(expression.mouth, 'mouth_neutral'),
    eye: normalizeString(expression.eye, 'eye_normal'),
    brow: normalizeString(expression.brow, 'brow_normal'),
    nsfw: expression.nsfw,
    synthetic: expression.synthetic,
    sourceName: expression.sourceName,
    matchedTokens: expression.matchedTokens,
    unmatchedTokens: expression.unmatchedTokens,
    other: expression.other,
    emotion: expression.emotion
  };
}

function resolveFaceLayers(faceName: string): StandingLayer[] {
  const defaultFace = expressionAssets.face.face_default;
  const specialFace = expressionAssets.face[faceName];
  return [
    { kind: 'face_fx', url: defaultFace },
    faceName !== 'face_default' && specialFace ? { kind: 'face_fx', url: specialFace } : null
  ].filter((layer): layer is StandingLayer => Boolean(layer?.url));
}

function resolveExpressionOtherLayers(value: string | string[] | undefined): StandingLayer[] {
  const names = Array.isArray(value) ? value : value ? [value] : [];
  return names.reduce<StandingLayer[]>((layers, name) => {
    const url = expressionAssets.other[name];
    if (url) layers.push({ kind: 'expression_other', url });
    return layers;
  }, []);
}

function resolveMoodLayers(outfit: string, faceName: string): { under: StandingLayer | null; top: StandingLayer | null } {
  const mood = faceName === 'face_shadow'
    ? 'shadow'
    : faceName === 'face_pale'
      ? 'pale'
      : '';

  if (!mood) return { under: null, top: null };

  const underVariant = outfit === 'nephilim' || outfit === 'seraphim' ? '3' : '2';
  return {
    under: { kind: 'mood_under', url: expressionAssets.other[`${mood}_${underVariant}`] },
    top: { kind: 'mood_top', url: expressionAssets.other[`${mood}_1`] }
  };
}

function resolveEmotionLayers(value: string | string[] | undefined): StandingLayer[] {
  const names = sortEmotionLayerNames(Array.isArray(value) ? value : value ? [value] : []);
  return names.reduce<StandingLayer[]>((layers, name) => {
    const url = emotionAssets[name];
    if (url) layers.push({ kind: 'emotion', url });
    return layers;
  }, []);
}

function sortEmotionLayerNames(names: string[]): string[] {
  return names
    .map((name, index) => ({ name, index }))
    .sort((a, b) => (EMOTION_LAYER_RANK[a.name] || 0) - (EMOTION_LAYER_RANK[b.name] || 0) || a.index - b.index)
    .map((item) => item.name);
}

export function resolveOutfitName(value: unknown): string {
  const requested = normalizeString(value, DEFAULT_MAMA_STATE.outfit);
  return outfitAssets[requested] ? requested : DEFAULT_MAMA_STATE.outfit;
}

export function resolveExpression(value: unknown): ExpressionLayerRef {
  return resolveExpressionWithFallback(value, expressions, DEFAULT_EXPRESSION, expressionFallbackAssets);
}

function buildAssetMap(modules: Record<string, string>): AssetMap {
  return Object.entries(modules).reduce<AssetMap>((map, [path, url]) => {
    const key = getBasename(path);
    if (key && !isIgnoredAssetKey(key)) map[key] = url;
    return map;
  }, {});
}

function getBasename(path: string): string {
  return path.split('/').pop()?.replace(/\.png$/i, '') || '';
}

function isIgnoredAssetKey(key: string): boolean {
  return key.endsWith('_old');
}
