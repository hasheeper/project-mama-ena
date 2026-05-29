import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        appContainer: resolve(__dirname, 'containers/app.html'),
        tavernContainer: resolve(__dirname, 'containers/tavern.html'),
        dashboard: resolve(__dirname, 'apps/dashboard/index.html'),
        visualDashboard: resolve(__dirname, 'apps/visual-dashboard/index.html'),
        expressionPortrait: resolve(__dirname, 'apps/expression-portrait/index.html'),
        layerDebug: resolve(__dirname, 'apps/layer-debug/index.html'),
        conceptPreview: resolve(__dirname, 'apps/concept-preview/index.html')
      }
    }
  }
});
