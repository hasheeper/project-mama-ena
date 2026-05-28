import expressionData from '../assets/png/standing/expression/exp.json';
import { DEFAULT_MAMA_STATE, normalizeString } from './state';

export interface ExpressionLayerRef {
  id: number;
  name: string;
  face: string;
  mouth: string;
  eye: string;
  brow: string;
}

export interface StandingLayers {
  outfit: string;
  expression: ExpressionLayerRef;
  layers: StandingLayer[];
}

export type StandingLayerKind = 'face_fx' | 'mouth' | 'base' | 'eyes' | 'brow';

export interface StandingLayer {
  kind: StandingLayerKind;
  url: string;
}

interface ExpressionFile {
  count: number;
  expressions: ExpressionLayerRef[];
}

type AssetMap = Record<string, string>;

const baseModules = import.meta.glob<string>('../assets/png/standing/base/*.png', {
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

export const outfitAssets = buildAssetMap(baseModules);
export const expressionAssets = {
  face: buildAssetMap(faceModules),
  brow: buildAssetMap(browModules),
  eye: buildAssetMap(eyeModules),
  mouth: buildAssetMap(mouthModules)
};

export const expressions: ExpressionLayerRef[] = (expressionData as ExpressionFile).expressions;

export function resolveStandingLayers(outfitInput: unknown, expressionInput: unknown): StandingLayers {
  const outfit = resolveOutfitName(outfitInput);
  const expression = resolveExpression(expressionInput);
  const baseUrl = outfitAssets[outfit] || outfitAssets[DEFAULT_MAMA_STATE.outfit] || '';
  const layers = [
    { kind: 'face_fx', url: expressionAssets.face[expression.face] || expressionAssets.face.face_default },
    { kind: 'mouth', url: expressionAssets.mouth[expression.mouth] || expressionAssets.mouth.mouth_neutral },
    { kind: 'base', url: baseUrl },
    { kind: 'eyes', url: expressionAssets.eye[expression.eye] || expressionAssets.eye.eye_normal },
    { kind: 'brow', url: expressionAssets.brow[expression.brow] || expressionAssets.brow.brow_normal }
  ].filter((layer): layer is StandingLayer => Boolean(layer.url));

  return {
    outfit,
    expression,
    layers
  };
}

export function resolveOutfitName(value: unknown): string {
  const requested = normalizeString(value, DEFAULT_MAMA_STATE.outfit);
  return outfitAssets[requested] ? requested : DEFAULT_MAMA_STATE.outfit;
}

export function resolveExpression(value: unknown): ExpressionLayerRef {
  const requested = normalizeString(value, DEFAULT_MAMA_STATE.expression);
  const byId = Number(requested);
  const resolved = Number.isFinite(byId)
    ? expressions.find((expression) => expression.id === Math.round(byId))
    : expressions.find((expression) => expression.name === requested);

  return resolved || expressions.find((expression) => expression.name === DEFAULT_MAMA_STATE.expression) || expressions[0];
}

function buildAssetMap(modules: Record<string, string>): AssetMap {
  return Object.entries(modules).reduce<AssetMap>((map, [path, url]) => {
    const key = getBasename(path);
    if (key) map[key] = url;
    return map;
  }, {});
}

function getBasename(path: string): string {
  return path.split('/').pop()?.replace(/\.png$/i, '') || '';
}
