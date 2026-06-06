import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveExpressionWithFallback,
  type ExpressionFallbackAssets,
  type ExpressionLayerRef
} from '../src/mama/expression-fallback.js';

interface ExpressionData {
  expressions: ExpressionLayerRef[];
}

const rootDir = process.cwd();
const expressionDir = join(rootDir, 'src/assets/png/standing/expression');
const data = JSON.parse(readFileSync(join(expressionDir, 'exp.json'), 'utf8')) as ExpressionData;
const assets: ExpressionFallbackAssets = {
  face: readPngNames(join(expressionDir, 'face_fx')),
  mouth: readPngNames(join(expressionDir, 'mouth')),
  eye: readPngNames(join(expressionDir, 'eyes')),
  brow: readPngNames(join(expressionDir, 'brow')),
  other: readPngNames(join(expressionDir, 'other')),
  emotion: readPngNames(join(rootDir, 'src/assets/png/standing/emotion'))
};

const exact = resolve('exp_jitome_glare');
assert(exact.name === 'exp_jitome_glare' && !exact.synthetic, 'exact preset should remain unchanged');

const synthetic = resolve('exp_jitome_pout');
assert(synthetic.synthetic === true, 'exp_jitome_pout should become synthetic');
assert(synthetic.face === 'face_default', 'synthetic face should default');
assert(synthetic.mouth === 'mouth_pout_2', 'synthetic pout mouth should resolve');
assert(synthetic.eye === 'eye_jitome', 'synthetic jitome eye should resolve');
assert(synthetic.brow === 'brow_up_max', 'synthetic pout brow should resolve');
assert(synthetic.matchedTokens?.includes('jitome') && synthetic.matchedTokens.includes('pout'), 'synthetic tokens should be recorded');

const singleKeyword = resolve('exp_jitome');
assert(singleKeyword.synthetic === true && singleKeyword.eye === 'eye_jitome', 'single keyword should synthesize');

const invalid = resolve('exp_totally_fake_unknown');
assert(invalid.name === 'exp_smile_soft' && !invalid.synthetic, 'invalid expression should fall back to default');

const typo = resolve('exp_jitome_galre');
assert(typo.name === 'exp_jitome_glare' && !typo.synthetic, 'high-confidence typo should resolve to existing preset');

const tokenTypo = resolve('exp_jitmoe_pout');
assert(tokenTypo.synthetic === true && tokenTypo.eye === 'eye_jitome' && tokenTypo.mouth === 'mouth_pout_2', 'token typo should synthesize safely');

console.log('Expression fallback checks passed.');

function resolve(value: unknown): ExpressionLayerRef {
  return resolveExpressionWithFallback(value, data.expressions, 'exp_smile_soft', assets);
}

function readPngNames(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.png'))
    .map((name) => name.replace(/\.png$/i, ''))
    .sort();
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
