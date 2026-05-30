const FALLBACK_CANVAS_SIZE = 2048;

interface StandingCanvasLayer {
  url: string;
}

export function createStandingCanvas(layers: StandingCanvasLayer[], className = 'mama-standing__canvas'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.width = FALLBACK_CANVAS_SIZE;
  canvas.height = FALLBACK_CANVAS_SIZE;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.layerCount = String(layers.length);

  void paintStandingCanvas(canvas, layers);
  return canvas;
}

async function paintStandingCanvas(canvas: HTMLCanvasElement, layers: StandingCanvasLayer[]): Promise<void> {
  const images = await Promise.all(layers.map((layer) => loadImage(layer.url)));
  const drawableImages = images.filter((image): image is HTMLImageElement => Boolean(image));
  const firstImage = drawableImages[0];
  const width = firstImage?.naturalWidth || FALLBACK_CANVAS_SIZE;
  const height = firstImage?.naturalHeight || FALLBACK_CANVAS_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return;

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  drawableImages.forEach((image) => {
    context.drawImage(image, 0, 0, width, height);
  });

  canvas.dataset.rendered = 'true';
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    let settled = false;
    const done = (image: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      resolve(image);
    };

    const image = new Image();
    image.decoding = 'async';
    image.loading = 'eager';
    (image as any).fetchPriority = 'high';
    image.onload = () => done(image);
    image.onerror = () => done(null);
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      done(image);
    }
  });
}
