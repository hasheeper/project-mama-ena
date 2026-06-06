import fs from 'node:fs';
import path from 'node:path';

interface ExpressionRef {
  id: number;
  name: string;
  face: string;
  mouth: string;
  eye: string;
  brow: string;
  nsfw?: boolean;
  other?: string | string[];
  emotion?: string | string[];
}

interface ExpressionData {
  count: number;
  expressions: ExpressionRef[];
}

interface AssetRefs {
  base: string[];
  face: string[];
  eye: string[];
  mouth: string[];
  brow: string[];
  other: string[];
  emotion: string[];
}

interface OutputConfig {
  file: string;
  title: string;
  assetBaseUrl: string;
}

const rootDir = process.cwd();
const expressionDir = path.join(rootDir, 'src/assets/png/standing/expression');
const baseDir = path.join(rootDir, 'src/assets/png/standing/base');
const otherDir = path.join(expressionDir, 'other');
const emotionDir = path.join(rootDir, 'src/assets/png/standing/emotion');
const expDataPath = path.join(expressionDir, 'exp.json');
const assetCachePath = path.join(rootDir, 'apps/st-bridge/packs/mama-main/asset-cache.js');

const outputConfigs: OutputConfig[] = [
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

const expData = JSON.parse(fs.readFileSync(expDataPath, 'utf8')) as ExpressionData;
const assetRefs = collectAssetRefs(expData);

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function collectAssetRefs(data: ExpressionData): AssetRefs {
  return {
    base: fs.readdirSync(baseDir)
      .filter((name) => name.endsWith('.png') && !name.replace(/\.png$/i, '').endsWith('_old'))
      .map((name) => name.replace(/\.png$/i, ''))
      .sort(),
    face: unique(['face_default', 'face_pale', ...data.expressions.map((item) => item.face)]),
    eye: unique(data.expressions.map((item) => item.eye)),
    mouth: unique(data.expressions.map((item) => item.mouth)),
    brow: unique(data.expressions.map((item) => item.brow)),
    other: fs.readdirSync(otherDir)
      .filter((name) => name.endsWith('.png'))
      .map((name) => name.replace(/\.png$/i, ''))
      .sort(),
    emotion: fs.readdirSync(emotionDir)
      .filter((name) => name.endsWith('.png'))
      .map((name) => name.replace(/\.png$/i, ''))
      .sort()
  };
}

function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, '<\\/');
}

function renderHtml({ title, assetBaseUrl }: OutputConfig): string {
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
      -webkit-transform: translate(-50%, -50%);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }

    .mama-standing__canvas {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center bottom;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
      transform: translate3d(0, 0, 0);
      -webkit-transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }

  </style>
