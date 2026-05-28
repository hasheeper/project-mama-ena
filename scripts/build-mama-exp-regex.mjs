import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expressionDir = path.join(rootDir, 'src/assets/png/standing/expression');
const expDataPath = path.join(expressionDir, 'exp.json');
const assetCachePath = path.join(rootDir, 'apps/st-bridge/packs/mama-main/asset-cache.js');

const outputConfigs = [
  {
    file: path.join(rootDir, 'ST/regex/MAMA_EXP.html'),
    title: 'MAMA Expression Portrait',
    assetBaseUrl: 'https://hasheeper.github.io/project-mama-ena/mama-assets/standing'
  },
  {
    file: path.join(rootDir, 'ST/regex/local/MAMA_EXP.local.html'),
    title: 'MAMA Expression Portrait Local',
    assetBaseUrl: 'http://127.0.0.1:4173/mama-assets/standing'
  }
];

const expData = JSON.parse(fs.readFileSync(expDataPath, 'utf8'));
const assetRefs = collectAssetRefs(expData);

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function collectAssetRefs(data) {
  return {
    base: ['school_uniform'],
    face: unique(['face_default', ...data.expressions.map((item) => item.face)]),
    eye: unique(data.expressions.map((item) => item.eye)),
    mouth: unique(data.expressions.map((item) => item.mouth)),
    brow: unique(data.expressions.map((item) => item.brow))
  };
}

