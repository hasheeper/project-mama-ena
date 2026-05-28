import { resolve } from 'node:path';
import { build, type InlineConfig } from 'vite';

type BridgeFormat = 'es' | 'iife';

interface BridgeEntry {
  input: string;
  outDir: string;
  fileName: string;
  format: BridgeFormat;
  name: string;
}

const rootDir = process.cwd();

const entries: BridgeEntry[] = [
  {
    input: 'src/st-bridge/bridge.ts',
    outDir: 'apps/st-bridge',
    fileName: 'bridge.js',
    format: 'iife',
    name: 'MAMA_ST_BRIDGE'
  },
  {
    input: 'src/st-bridge/packs/mama-main/schema.ts',
    outDir: 'apps/st-bridge/packs/mama-main',
    fileName: 'schema.js',
    format: 'es',
    name: 'MAMA_SCHEMA'
  },
  {
    input: 'src/st-bridge/packs/mama-main/state-replay.ts',
    outDir: 'apps/st-bridge/packs/mama-main',
    fileName: 'state-replay.js',
    format: 'iife',
    name: 'MAMA_STATE_REPLAY'
  },
  {
    input: 'src/st-bridge/packs/mama-main/prompt-injection.ts',
    outDir: 'apps/st-bridge/packs/mama-main',
    fileName: 'prompt-injection.js',
    format: 'iife',
    name: 'MAMA_PROMPT_INJECTION'
  },
  {
    input: 'src/st-bridge/packs/mama-main/status-host.ts',
    outDir: 'apps/st-bridge/packs/mama-main',
    fileName: 'status-host.js',
    format: 'iife',
    name: 'MAMA_STATUS_HOST'
  },
  {
    input: 'src/st-bridge/packs/mama-main/plugin.ts',
    outDir: 'apps/st-bridge/packs/mama-main',
    fileName: 'plugin.js',
    format: 'iife',
    name: 'MAMA_MAIN_PACK'
  }
];

function makeConfig(entry: BridgeEntry): InlineConfig {
  const input = resolve(rootDir, entry.input);
  const outDir = resolve(rootDir, entry.outDir);

  return {
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: false,
      target: 'es2020',
      sourcemap: false,
      minify: false,
      cssCodeSplit: false,
      lib: {
        entry: input,
        name: entry.name,
        formats: [entry.format],
        fileName: () => entry.fileName
      },
      rollupOptions: {
        external: (id) => /^https?:\/\//i.test(id),
        output: {
          entryFileNames: entry.fileName,
          inlineDynamicImports: true,
          extend: false
        }
      }
    }
  };
}

for (const entry of entries) {
  await build(makeConfig(entry));
  console.log(`Built ${entry.outDir}/${entry.fileName}`);
}
