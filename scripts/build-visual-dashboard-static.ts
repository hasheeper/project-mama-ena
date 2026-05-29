import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { build, type InlineConfig } from 'vite';

const rootDir = process.cwd();
const sourceHtmlPath = resolve(rootDir, 'apps/visual-dashboard/index.html');
const outputHtmlPath = resolve(rootDir, 'dist/apps/visual-dashboard/index.html');
const distAssetsDir = resolve(rootDir, 'dist/assets');
const tempDir = resolve(rootDir, '.generated/visual-dashboard-static');
const tempEntryPath = resolve(tempDir, 'entry.ts');
const tempOutDir = resolve(tempDir, 'out');
const tempAssetsDir = resolve(tempOutDir, 'assets');

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
  readFile(resolve(tempOutDir, 'visual-dashboard.js'), 'utf8'),
  readBuiltStyles()
]);

await copyBuiltAssets();
await writeBundledHtml(style, script);

console.log('Bundled dist/apps/visual-dashboard/index.html with inline CSS/JS.');

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
  return rewriteAssetUrls(styles.join('\n'));
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
      `    <style>\n${indentForHtml(style)}\n    </style>\n  </head>`
    )
    .replace(
      /<\/body>/i,
      `    <script type="module">\n${indentForHtml(rewriteAssetUrls(script).replace(/<\/script/gi, '<\\/script'))}\n    </script>\n  </body>`
    );

  await mkdir(dirname(outputHtmlPath), { recursive: true });
  await writeFile(outputHtmlPath, bundledHtml, 'utf8');
}

function rewriteAssetUrls(value: string): string {
  return value
    .replace(/new URL\((["'])assets\//g, 'new URL($1../../assets/')
    .replace(/url\((["']?)assets\//g, 'url($1../../assets/')
    .replace(/(["'])\/assets\//g, '$1../../assets/');
}

function indentForHtml(value: string): string {
  return value
    .trim()
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n');
}
