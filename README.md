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

## Architecture

- `index.html` is the canonical GitHub Pages app container.
- `registry/apps.json` is the source of truth for app routing.
- `containers/app.html` and `containers/tavern.html` are thin iframe hosts.
- `src/protocol/` defines typed `postMessage` contracts.
- `apps/st-bridge/bridge.js` is the stable SillyTavern loader.
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
