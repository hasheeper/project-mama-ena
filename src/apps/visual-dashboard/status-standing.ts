import faceDefaultUrl from '../../assets/png/standing/expression/face_fx/face_default.png?url';
import browNormalUrl from '../../assets/png/standing/expression/brow/brow_normal.png?url';
import eyeNormalUrl from '../../assets/png/standing/expression/eyes/eye_normal.png?url';
import mouthNeutralUrl from '../../assets/png/standing/expression/mouth/mouth_neutral.png?url';
import { createStandingCanvas } from '../../mama/standing-canvas';
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

interface StatusStandingLayer {
  url: string;
}

export function createStatusStandingFigure(options: StatusStandingOptions): HTMLElement {
  const outfit = resolveOutfitName(options.outfit);
  const figure = document.createElement('div');
  const classNames = ['mama-standing', options.className].filter(Boolean);
  const layers: StatusStandingLayer[] = [
    { url: faceDefaultUrl },
    { url: mouthNeutralUrl },
    { url: outfitAssets[outfit] },
    { url: eyeNormalUrl },
    { url: browNormalUrl }
  ];

  figure.className = classNames.join(' ');
  figure.dataset.outfit = outfit;
  figure.setAttribute('role', 'img');
  figure.setAttribute('aria-label', options.label || `Ena ${outfit} status`);
  figure.append(createStandingCanvas(layers));

  return figure;
}

function resolveOutfitName(value: unknown): string {
  const requested = normalizeString(value, DEFAULT_MAMA_STATE.outfit);
  return outfitAssets[requested] ? requested : DEFAULT_MAMA_STATE.outfit;
}

function buildAssetMap(modules: Record<string, string>): Record<string, string> {
  return Object.entries(modules).reduce<Record<string, string>>((map, [path, url]) => {
    const key = path.split('/').pop()?.replace(/\.png$/i, '');
    if (key) map[key] = url;
    return map;
  }, {});
}