function scriptJson(value) {
  return JSON.stringify(value).replace(/<\//g, '<\\/');
}

function renderHtml({ title, assetBaseUrl }) {
  return `\`\`\`html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
      user-select: none;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
    }

    body {
      display: grid;
      place-items: center;
    }

    #mama-exp-app {
      width: 100vw;
      height: 100vh;
      min-width: 160px;
      min-height: 160px;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: transparent;
    }

    .portrait-frame {
      width: min(100vw, 100vh);
      height: min(100vw, 100vh);
      min-width: 160px;
      min-height: 160px;
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      background:
        linear-gradient(180deg, rgba(255, 250, 253, 0.94), rgba(241, 236, 245, 0.92)),
        #f8f1f6;
      box-shadow:
        inset 0 0 0 1px rgba(64, 31, 44, 0.1),
        0 8px 24px rgba(45, 35, 50, 0.12);
    }

    .portrait-crop {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .mama-standing {
      position: absolute;
      left: 45%;
      top: 115%;
      width: 280%;
      height: 280%;
      transform: translate(-50%, -50%);
      overflow: visible;
      isolation: isolate;
    }

    .mama-standing__layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center bottom;
      pointer-events: none;
      user-select: none;
    }

    .mama-standing__layer--face-fx {
      z-index: 10;
    }

    .mama-standing__layer--mouth {
      z-index: 20;
    }

    .mama-standing__layer--base {
      z-index: 30;
    }

    .mama-standing__layer--eyes {
      z-index: 40;
    }

    .mama-standing__layer--brow {
      z-index: 50;
    }
  </style>
</head>
<body>
  <script id="mama-exp" type="application/json">$1</script>
  <main id="mama-exp-app" data-app-id="expression-portrait"></main>

  <script>
    (function () {
      const EXP_DATA = ${scriptJson(expData)};
      const ASSET_REFS = ${scriptJson(assetRefs)};
      const ASSET_BASE_URL = '${assetBaseUrl}';
      const DEFAULT_EXPRESSION = 'exp_default';
      const DEFAULT_OUTFIT = 'school_uniform';
      const CACHE_KEY = '__MAMA_EXP_IMAGE_CACHE__';
      const app = document.getElementById('mama-exp-app');
      const hostFrame = window.frameElement;
      let currentExpression = resolveExpression(readExpression()).name;
      let warmAllScheduled = false;

      function readExpression() {
        const dataNode = document.getElementById('mama-exp');
        const raw = (dataNode && (dataNode.textContent || dataNode.innerText) || '').trim();
        if (!raw) return DEFAULT_EXPRESSION;
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'string' || typeof parsed === 'number') return String(parsed).trim() || DEFAULT_EXPRESSION;
        } catch (_) {}
        return raw.replace(/^<exp>|<\\/exp>$/gi, '').replace(/^[\"']|[\"']$/g, '').trim() || DEFAULT_EXPRESSION;
      }

      function resolveExpression(value) {
        const requested = String(value || DEFAULT_EXPRESSION).trim() || DEFAULT_EXPRESSION;
        const byId = Number(requested);
        const resolved = Number.isFinite(byId)
          ? EXP_DATA.expressions.find((item) => item.id === Math.round(byId))
          : EXP_DATA.expressions.find((item) => item.name === requested);
        return resolved || EXP_DATA.expressions.find((item) => item.name === DEFAULT_EXPRESSION) || EXP_DATA.expressions[0];
      }

      function assetUrl(group, name) {
        const folders = {
          base: 'base',
          face: 'expression/face_fx',
          eye: 'expression/eyes',
          mouth: 'expression/mouth',
          brow: 'expression/brow'
        };
        return ASSET_BASE_URL.replace(/\\/+$/, '') + '/' + folders[group] + '/' + encodeURIComponent(name) + '.png';
      }

      function getCriticalUrls(expression) {
        const urls = [
          assetUrl('face', 'face_default'),
          expression.face !== 'face_default' ? assetUrl('face', expression.face) : '',
          assetUrl('mouth', expression.mouth || 'mouth_neutral'),
          assetUrl('base', DEFAULT_OUTFIT),
          assetUrl('eye', expression.eye || 'eye_normal'),
          assetUrl('brow', expression.brow || 'brow_normal')
        ];
        return urls.filter(Boolean);
      }

      function getAllAssetUrls() {
        return [].concat(
          ASSET_REFS.base.map((name) => assetUrl('base', name)),
          ASSET_REFS.face.map((name) => assetUrl('face', name)),
          ASSET_REFS.mouth.map((name) => assetUrl('mouth', name)),
          ASSET_REFS.eye.map((name) => assetUrl('eye', name)),
          ASSET_REFS.brow.map((name) => assetUrl('brow', name))
        );
      }

      function getCacheRoot() {
        const candidates = [window];
        try { candidates.push(window.parent); } catch (_) {}
        try { candidates.push(window.top); } catch (_) {}
        for (const target of candidates) {
          try {
            if (target && target.Object) return target;
          } catch (_) {}
        }
        return window;
      }

      function warmImageCache(urls) {
        const root = getCacheRoot();
        let cache;
        try {
          cache = root[CACHE_KEY] || (root[CACHE_KEY] = Object.create(null));
        } catch (_) {
          cache = window[CACHE_KEY] || (window[CACHE_KEY] = Object.create(null));
        }

        urls.forEach((url) => {
          if (!url || cache[url]) return;
          const image = new Image();
          cache[url] = { status: 'loading', image };
          image.decoding = 'async';
          try { image.fetchPriority = 'low'; } catch (_) {}
          image.onload = function () { cache[url].status = 'ready'; };
          image.onerror = function () { cache[url].status = 'error'; };
          image.src = url;
        });
      }

      function scheduleWarmAll() {
        if (warmAllScheduled) return;
        warmAllScheduled = true;
        setTimeout(function () {
          warmImageCache(getAllAssetUrls());
        }, 250);
      }

      function resizeHostFrame() {
        if (!hostFrame) return;
        hostFrame.style.width = '220px';
        hostFrame.style.maxWidth = '70vw';
        hostFrame.style.height = hostFrame.style.width;
        hostFrame.style.border = '0';
        hostFrame.style.display = 'block';
        hostFrame.style.margin = '8px 0';
        hostFrame.style.background = 'transparent';
      }

      function makeLayer(kind, src, alt) {
        if (!src) return null;
        const image = document.createElement('img');
        image.className = 'mama-standing__layer mama-standing__layer--' + (kind === 'face_fx' ? 'face-fx' : kind);
        image.src = src;
        image.alt = alt || '';
        image.decoding = 'async';
        image.draggable = false;
        return image;
      }

      function resolveLayers(expression) {
        return [
          makeLayer('face_fx', assetUrl('face', 'face_default'), ''),
          expression.face !== 'face_default' ? makeLayer('face_fx', assetUrl('face', expression.face), '') : null,
          makeLayer('mouth', assetUrl('mouth', expression.mouth || 'mouth_neutral'), ''),
          makeLayer('base', assetUrl('base', DEFAULT_OUTFIT), ''),
          makeLayer('eyes', assetUrl('eye', expression.eye || 'eye_normal'), ''),
          makeLayer('brow', assetUrl('brow', expression.brow || 'brow_normal'), '')
        ].filter(Boolean);
      }

      function render() {
        if (!app) return;
        const expression = resolveExpression(currentExpression);
        app.dataset.expression = expression.name;
        warmImageCache(getCriticalUrls(expression));
        scheduleWarmAll();

        const frame = document.createElement('section');
        frame.className = 'portrait-frame';
        frame.title = expression.name;

        const crop = document.createElement('div');
        crop.className = 'portrait-crop';

        const figure = document.createElement('figure');
        figure.className = 'mama-standing';
        figure.dataset.outfit = DEFAULT_OUTFIT;
        figure.dataset.expression = expression.name;
        figure.setAttribute('aria-label', 'Ena ' + expression.name);
        figure.append.apply(figure, resolveLayers(expression));

        crop.append(figure);
        frame.append(crop);
        app.replaceChildren(frame);
      }

      resizeHostFrame();
      render();
      window.addEventListener('resize', resizeHostFrame);
      window.addEventListener('message', function (event) {
        const data = event && event.data;
        if (!data || typeof data !== 'object' || data.type !== 'MAMA_EXP_DATA') return;
        currentExpression = resolveExpression(data.expression).name;
        render();
      });
    })();
  </script>
</body>
</html>
\`\`\`
`;
}

function renderAssetCacheScript() {
  return `/**
 * Prewarms MAMA expression PNGs into the browser image cache.
 * Generated by scripts/build-mama-exp-regex.mjs.
 */
(function () {
  'use strict';

  const CURRENT_ROOT = typeof window !== 'undefined' ? window : globalThis;
  const DEFAULT_APP_BASE_URL = 'https://hasheeper.github.io/project-mama-ena';
  const ASSET_REFS = ${scriptJson(assetRefs)};
  const CACHE_KEY = '__MAMA_EXP_IMAGE_CACHE__';

  function readGlobalString(key) {
    const targets = [CURRENT_ROOT];
    try { targets.push(CURRENT_ROOT.parent); } catch (_) {}
    try { targets.push(CURRENT_ROOT.top); } catch (_) {}
    for (const target of targets) {
      try {
        if (typeof target?.[key] === 'string' && target[key].trim()) return target[key].trim();
      } catch (_) {}
    }
    return '';
  }

  function trimTrailingSlash(value) {
    return typeof value === 'string' ? value.trim().replace(/\\/+$/, '') : '';
  }

  function resolveAssetBaseUrl() {
    const explicit = readGlobalString('MAMA_ASSET_BASE_URL');
    if (explicit) return trimTrailingSlash(explicit);
    const appBase = trimTrailingSlash(readGlobalString('MAMA_APP_BASE_URL') || DEFAULT_APP_BASE_URL);
    return appBase + '/mama-assets/standing';
  }

  function assetUrl(baseUrl, group, name) {
    const folders = {
      base: 'base',
      face: 'expression/face_fx',
      eye: 'expression/eyes',
      mouth: 'expression/mouth',
      brow: 'expression/brow'
    };
    return baseUrl + '/' + folders[group] + '/' + encodeURIComponent(name) + '.png';
  }

  function getAllAssetUrls(baseUrl) {
    return [].concat(
      ASSET_REFS.base.map((name) => assetUrl(baseUrl, 'base', name)),
      ASSET_REFS.face.map((name) => assetUrl(baseUrl, 'face', name)),
      ASSET_REFS.mouth.map((name) => assetUrl(baseUrl, 'mouth', name)),
      ASSET_REFS.eye.map((name) => assetUrl(baseUrl, 'eye', name)),
      ASSET_REFS.brow.map((name) => assetUrl(baseUrl, 'brow', name))
    );
  }

  function getCacheRoot() {
    const candidates = [CURRENT_ROOT];
    try { candidates.push(CURRENT_ROOT.parent); } catch (_) {}
    try { candidates.push(CURRENT_ROOT.top); } catch (_) {}
    for (const target of candidates) {
      try {
        if (target && target.Object) return target;
      } catch (_) {}
    }
    return CURRENT_ROOT;
  }

  function warmImageCache(urls) {
    const root = getCacheRoot();
    let cache;
    try {
      cache = root[CACHE_KEY] || (root[CACHE_KEY] = Object.create(null));
    } catch (_) {
      cache = CURRENT_ROOT[CACHE_KEY] || (CURRENT_ROOT[CACHE_KEY] = Object.create(null));
    }

    urls.forEach((url) => {
      if (!url || cache[url]) return;
      const image = new Image();
      cache[url] = { status: 'loading', image };
      image.decoding = 'async';
      try { image.fetchPriority = 'low'; } catch (_) {}
      image.onload = function () { cache[url].status = 'ready'; };
      image.onerror = function () { cache[url].status = 'error'; };
      image.src = url;
    });
  }

  function warmExpressionAssets() {
    const baseUrl = resolveAssetBaseUrl();
    const urls = getAllAssetUrls(baseUrl);
    warmImageCache(urls.slice(0, 8));
    setTimeout(() => warmImageCache(urls.slice(8)), 300);
    return { baseUrl, count: urls.length };
  }

  try {
    const runtime = CURRENT_ROOT.MAMAMainRuntime || {};
    runtime.warmExpressionAssets = warmExpressionAssets;
    CURRENT_ROOT.MAMAMainRuntime = runtime;
  } catch (_) {}

  const result = warmExpressionAssets();
  try {
    console.info('[MAMA Asset Cache] warming expression PNG cache:', result);
  } catch (_) {}
})();
`;
}

for (const output of outputConfigs) {
  fs.mkdirSync(path.dirname(output.file), { recursive: true });
  fs.writeFileSync(output.file, renderHtml(output));
}

fs.mkdirSync(path.dirname(assetCachePath), { recursive: true });
fs.writeFileSync(assetCachePath, renderAssetCacheScript());

console.log(`Wrote ${outputConfigs.length} remote-asset regex wrappers.`);
console.log(`Wrote ${path.relative(rootDir, assetCachePath)}.`);
console.log(`Referenced expressions: ${expData.expressions.length}`);
console.log(`Referenced PNG groups: ${Object.entries(assetRefs).map(([key, values]) => `${key}=${values.length}`).join(', ')}`);
