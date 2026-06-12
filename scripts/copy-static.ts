import { cp, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const pairs: Array<[string, string]> = [
  ['registry', 'dist/registry'],
  ['apps/st-bridge', 'dist/apps/st-bridge'],
  ['ST', 'dist/ST'],
  ['src/assets/png/standing', 'dist/mama-assets/standing'],
  ['src/assets/mp3/bgm/ena_bgm.mp3', 'dist/mama-assets/audio/ena_bgm.mp3']
];

await mkdir('dist', { recursive: true });

for (const [source, target] of pairs) {
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target, {
    recursive: true,
    filter: (path) => !path.endsWith('.DS_Store') && !path.endsWith('_old.png')
  });
}
