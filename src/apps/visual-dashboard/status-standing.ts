import faceDefaultUrl from '../../assets/png/standing/expression/face_fx/face_default.png?url';
import browNormalUrl from '../../assets/png/standing/expression/brow/brow_normal.png?url';
import eyeNormalUrl from '../../assets/png/standing/expression/eyes/eye_normal.png?url';
import mouthNeutralUrl from '../../assets/png/standing/expression/mouth/mouth_neutral.png?url';
import { DEFAULT_MAMA_STATE, normalizeString } from '../../mama/state';

const baseModules = import.meta.glob<string>('../../assets/png/standing/base/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

const outfitAssets = buildAssetMap(baseModules);

interface StatusStandingOptions {
  outfit: unknown;
  className?: string;
  label?: string;
}

interface StandingLayer {
  kind: 'face-fx' | 'mouth' | 'base' | 'eyes' | 'brow';
  url: string;
}

export function createStatusStandingFigure(options: StatusStandingOptions): HTMLElement {
  const outfit = resolveOutfitName(options.outfit);
  const figure = document.createElement('div');
  const classNames = ['mama-standing', options.className].filter(Boolean);
  const layers: StandingLayer[] = [
    { kind: 'face-fx', url: faceDefaultUrl },
    { kind: 'mouth', url: mouthNeutralUrl },
    { kind: 'base', url: outfitAssets[outfit] },
    { kind: 'eyes', url: eyeNormalUrl },
    { kind: 'brow', url: browNormalUrl }
  ];

  figure.className = classNames.join(' ');
  figure.dataset.outfit = outfit;
  figure.setAttribute('role', 'img');
  figure.setAttribute('aria-label', options.label || `Ena ${outfit} status`);

  layers.forEach((layer) => {
    figure.append(createLayerImage(layer.url, `mama-standing__layer mama-standing__layer--${layer.kind}`));
  });

  return figure;
}

function resolveOutfitName(value: unknown): string {
  const requested = normalizeString(value, DEFAULT_MAMA_STATE.outfit);
  return outfitAssets[requested] ? requested : DEFAULT_MAMA_STATE.outfit;
}

function createLayerImage(src: string, className: string): HTMLImageElement {
  const image = document.createElement('img');
  image.className = className;
  image.src = src;
  image.alt = '';
  image.decoding = 'async';
  image.loading = 'eager';
  (image as any).fetchPriority = 'high';
  image.draggable = false;
  return image;
}

function buildAssetMap(modules: Record<string, string>): Record<string, string> {
  return Object.entries(modules).reduce<Record<string, string>>((map, [path, url]) => {
    const key = path.split('/').pop()?.replace(/\.png$/i, '');
    if (key) map[key] = url;
    return map;
  }, {});
}