</head>
<body>
  <script id="mama-exp" type="application/json">$4</script>
  <main id="mama-exp-app" data-app-id="expression-portrait"></main>

  <script>
    (function () {
      const EXP_DATA = ${scriptJson(expData)};
      const ASSET_REFS = ${scriptJson(assetRefs)};
      const ASSET_BASE_URL = '${assetBaseUrl}';
      const DEFAULT_EXPRESSION = 'exp_smile_soft';
      const DEFAULT_OUTFIT = 'streetwear_full';
      const CACHE_KEY = '__MAMA_EXP_IMAGE_CACHE__';
      const EMOTION_LAYER_RANK = {
        Emotion_HeartBurst: 10,
        Emotion_HeartBubble: 20
      };
      const TOP_EXPRESSION_OTHER_NAMES = new Set(['mist']);
      const FALLBACK_DEFAULTS = {
        face: 'face_default',
        mouth: 'mouth_neutral',
        eye: 'eye_normal',
        brow: 'brow_normal'
      };
      const EXPLICIT_COMPONENT_PRIORITY = 90;
      const VISUAL_KEYWORD_PRIORITY = 50;
      const SECONDARY_KEYWORD_PRIORITY = 40;
      const EMOTION_KEYWORD_PRIORITY = 30;
      const app = document.getElementById('mama-exp-app');
      const hostFrame = window.frameElement;
      let currentExpression = resolveExpression(readExpression()).name;
      let currentOutfit = resolveOutfit(readInitialOutfit());
      let warmAllScheduled = false;

      function readExpression() {
        const dataNode = document.getElementById('mama-exp');
        const raw = (dataNode && (dataNode.textContent || dataNode.innerText) || '').trim();
        if (!raw) return DEFAULT_EXPRESSION;
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'string' || typeof parsed === 'number') return String(parsed).trim() || DEFAULT_EXPRESSION;
        } catch (_) {}
        return raw.replace(/^<ena-exp>|<\\/ena-exp>$/gi, '').replace(/^[\"']|[\"']$/g, '').trim() || DEFAULT_EXPRESSION;
      }

      function resolveExpression(value) {
        const requested = readExpressionName(value);
        if (!requested) return defaultExpression();

        const exact = findExactExpression(requested);
        if (exact) return exact;

        const canonical = canonicalizeExpressionName(requested);
        const normalized = EXP_DATA.expressions.find(function (item) {
          return canonicalizeExpressionName(item.name) === canonical;
        });
        if (normalized) return normalized;

        const typo = findTypoExpression(canonical);
        if (typo) return typo;

        const synthetic = buildSyntheticExpression(requested, canonical);
        return synthetic || defaultExpression();
      }

      function readExpressionName(value) {
        if (value && typeof value === 'object' && typeof value.name === 'string') return normalizeExpressionText(value.name);
        if (typeof value !== 'string' && typeof value !== 'number') return '';
        return normalizeExpressionText(String(value));
      }

      function normalizeExpressionText(value) {
        let text = value.trim();
        try {
          const parsed = JSON.parse(text);
          if (typeof parsed === 'string' || typeof parsed === 'number') text = String(parsed).trim();
        } catch (_) {}
        return text.replace(/<\\/?ena-exp>/gi, '').replace(/^[\\"']+|[\\"']+$/g, '').trim();
      }

      function canonicalizeExpressionName(value) {
        return normalizeExpressionText(value)
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .replace(/^(exp_)+/, '');
      }

      function canonicalizeAssetName(value) {
        return value
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      }

      function findExactExpression(requested) {
        const byId = Number(requested);
        if (Number.isFinite(byId)) {
          return EXP_DATA.expressions.find(function (item) {
            return item.id === Math.round(byId);
          }) || null;
        }
        return EXP_DATA.expressions.find(function (item) {
          return item.name === requested;
        }) || null;
      }

      function findTypoExpression(canonical) {
        if (canonical.length < 5) return null;
        const ranked = EXP_DATA.expressions
          .map(function (item) {
            return { expression: item, distance: levenshtein(canonical, canonicalizeExpressionName(item.name)) };
          })
          .sort(function (a, b) {
            return a.distance - b.distance;
          });
        const best = ranked[0];
        const second = ranked[1];
        if (!best) return null;
        const allowed = best.distance <= 1 || (canonical.length >= 8 && best.distance <= 2);
        const uniqueBest = !second || second.distance > best.distance;
        return allowed && uniqueBest ? best.expression : null;
      }

      function buildSyntheticExpression(sourceName, canonical) {
        const tokens = canonical.split('_').filter(Boolean);
        if (!tokens.length) return null;

        const rules = buildKeywordRules();
        const slots = {
          face: { value: FALLBACK_DEFAULTS.face, priority: 0, order: -1 },
          mouth: { value: FALLBACK_DEFAULTS.mouth, priority: 0, order: -1 },
          eye: { value: FALLBACK_DEFAULTS.eye, priority: 0, order: -1 },
          brow: { value: FALLBACK_DEFAULTS.brow, priority: 0, order: -1 }
        };
        const listSlots = { other: [], emotion: [] };
        const matchedTokens = [];
        const matchedIndexes = new Set();
        let order = 0;

        for (let index = 0; index < tokens.length;) {
          const match = findRuleMatch(tokens, index, rules);
          if (!match) {
            index += 1;
            continue;
          }
          matchedTokens.push(match.alias);
          for (let offset = 0; offset < match.length; offset += 1) matchedIndexes.add(index + offset);
          match.effects.forEach(function (effect) {
            applyKeywordEffect(effect, slots, listSlots, order);
          });
          order += 1;
          index += match.length;
        }

        if (!matchedTokens.length) return null;
        const expression = {
          id: 0,
          name: 'exp_' + canonical,
          face: slots.face.value,
          mouth: slots.mouth.value,
          eye: slots.eye.value,
          brow: slots.brow.value,
          synthetic: true,
          sourceName,
          matchedTokens: unique(matchedTokens),
          unmatchedTokens: unique(tokens.filter(function (_, index) {
            return !matchedIndexes.has(index);
          }))
        };
        if (listSlots.other.length) expression.other = listSlots.other;
        if (listSlots.emotion.length) expression.emotion = listSlots.emotion;
        return expression;
      }

      function buildKeywordRules() {
        const rules = new Map();
        addExplicitAssetRules(rules, 'face', 'face_', ASSET_REFS.face);
        addExplicitAssetRules(rules, 'mouth', 'mouth_', ASSET_REFS.mouth);
        addExplicitAssetRules(rules, 'eye', 'eye_', ASSET_REFS.eye);
        addExplicitAssetRules(rules, 'brow', 'brow_', ASSET_REFS.brow);
        addExplicitAssetRules(rules, 'other', '', ASSET_REFS.other);
        addExplicitAssetRules(rules, 'emotion', 'Emotion_', ASSET_REFS.emotion);
        addKeywordRules(rules);
        return rules;
      }

      function addKeywordRules(rules) {
        addRuleIfAvailable(rules, 'jitome', [{ slot: 'eye', value: 'eye_jitome', priority: VISUAL_KEYWORD_PRIORITY }]);
        addRuleIfAvailable(rules, 'pout', [
          { slot: 'mouth', value: 'mouth_pout_2', priority: VISUAL_KEYWORD_PRIORITY },
          { slot: 'brow', value: 'brow_up_max', priority: SECONDARY_KEYWORD_PRIORITY }
        ]);
        [
          ['smile', 'mouth', 'mouth_smile'], ['smirk', 'mouth', 'mouth_smirk_1'], ['laugh', 'mouth', 'mouth_laugh'],
          ['cat', 'mouth', 'mouth_cat'], ['huh', 'mouth', 'mouth_huh'], ['drool', 'mouth', 'mouth_drool'],
          ['chu', 'mouth', 'mouth_chu'], ['shock', 'mouth', 'mouth_shock'], ['panic', 'mouth', 'mouth_panic_open'],
          ['awawa', 'mouth', 'mouth_awawa'], ['tremble', 'mouth', 'mouth_tremble_1'], ['blank', 'mouth', 'mouth_blank_1'],
          ['fang', 'mouth', 'mouth_fang_open'], ['tongue', 'mouth', 'mouth_tongue_2'], ['closed', 'eye', 'eye_closed_1'],
          ['wink', 'eye', 'eye_wink_2'], ['line', 'eye', 'eye_line'], ['slit', 'eye', 'eye_slit'],
          ['xd', 'eye', 'eye_xd'], ['wide', 'eye', 'eye_wide'], ['cry', 'eye', 'eye_cry_2'],
          ['dizzy', 'eye', 'eye_dizzy_2'], ['puppy', 'eye', 'eye_puppy'], ['dark', 'eye', 'eye_dark'],
          ['disgust', 'eye', 'eye_disgust'], ['roll', 'eye', 'eye_roll'], ['avert', 'eye', 'eye_avert'],
          ['up', 'brow', 'brow_up'], ['down', 'brow', 'brow_down'], ['up_max', 'brow', 'brow_up_max'],
          ['down_max', 'brow', 'brow_down_max'], ['question', 'brow', 'brow_question'], ['shadow', 'face', 'face_shadow'],
          ['pale', 'face', 'face_pale'], ['heavy', 'face', 'face_blush_heavy'], ['light', 'face', 'face_blush_light'],
          ['sweat', 'other', 'sweat'], ['mist', 'other', 'mist']
        ].forEach(function (item) {
          addRuleIfAvailable(rules, item[0], [{ slot: item[1], value: item[2], priority: VISUAL_KEYWORD_PRIORITY }]);
        });
        addRuleIfAvailable(rules, 'neutral', [{ slot: 'mouth', value: 'mouth_neutral', priority: SECONDARY_KEYWORD_PRIORITY }]);
        addRuleIfAvailable(rules, 'normal', [{ slot: 'brow', value: 'brow_normal', priority: SECONDARY_KEYWORD_PRIORITY }]);
        addRuleIfAvailable(rules, 'default', [{ slot: 'face', value: 'face_default', priority: SECONDARY_KEYWORD_PRIORITY }]);
        addRuleIfAvailable(rules, 'blush', [{ slot: 'face', value: 'face_blush_light', priority: SECONDARY_KEYWORD_PRIORITY }]);
        addRuleIfAvailable(rules, 'half', [{ slot: 'eye', value: 'eye_half_1', priority: SECONDARY_KEYWORD_PRIORITY }]);
        addRuleIfAvailable(rules, 'drowsy', [
          { slot: 'eye', value: 'eye_slit', priority: VISUAL_KEYWORD_PRIORITY },
          { slot: 'emotion', value: 'Emotion_Sleepy', priority: EMOTION_KEYWORD_PRIORITY }
        ]);
        addRuleIfAvailable(rules, 'star', [
          { slot: 'eye', value: 'eye_star', priority: VISUAL_KEYWORD_PRIORITY },
          { slot: 'emotion', value: 'Emotion_Star', priority: EMOTION_KEYWORD_PRIORITY }
        ]);
        addRuleIfAvailable(rules, 'heart', [
          { slot: 'eye', value: 'eye_heart', priority: VISUAL_KEYWORD_PRIORITY },
          { slot: 'emotion', value: 'Emotion_Heart', priority: EMOTION_KEYWORD_PRIORITY }
        ]);
        [
          ['angry', 'Emotion_Angry'], ['sleepy', 'Emotion_Sleepy'], ['sparkle', 'Emotion_Sparkle'],
          ['confusion', 'Emotion_Confusion'], ['confused', 'Emotion_Confusion'], ['fearful', 'Emotion_Fearful'],
          ['surprise', 'Emotion_Surprise'], ['cloud', 'Emotion_Cloud'], ['heartbubble', 'Emotion_HeartBubble'],
          ['heart_bubble', 'Emotion_HeartBubble'], ['heartburst', 'Emotion_HeartBurst'],
          ['heart_burst', 'Emotion_HeartBurst'], ['zzz', 'Emotion_zzz']
        ].forEach(function (item) {
          addRuleIfAvailable(rules, item[0], [{ slot: 'emotion', value: item[1], priority: EMOTION_KEYWORD_PRIORITY }]);
        });
      }

      function addExplicitAssetRules(rules, slot, prefix, names) {
        names.forEach(function (name) {
          const canonical = canonicalizeAssetName(name);
          const stripped = prefix ? canonicalizeAssetName(name.replace(new RegExp('^' + prefix, 'i'), '')) : canonical;
          const effect = { slot, value: name, priority: EXPLICIT_COMPONENT_PRIORITY };
          addRule(rules, canonical, [effect]);
          addRule(rules, stripped, [effect]);
        });
      }

      function addRuleIfAvailable(rules, alias, effects) {
        const available = effects.filter(function (effect) {
          return ASSET_REFS[effect.slot] && ASSET_REFS[effect.slot].includes(effect.value);
        });
        if (available.length) addRule(rules, alias, available);
      }

      function addRule(rules, alias, effects) {
        const canonical = canonicalizeAssetName(alias);
        if (!canonical) return;
        unique([canonical, canonical.replace(/_/g, '')]).forEach(function (item) {
          rules.set(item, (rules.get(item) || []).concat(effects));
        });
      }

      function findRuleMatch(tokens, index, rules) {
        const maxLength = Math.min(4, tokens.length - index);
        for (let length = maxLength; length >= 1; length -= 1) {
          const alias = tokens.slice(index, index + length).join('_');
          const effects = rules.get(alias);
          if (effects) return { alias, effects, length };
        }
        const fuzzyAlias = findFuzzyRuleAlias(tokens[index], rules);
        const fuzzyEffects = fuzzyAlias ? rules.get(fuzzyAlias) : null;
        return fuzzyAlias && fuzzyEffects ? { alias: fuzzyAlias, effects: fuzzyEffects, length: 1 } : null;
      }

      function findFuzzyRuleAlias(token, rules) {
        if (token.length < 4) return null;
        const ranked = Array.from(rules.keys())
          .filter(function (alias) { return !alias.includes('_') && alias.length >= 4; })
          .map(function (alias) { return { alias, distance: levenshtein(token, alias) }; })
          .sort(function (a, b) { return a.distance - b.distance; });
        const best = ranked[0];
        const second = ranked[1];
        if (!best) return null;
        const allowed = best.distance <= 1 || (token.length >= 6 && best.distance <= 2);
        const uniqueBest = !second || second.distance > best.distance;
        return allowed && uniqueBest ? best.alias : null;
      }

      function applyKeywordEffect(effect, slots, listSlots, order) {
        if (effect.slot === 'other' || effect.slot === 'emotion') {
          if (!listSlots[effect.slot].includes(effect.value)) listSlots[effect.slot].push(effect.value);
          return;
        }
        const current = slots[effect.slot];
        if (effect.priority > current.priority || (effect.priority === current.priority && order >= current.order)) {
          slots[effect.slot] = { value: effect.value, priority: effect.priority, order };
        }
      }

      function defaultExpression() {
        return EXP_DATA.expressions.find(function (item) {
          return item.name === DEFAULT_EXPRESSION;
        }) || EXP_DATA.expressions[0];
      }

      function levenshtein(a, b) {
        const previous = Array.from({ length: b.length + 1 }, function (_, index) { return index; });
        const current = Array.from({ length: b.length + 1 }, function () { return 0; });
        for (let row = 1; row <= a.length; row += 1) {
          current[0] = row;
          for (let column = 1; column <= b.length; column += 1) {
            const cost = a[row - 1] === b[column - 1] ? 0 : 1;
            current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + cost);
          }
          for (let column = 0; column <= b.length; column += 1) previous[column] = current[column];
        }
        return previous[b.length];
      }

      function unique(values) {
        return Array.from(new Set(values.filter(Boolean)));
      }

      function readInitialOutfit() {
        try {
          const params = new URLSearchParams(location.search || '');
          return params.get('outfit') || DEFAULT_OUTFIT;
        } catch (_) {
          return DEFAULT_OUTFIT;
        }
      }

      function resolveOutfit(value) {
        const requested = String(value || DEFAULT_OUTFIT).trim() || DEFAULT_OUTFIT;
        return ASSET_REFS.base.includes(requested) ? requested : DEFAULT_OUTFIT;
      }

      function assetUrl(group, name) {
        const folders = {
          base: 'base',
          face: 'expression/face_fx',
          eye: 'expression/eyes',
          mouth: 'expression/mouth',
          brow: 'expression/brow',
          other: 'expression/other',
          emotion: 'emotion'
        };
        return ASSET_BASE_URL.replace(/\\/+$/, '') + '/' + folders[group] + '/' + encodeURIComponent(name) + '.png';
      }

      function resolveMoodLayers(expression, outfit) {
        const mood = expression.face === 'face_shadow'
          ? 'shadow'
          : expression.face === 'face_pale'
            ? 'pale'
            : '';
        if (!mood) return { under: '', top: '' };
        const underVariant = outfit === 'nephilim' || outfit === 'seraphim' ? '3' : '2';
        return {
          under: assetUrl('other', mood + '_' + underVariant),
          top: assetUrl('other', mood + '_1')
        };
      }

      function resolveExpressionOtherUrls(expression, placement) {
        const names = Array.isArray(expression.other)
          ? expression.other
          : expression.other
            ? [expression.other]
            : [];
        return names
          .filter((name) => placement === 'overlay' ? TOP_EXPRESSION_OTHER_NAMES.has(name) : !TOP_EXPRESSION_OTHER_NAMES.has(name))
          .filter((name) => ASSET_REFS.other.includes(name))
          .map((name) => assetUrl('other', name));
      }

      function resolveExpressionEmotionUrls(expression) {
        const names = Array.isArray(expression.emotion)
          ? expression.emotion
          : expression.emotion
            ? [expression.emotion]
            : [];
        return sortEmotionLayerNames(names)
          .filter((name) => ASSET_REFS.emotion.includes(name))
          .map((name) => assetUrl('emotion', name));
      }

      function sortEmotionLayerNames(names) {
        return names
          .map(function (name, index) {
            return { name, index };
          })
          .sort(function (a, b) {
            return (EMOTION_LAYER_RANK[a.name] || 0) - (EMOTION_LAYER_RANK[b.name] || 0) || a.index - b.index;
          })
          .map(function (item) {
            return item.name;
          });
      }

      function getCriticalUrls(expression, outfit) {
        const moodLayers = resolveMoodLayers(expression, outfit || DEFAULT_OUTFIT);
        const urls = [
          assetUrl('face', 'face_default'),
          expression.face !== 'face_default' ? assetUrl('face', expression.face) : '',
          assetUrl('mouth', expression.mouth || 'mouth_neutral'),
          ...resolveExpressionOtherUrls(expression, 'under'),
          assetUrl('base', outfit || DEFAULT_OUTFIT),
          assetUrl('eye', expression.eye || 'eye_normal'),
          moodLayers.under,
          assetUrl('brow', expression.brow || 'brow_normal'),
          moodLayers.top,
          ...resolveExpressionEmotionUrls(expression),
          ...resolveExpressionOtherUrls(expression, 'overlay')
        ];
        return urls.filter(Boolean);
      }

      function getAllAssetUrls() {
        return [].concat(
          ASSET_REFS.base.map((name) => assetUrl('base', name)),
          ASSET_REFS.face.map((name) => assetUrl('face', name)),
          ASSET_REFS.mouth.map((name) => assetUrl('mouth', name)),
          ASSET_REFS.eye.map((name) => assetUrl('eye', name)),
          ASSET_REFS.brow.map((name) => assetUrl('brow', name)),
          ASSET_REFS.other.map((name) => assetUrl('other', name)),
          ASSET_REFS.emotion.map((name) => assetUrl('emotion', name))
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

      function makeLayer(src) {
        return src ? { url: src } : null;
      }

      function resolveLayers(expression, outfit) {
        const moodLayers = resolveMoodLayers(expression, outfit || DEFAULT_OUTFIT);
        return [
          makeLayer(assetUrl('face', 'face_default')),
          expression.face !== 'face_default' ? makeLayer(assetUrl('face', expression.face)) : null,
          makeLayer(assetUrl('mouth', expression.mouth || 'mouth_neutral')),
          ...resolveExpressionOtherUrls(expression, 'under').map(function (url) {
            return makeLayer(url);
          }),
          makeLayer(assetUrl('base', outfit || DEFAULT_OUTFIT)),
          makeLayer(assetUrl('eye', expression.eye || 'eye_normal')),
          makeLayer(moodLayers.under),
          makeLayer(assetUrl('brow', expression.brow || 'brow_normal')),
          makeLayer(moodLayers.top),
          ...resolveExpressionEmotionUrls(expression).map(function (url) {
            return makeLayer(url);
          }),
          ...resolveExpressionOtherUrls(expression, 'overlay').map(function (url) {
            return makeLayer(url);
          })
        ].filter(Boolean);
      }

      function createStandingCanvas(layers) {
        const canvas = document.createElement('canvas');
        canvas.className = 'mama-standing__canvas';
        canvas.width = 2048;
        canvas.height = 2048;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.dataset.layerCount = String(layers.length);
        paintStandingCanvas(canvas, layers);
        return canvas;
      }

      async function paintStandingCanvas(canvas, layers) {
        const images = await Promise.all(layers.map(function (layer) {
          return loadCanvasImage(layer.url);
        }));
        const drawableImages = images.filter(Boolean);
        const firstImage = drawableImages[0];
        const width = firstImage && firstImage.naturalWidth || 2048;
        const height = firstImage && firstImage.naturalHeight || 2048;
        const context = canvas.getContext('2d');
        if (!context) return;

        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        context.clearRect(0, 0, width, height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        drawableImages.forEach(function (image) {
          context.drawImage(image, 0, 0, width, height);
        });
        canvas.dataset.rendered = 'true';
      }

      function loadCanvasImage(src) {
        return new Promise(function (resolve) {
          if (!src) {
            resolve(null);
            return;
          }

          let settled = false;
          function done(image) {
            if (settled) return;
            settled = true;
            resolve(image);
          }

          const image = new Image();
          image.decoding = 'async';
          image.loading = 'eager';
          try { image.fetchPriority = 'high'; } catch (_) {}
          image.onload = function () { done(image); };
          image.onerror = function () { done(null); };
          image.src = src;

          if (image.complete && image.naturalWidth > 0) {
            done(image);
          }
        });
      }

      function applyState(state) {
        if (!state || typeof state !== 'object') return false;
        const nextOutfit = resolveOutfit(state.outfit);
        if (nextOutfit === currentOutfit) return false;
        currentOutfit = nextOutfit;
        render();
        return true;
      }

      function getHostTargets() {
        const targets = [window];
        try { targets.push(window.parent); } catch (_) {}
        try { targets.push(window.top); } catch (_) {}
        return targets.filter(Boolean);
      }

      async function requestDirectState() {
        for (const target of getHostTargets()) {
          try {
            if (target.MAMAPlugin && typeof target.MAMAPlugin.loadState === 'function') {
              const state = await target.MAMAPlugin.loadState({ persist: false });
              if (applyState(state)) return true;
            }
          } catch (_) {}
          try {
            if (target.STBridge && target.STBridge.mvuz && typeof target.STBridge.mvuz.read === 'function') {
              const state = await target.STBridge.mvuz.read('mama', { persist: false });
              if (applyState(state)) return true;
            }
          } catch (_) {}
        }
        return false;
      }

      function requestHostState() {
        getHostTargets().forEach(function (target) {
          try {
            if (target && typeof target.postMessage === 'function') {
              target.postMessage({
                type: 'MAMA_STATUS_REQUEST',
                appId: 'visual-dashboard',
                reason: 'expressionPortrait'
              }, '*');
            }
          } catch (_) {}
        });
        requestDirectState();
      }

      function render() {
        if (!app) return;
        const expression = resolveExpression(currentExpression);
        app.dataset.expression = expression.name;
        app.dataset.outfit = currentOutfit;
        warmImageCache(getCriticalUrls(expression, currentOutfit));
        scheduleWarmAll();

        const frame = document.createElement('section');
        frame.className = 'portrait-frame';
        frame.title = expression.name + ' / ' + currentOutfit;

        const crop = document.createElement('div');
        crop.className = 'portrait-crop';

        const figure = document.createElement('figure');
        figure.className = 'mama-standing';
        figure.dataset.outfit = currentOutfit;
        figure.dataset.expression = expression.name;
        figure.setAttribute('aria-label', 'Ena ' + currentOutfit + ' ' + expression.name);
        figure.append(createStandingCanvas(resolveLayers(expression, currentOutfit)));

        crop.append(figure);
        frame.append(crop);
        app.replaceChildren(frame);
      }

      resizeHostFrame();
      render();
      requestHostState();
      setTimeout(requestHostState, 250);
      window.addEventListener('resize', resizeHostFrame);
      window.addEventListener('message', function (event) {
        const data = event && event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'MAMA_STATE_PUSH') {
          applyState(data.state);
          return;
        }
        if (data.type !== 'MAMA_EXP_DATA') return;
        currentExpression = resolveExpression(data.expression).name;
        if (data.outfit !== undefined) currentOutfit = resolveOutfit(data.outfit);
        render();
      });
    })();
  </script>
</body>
</html>
\`\`\`
`;
}

function renderAssetCacheScript(): string {
  return `/**
   * Prewarms MAMA expression PNGs into the browser image cache.
   * Generated by scripts/build-mama-exp-regex.ts.
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
      brow: 'expression/brow',
      other: 'expression/other',
      emotion: 'emotion'
    };
    return baseUrl + '/' + folders[group] + '/' + encodeURIComponent(name) + '.png';
  }

  function getAllAssetUrls(baseUrl) {
    return [].concat(
      ASSET_REFS.base.map((name) => assetUrl(baseUrl, 'base', name)),
      ASSET_REFS.face.map((name) => assetUrl(baseUrl, 'face', name)),
      ASSET_REFS.mouth.map((name) => assetUrl(baseUrl, 'mouth', name)),
      ASSET_REFS.eye.map((name) => assetUrl(baseUrl, 'eye', name)),
      ASSET_REFS.brow.map((name) => assetUrl(baseUrl, 'brow', name)),
      ASSET_REFS.other.map((name) => assetUrl(baseUrl, 'other', name)),
      ASSET_REFS.emotion.map((name) => assetUrl(baseUrl, 'emotion', name))
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
