import { cp, mkdir } from 'node:fs/promises';

const pairs = [
  ['registry', 'dist/registry'],
  ['apps/st-bridge', 'dist/apps/st-bridge'],
  ['ST', 'dist/ST'],
  ['src/assets/png/standing', 'dist/mama-assets/standing']
];

await mkdir('dist', { recursive: true });

for (const [source, target] of pairs) {
  await cp(source, target, {
    recursive: true,
    filter: (path) => !path.endsWith('.DS_Store')
  });
}
