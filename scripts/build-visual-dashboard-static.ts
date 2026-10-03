import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type InlineConfig } from 'vite';

const rootDir = process.cwd();
const sourceHtmlPath = resolve(rootDir, 'apps/visual-dashboard/index.html');
const outputHtmlPath = resolve(rootDir, 'dist/apps/visual-dashboard/index.html');
const outputStaticPreviewPath = resolve(rootDir, 'doc/visual-dashboard-static-preview.html');
const distAssetsDir = resolve(rootDir, 'dist/assets');
const tempDir = resolve(rootDir, '.generated/visual-dashboard-static');
const tempEntryPath = resolve(tempDir, 'entry.ts');
const tempOutDir = resolve(tempDir, 'out');
const tempAssetsDir = resolve(tempOutDir, 'assets');
const tempBundlePath = resolve(tempOutDir, 'visual-dashboard.js');

async function main(): Promise<void> {
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempDir, { recursive: true });
  await writeFile(
    tempEntryPath,
    [
      "import '../../src/apps/visual-dashboard/styles.css';",
      "import '../../src/apps/visual-dashboard/main.ts';",
      ''
    ].join('\n'),
    'utf8'
  );

  await build(makeConfig());

  const [script, style] = await Promise.all([
    readFile(tempBundlePath, 'utf8'),
    readBuiltStyles()
  ]);

  await copyBuiltAssets();
  await writeBundledHtml(style, script);
  await writeStaticPreviewHtml(style);

  console.log('Bundled dist/apps/visual-dashboard/index.html with inline CSS/JS.');
  console.log('Wrote doc/visual-dashboard-static-preview.html as a static style preview.');
}

function makeConfig(): InlineConfig {
  return {
    configFile: false,
    base: './',
    publicDir: false,
    logLevel: 'warn',
    build: {
      outDir: tempOutDir,
      emptyOutDir: true,
      target: 'es2020',
      sourcemap: false,
      minify: false,
      cssCodeSplit: false,
      assetsInlineLimit: 0,
      rollupOptions: {
        input: tempEntryPath,
        external: (id) => /^https?:\/\//i.test(id),
        output: {
          entryFileNames: 'visual-dashboard.js',
          chunkFileNames: 'visual-dashboard-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          inlineDynamicImports: true
        }
      }
    }
  };
}

async function readBuiltStyles(): Promise<string> {
  const entries = await readdir(tempAssetsDir, { withFileTypes: true });
  const cssFiles = entries
    .filter((entry) => entry.isFile() && extname(entry.name) === '.css')
    .map((entry) => join(tempAssetsDir, entry.name))
    .sort();

  const styles = await Promise.all(cssFiles.map((file) => readFile(file, 'utf8')));
  return styles.join('\n');
}

async function copyBuiltAssets(): Promise<void> {
  await mkdir(distAssetsDir, { recursive: true });
  const entries = await readdir(tempAssetsDir, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && extname(entry.name) !== '.css')
      .map((entry) => cp(join(tempAssetsDir, entry.name), join(distAssetsDir, entry.name)))
  );
}

