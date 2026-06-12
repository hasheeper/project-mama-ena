# project-mama-ena

Static GitHub Pages app shell for Project M.A.M.A. ENA.

## Local Flow

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

## SillyTavern Local Host

本机酒馆联调可以不等 GitHub Pages。先构建并启动本机静态 host：

```bash
npm run local
```

或者已经构建过时只启动 host：

```bash
npm run host:local
```

默认地址是 `http://127.0.0.1:4173`，同时兼容 GitHub Pages 路径前缀 `http://127.0.0.1:4173/project-mama-ena/`。酒馆助手脚本可以直接加载本地 host 入口，它会暴露 JS-Slash-Runner API，并在脚本加载失败、加载过慢、接口缺失时通过酒馆弹窗/Toast 提示。

```js
import 'http://127.0.0.1:4173/apps/st-bridge/mama-bridge-loader.js?env=local&force=1&v=dev';
```

如果要粘贴完整脚本，也可以复制 `ST/mama-bridge-loader.js` 到 JS-Slash-Runner。切换 GitHub Pages 时使用 `?env=prod`，或在完整脚本前设置 `window.MAMA_LOADER_ENV = 'prod'`。

本机正则 wrapper 使用 `ST/regex/local/MAMA_EXP.local.html`。验证入口：

- `http://127.0.0.1:4173/apps/st-bridge/bridge.js`
- `http://127.0.0.1:4173/apps/st-bridge/manifest.json`
- `http://127.0.0.1:4173/apps/visual-dashboard/index.html`
- `http://127.0.0.1:4173/mama-assets/standing/expression/exp.json`

## Architecture

- `index.html` is the canonical GitHub Pages app container.
- `registry/apps.json` is the source of truth for app routing.
- `containers/app.html` and `containers/tavern.html` are thin iframe hosts.
- `src/protocol/` defines typed `postMessage` contracts.
- `src/st-bridge/` is the TypeScript source for the SillyTavern bridge.
- `apps/st-bridge/bridge.js` is the generated stable SillyTavern loader.
- `apps/st-bridge/manifest.json` selects bridge packs and load order.
- `apps/concept-preview/index.html` preserves the original visual concept page.

## Bridge MVUZ

The bridge exposes a minimal MVUZ layer on `window.STBridge.mvuz`:

- `registerSchema(namespace, schema)`
- `read(namespace)`
- `write(namespace, state)`
- `patch(namespace, patcher)`
- `migrate(namespace, legacyVars)`

The default namespace is `mama`, stored at `stat_data.mama`.
