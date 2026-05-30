import { resolveStandingLayers, type StandingLayer, type StandingLayerKind } from './standing-assets';
import { createStandingCanvas } from './standing-canvas';

export interface StandingFigureOptions {
  outfit: unknown;
  expression: unknown;
  className?: string;
  label?: string;
  extraLayers?: StandingLayer[];
  renderMode?: 'canvas' | 'layers';
}

export function createStandingFigure(options: StandingFigureOptions): HTMLElement {
  const layers = resolveStandingLayers(options.outfit, options.expression);
  const figure = document.createElement('div');
  const classNames = ['mama-standing', options.className].filter(Boolean);
  figure.className = classNames.join(' ');
  figure.dataset.outfit = layers.outfit;
  figure.dataset.expression = layers.expression.name;
  figure.setAttribute('role', 'img');
  figure.setAttribute('aria-label', options.label || `Ena ${layers.outfit} ${layers.expression.name}`);

  const standingLayers = [...layers.layers, ...(options.extraLayers || [])];
  if (options.renderMode === 'layers') {
    standingLayers.forEach((layer) => {
      figure.append(createLayerImage(
        layer.url,
        `mama-standing__layer mama-standing__layer--${getLayerClass(layer.kind)}`
      ));
    });
  } else {
    figure.append(createStandingCanvas(standingLayers));
  }

  return figure;
}

function getLayerClass(kind: StandingLayerKind): string {
  return kind.replace(/_/g, '-');
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