async function writeBundledHtml(style: string, script: string): Promise<void> {
  const sourceHtml = await readFile(sourceHtmlPath, 'utf8');
  const htmlWithoutAssets = sourceHtml
    .replace(/\s*<link\b[^>]*href=["'][^"']*styles\.css["'][^>]*>\s*/i, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*main\.ts["'][^>]*><\/script>\s*/i, '\n');
  const bundledHtml = htmlWithoutAssets
    .replace(
      /<\/head>/i,
      `    <style>\n${indentForHtml(rewriteAssetUrlsForPrefix(style, '../../assets/'))}\n    </style>\n  </head>`
    )
    .replace(
      /<\/body>/i,
      `    <script type="module">\n${indentForHtml(rewriteAssetUrlsForPrefix(script, '../../assets/').replace(/<\/script/gi, '<\\/script'))}\n    </script>\n  </body>`
    );

  await mkdir(dirname(outputHtmlPath), { recursive: true });
  await writeFile(outputHtmlPath, bundledHtml, 'utf8');
}

async function writeStaticPreviewHtml(style: string): Promise<void> {
  const renderedRoot = await renderStaticDashboardRoot();
  const previewAssetPathMap = await buildPreviewAssetPathMap();
  const previewStyle = rewriteBuiltAssetUrlsToSourcePaths(style, previewAssetPathMap);
  const previewMarkup = rewriteBuiltAssetUrlsToSourcePaths(renderedRoot.outerHTML, previewAssetPathMap);
  const html = [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '    <title>M.A.M.A. Visual Dashboard Static Preview</title>',
    '    <style>',
    indentForHtml(previewStyle),
    '    </style>',
    '  </head>',
    '  <body>',
    indentForHtml(previewMarkup),
    '  </body>',
    '</html>',
    ''
  ].join('\n');

  await mkdir(dirname(outputStaticPreviewPath), { recursive: true });
  await writeFile(outputStaticPreviewPath, html, 'utf8');
}

async function renderStaticDashboardRoot(): Promise<StaticElement> {
  const document = new StaticDocument();
  const window = createStaticWindow(document);
  const restoreGlobals = installStaticDomGlobals(document, window);

  try {
    await import(`${pathToFileURL(tempBundlePath).href}?static=${Date.now()}`);
    await replaceStaticStandingCanvases(document.dashboardRoot);
  } finally {
    restoreGlobals();
  }

  return document.dashboardRoot;
}

async function replaceStaticStandingCanvases(root: StaticElement): Promise<void> {
  const standing = root.querySelector('.mama-standing--dashboard');
  if (!standing || !standing.querySelector('canvas')) return;

  const outfit = standing.getAttribute('data-outfit') || 'streetwear_full';
  const layers = await Promise.all([
    createStaticImageLayer('face_default', 'mama-standing__layer--face-fx'),
    createStaticImageLayer('mouth_neutral', 'mama-standing__layer--mouth'),
    createStaticImageLayer(outfit, 'mama-standing__layer--base'),
    createStaticImageLayer('eye_normal', 'mama-standing__layer--eyes'),
    createStaticImageLayer('brow_normal', 'mama-standing__layer--brow')
  ]);
  const drawableLayers = layers.filter((layer): layer is StaticElement => Boolean(layer));
  if (drawableLayers.length) standing.replaceChildren(...drawableLayers);
}

async function createStaticImageLayer(assetStem: string, layerClassName: string): Promise<StaticElement | null> {
  const src = await findBuiltAssetUrl(assetStem);
  if (!src) return null;

  const image = new StaticElement('img');
  image.className = `mama-standing__layer ${layerClassName}`;
  image.setAttribute('src', src);
  image.setAttribute('alt', '');
  image.setAttribute('aria-hidden', 'true');
  image.setAttribute('loading', 'eager');
  image.setAttribute('decoding', 'async');
  return image;
}

async function findBuiltAssetUrl(assetStem: string): Promise<string> {
  const entries = await readdir(tempAssetsDir, { withFileTypes: true });
  const asset = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .find((name) => name.startsWith(`${assetStem}-`) && extname(name).toLowerCase() === '.png');

  return asset ? pathToFileURL(join(tempAssetsDir, asset)).href : '';
}

function rewriteAssetUrlsForPrefix(value: string, assetPrefix: string): string {
  return value
    .replace(/new URL\((["'])assets\//g, `new URL($1${assetPrefix}`)
    .replace(/url\((["']?)assets\//g, `url($1${assetPrefix}`)
    .replace(/(["'])\/assets\//g, `$1${assetPrefix}`);
}

async function buildPreviewAssetPathMap(): Promise<Map<string, string>> {
  const sourceAssets = await collectSourceAssets(resolve(rootDir, 'src/assets'));
  const entries = await readdir(tempAssetsDir, { withFileTypes: true });
  const assetMap = new Map<string, string>();

  entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() !== '.css')
    .forEach((entry) => {
      const ext = extname(entry.name).toLowerCase();
      const source = sourceAssets
        .filter((asset) => asset.ext === ext && entry.name.startsWith(`${asset.stem}-`))
        .sort((left, right) => right.stem.length - left.stem.length)[0];

      if (!source) return;
      assetMap.set(entry.name, toPosix(join('..', relative(rootDir, source.path))));
    });

  return assetMap;
}

interface SourceAsset {
  stem: string;
  ext: string;
  path: string;
}

async function collectSourceAssets(dir: string): Promise<SourceAsset[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry): Promise<SourceAsset[]> => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceAssets(entryPath);
    if (!entry.isFile()) return [];

    const ext = extname(entry.name).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) return [];
    return [{
      stem: entry.name.slice(0, -ext.length),
      ext,
      path: entryPath
    }];
  }));

  return nested.flat();
}

function rewriteBuiltAssetUrlsToSourcePaths(value: string, assetMap: Map<string, string>): string {
  let nextValue = value;
  assetMap.forEach((sourcePath, assetName) => {
    nextValue = nextValue
      .split(pathToFileURL(join(tempAssetsDir, assetName)).href).join(sourcePath)
      .split(`assets/${assetName}`).join(sourcePath);
  });
  return nextValue;
}

function toPosix(value: string): string {
  return value.split('\\').join('/');
}

function indentForHtml(value: string): string {
  return value
    .trim()
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n');
}

type StaticChild = StaticElement | StaticTextNode;

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

class StaticDocument {
  readonly body = new StaticElement('body');
  readonly dashboardRoot = new StaticElement('main');

  constructor() {
    this.dashboardRoot.className = 'visual-dashboard';
    this.dashboardRoot.setAttribute('data-app-id', 'visual-dashboard');
    this.body.append(this.dashboardRoot);
  }

  createElement(tagName: string): StaticElement {
    return tagName.toLowerCase() === 'canvas'
      ? new StaticCanvasElement()
      : new StaticElement(tagName);
  }

  querySelector(selector: string): StaticElement | null {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector: string): StaticElement[] {
    return this.body.querySelectorAll(selector);
  }
}

class StaticElement {
  readonly tagName: string;
  readonly dataset: Record<string, string | undefined>;
  readonly classList: StaticClassList;
  readonly style: Record<string, string>;
  private readonly attributes = new Map<string, string>();
  private readonly children: StaticChild[] = [];
  private readonly styleValues = new Map<string, string>();
  private rawInnerHtml = '';
  private parentElement: StaticElement | null = null;

  constructor(tagName: string) {
    this.tagName = tagName.toLowerCase();
    this.dataset = new Proxy({} as Record<string, string | undefined>, {
      get: (_target, key) => this.getAttribute(dataKeyToAttribute(String(key))) ?? undefined,
      set: (_target, key, value) => {
        this.setAttribute(dataKeyToAttribute(String(key)), String(value));
        return true;
      }
    });
    this.classList = new StaticClassList(this);
    this.style = new Proxy({} as Record<string, string>, {
      get: (_target, key) => this.styleValues.get(cssPropertyName(String(key))) || '',
      set: (_target, key, value) => {
        this.styleValues.set(cssPropertyName(String(key)), String(value));
        return true;
      }
    });
  }

  get className(): string {
    return this.getAttribute('class') || '';
  }

  set className(value: string) {
    this.setAttribute('class', value);
  }

  get id(): string {
    return this.getAttribute('id') || '';
  }

  set id(value: string) {
    this.setAttribute('id', value);
  }

  get textContent(): string {
    return this.children.map((child) => child.textContent).join('');
  }

  set textContent(value: string) {
    this.rawInnerHtml = '';
    this.replaceChildren(String(value));
  }

  get innerHTML(): string {
    return `${this.rawInnerHtml}${this.children.map((child) => child.outerHTML).join('')}`;
  }

  set innerHTML(value: string) {
    this.rawInnerHtml = value;
    this.children.splice(0);
  }

  get outerHTML(): string {
    const attributes = this.serializeAttributes();
    if (VOID_TAGS.has(this.tagName)) return `<${this.tagName}${attributes}>`;
    return `<${this.tagName}${attributes}>${this.innerHTML}</${this.tagName}>`;
  }

  setAttribute(name: string, value: unknown): void {
    this.attributes.set(name, String(value));
  }

  getAttribute(name: string): string | null {
    return this.attributes.has(name) ? this.attributes.get(name) || '' : null;
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  append(...nodes: Array<StaticElement | string>): void {
    nodes.forEach((node) => this.appendChildNode(node));
  }

  appendChild(node: StaticElement): StaticElement {
    this.appendChildNode(node);
    return node;
  }

  replaceChildren(...nodes: Array<StaticElement | string>): void {
    this.rawInnerHtml = '';
    this.children.splice(0);
    nodes.forEach((node) => this.appendChildNode(node));
  }

  addEventListener(): void {
    // Static preview generation only needs the rendered DOM shape.
  }

  removeEventListener(): void {
    // Static preview generation only needs the rendered DOM shape.
  }

  querySelector(selector: string): StaticElement | null {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector: string): StaticElement[] {
    const matches: StaticElement[] = [];
    this.walk((element) => {
      if (element !== this && element.matches(selector)) matches.push(element);
    });
    return matches;
  }

  closest(selector: string): StaticElement | null {
    let current: StaticElement | null = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentElement;
    }
    return null;
  }

  matches(selector: string): boolean {
    const selectors = selector.split(',').map((item) => item.trim()).filter(Boolean);
    return selectors.some((item) => matchesSimpleSelector(this, item));
  }

  getBoundingClientRect(): { width: number; height: number; top: number; right: number; bottom: number; left: number } {
    return { width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
  }

  protected serializeAttributes(): string {
    const attrs = new Map(this.attributes);
    const styleValue = serializeStyle(this.styleValues);
    if (styleValue) {
      const currentStyle = attrs.get('style');
      attrs.set('style', currentStyle ? `${currentStyle}; ${styleValue}` : styleValue);
    }

    return Array.from(attrs.entries())
      .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
      .join('');
  }

  private appendChildNode(node: StaticElement | string): void {
    const child = typeof node === 'string' ? new StaticTextNode(node) : node;
    if (child instanceof StaticElement) child.parentElement = this;
    this.children.push(child);
  }

  private walk(visitor: (element: StaticElement) => void): void {
    this.children.forEach((child) => {
      if (!(child instanceof StaticElement)) return;
      visitor(child);
      child.walk(visitor);
    });
  }
}

class StaticCanvasElement extends StaticElement {
  constructor() {
    super('canvas');
  }

  set width(value: number) {
    this.setAttribute('width', String(value));
  }

  get width(): number {
    return Number(this.getAttribute('width') || 0);
  }

  set height(value: number) {
    this.setAttribute('height', String(value));
  }

  get height(): number {
    return Number(this.getAttribute('height') || 0);
  }

  getContext(): null {
    return null;
  }
}

class StaticTextNode {
  readonly textContent: string;

  constructor(textContent: string) {
    this.textContent = textContent;
  }

  get outerHTML(): string {
    return escapeText(this.textContent);
  }
}

class StaticClassList {
  constructor(private readonly element: StaticElement) {}

  add(...tokens: string[]): void {
    const current = new Set(this.read());
    tokens.forEach((token) => {
      if (token) current.add(token);
    });
    this.write(current);
  }

  remove(...tokens: string[]): void {
    const current = new Set(this.read());
    tokens.forEach((token) => current.delete(token));
    this.write(current);
  }

  contains(token: string): boolean {
    return this.read().includes(token);
  }

  toggle(token: string, force?: boolean): boolean {
    const current = new Set(this.read());
    const shouldAdd = force === undefined ? !current.has(token) : force;
    if (shouldAdd) current.add(token);
    else current.delete(token);
    this.write(current);
    return shouldAdd;
  }

  private read(): string[] {
    return (this.element.className || '').split(/\s+/).filter(Boolean);
  }

  private write(tokens: Set<string>): void {
    this.element.className = Array.from(tokens).join(' ');
  }
}

class StaticImage {
  decoding = '';
  loading = '';
  fetchPriority = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;
  private source = '';

  get src(): string {
    return this.source;
  }

  set src(value: string) {
    this.source = value;
  }
}

function createStaticWindow(document: StaticDocument): Record<string, unknown> {
  const window = {
    document,
    location: { search: '' },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    requestAnimationFrame: (callback: (time: number) => void) => {
      callback(0);
      return 0;
    },
    cancelAnimationFrame: () => undefined,
    postMessage: () => undefined,
    URL,
    URLSearchParams,
    Image: StaticImage
  } as Record<string, unknown>;

  window.window = window;
  window.self = window;
  window.top = window;
  window.parent = window;
  return window;
}

function installStaticDomGlobals(document: StaticDocument, window: Record<string, unknown>): () => void {
  const globals: Record<string, unknown> = {
    document,
    window,
    self: window,
    location: window.location,
    Image: StaticImage,
    Element: StaticElement,
    HTMLElement: StaticElement,
    HTMLCanvasElement: StaticCanvasElement,
    HTMLImageElement: StaticImage
  };
  const previous = Object.keys(globals).map((key) => ({
    key,
    hadValue: Object.prototype.hasOwnProperty.call(globalThis, key),
    value: (globalThis as Record<string, unknown>)[key]
  }));

  Object.entries(globals).forEach(([key, value]) => {
    (globalThis as Record<string, unknown>)[key] = value;
  });

  return () => {
    previous.forEach(({ key, hadValue, value }) => {
      if (hadValue) (globalThis as Record<string, unknown>)[key] = value;
      else delete (globalThis as Record<string, unknown>)[key];
    });
  };
}

function matchesSimpleSelector(element: StaticElement, selector: string): boolean {
  if (!selector || selector.includes(' ')) return false;
  const attrMatch = selector.match(/^\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/);
  if (attrMatch) {
    const [, name, value] = attrMatch;
    const attribute = element.getAttribute(name);
    return value === undefined ? attribute !== null : attribute === value;
  }

  const classNames = selector.match(/\.[A-Za-z0-9_-]+/g)?.map((item) => item.slice(1)) || [];
  const tagName = selector.replace(/\.[A-Za-z0-9_-]+/g, '').trim().toLowerCase();
  const tagMatches = !tagName || tagName === element.tagName;
  return tagMatches && classNames.every((className) => element.classList.contains(className));
}

function dataKeyToAttribute(key: string): string {
  return `data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function cssPropertyName(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function serializeStyle(styleValues: Map<string, string>): string {
  return Array.from(styleValues.entries())
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

await main();
