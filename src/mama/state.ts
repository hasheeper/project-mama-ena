export const MAMA_TIME_PHASES = ['morning', 'noon', 'dusk', 'night'] as const;
export type MamaTimePhase = (typeof MAMA_TIME_PHASES)[number];

export const MAMA_TIME_PHASE_LABELS: Record<MamaTimePhase, string> = {
  morning: '晨',
  noon: '午',
  dusk: '暮',
  night: '夜'
};

export const MAMA_OUTFIT_DETAILS = {
  outfit_winter: {
    visuals: 'Oversized cream cable-knit sweater, thick red scarf hiding her chin, grey pleated skirt, and dark tights.',
    vibe: 'Cozy, warm, cute, and slightly vulnerable to the cold.',
    triggers: 'Winter environments, snowing outside, or winter dates.',
    action_cues: 'Burying half her face in the red scarf, pulling her long sleeves over her hands to keep warm, breath visible in the cold air.'
  },
  school_uniform: {
    visuals: 'White dress shirt, a slightly loose light blue tie, an unbuttoned beige oversized cardigan, and a dark plaid pleated skirt.',
    vibe: 'Relaxed, casual, and a bit sloppy in a cute way. Classic everyday schoolgirl energy.',
    triggers: 'School scenes, classrooms, lunch breaks, or walking home together after school.',
    action_cues: 'Fiddling with her loose tie, grabbing the edge of her oversized cardigan, sleeves slipping down her shoulders slightly, walking with a light bounce.'
  },
  nightwear: {
    visuals: 'White ruffled camisole with one spaghetti strap slipping down, light blue and white striped shorts, and a loose pink zip-up hoodie half-falling off her shoulders.',
    vibe: 'Intimate, unguarded, sleepy, and effortlessly cute. Shows complete trust in the viewer.',
    triggers: 'Late night conversations, waking up in the morning, sleepovers, or relaxing in her bedroom.',
    action_cues: 'Sleepily pulling her falling camisole strap back up, huddling into the oversized pink hoodie, rubbing her sleepy eyes, lazily stretching her arms.'
  },
  streetwear_inner: {
    visuals: "A black-and-white split T-shirt with a 'broken heart' graphic, grey pleated mini-skirt. Asymmetrical legs: loose white slouch sock on the right, and a tight pink/white striped thigh-high on the left.",
    vibe: 'Casual, lazy Harajuku style. Extremely comfortable and slightly sloppy at-home look.',
    triggers: 'Relaxing indoors, hanging out in her room, playing games or resting.',
    action_cues: 'Stretching her bare arms, tugging at the hem of her loose T-shirt, kicking her feet playfully.'
  },
  streetwear_full: {
    visuals: "Same as 'streetwear_inner', but topped with an incredibly oversized holographic sports jacket (shifting from light blue to purple/white). Zipped only halfway.",
    vibe: 'Street-smart, trendy, lazy, and effortlessly attractive.',
    triggers: 'Going out for a walk, casual dates, shopping in the city.',
    action_cues: 'The oversized jacket constantly slipping off one shoulder revealing her collarbone, burying her hands deep in the giant jacket pockets.'
  },
  seraphim: {
    visuals: 'Traditional pure white and blue magical girl dress. Off-shoulder straight collarbone, multiple layers of lace and ruffles with silver trims. Pure white wing hairpin. Single white thigh-high with a ruffled garter, crystal shoes.',
    weapon: '[White Moon-Star Wand] - A classic holy staff radiating pure white healing waves.',
    vibe: 'Holy, pure, healing, and absolute traditional magical girl heroism.',
    triggers: 'Saving the protagonist, healing injuries, facing pure evil with determination.',
    action_cues: 'Floating gracefully with glowing blue/white ribbons and starlight particles. Gripping her wand tightly with a resolute, angelic expression.'
  },
  nephilim: {
    visuals: 'Hair fades from white to pitch black with glowing cyan streaks. Black wing hairpin trailing cyan light. Shattered half-black/half-white gothic dress with torn black lace. Intense glowing neon cyan magic fissures on her left thigh and skirt.',
    weapon: '[Black Feather Night-Chain Wand] - A dark, thorny, corrupted version of her wand emitting low-pressure violent magic.',
    vibe: 'Corrupted, intimidating, highly aggressive, and dangerously protective (yandere-adjacent).',
    triggers: 'Extreme rage, protagonist gets hurt entirely, losing control, or entering a berserker state.',
    action_cues: 'Floating amidst shattered glass shards and glowing cyan chains. Glaring with piercing, intense neon eyes. Swinging her dark wand with terrifying, devastating force.'
  },
  underwear: {
    visuals: 'Simple, modest plain white underwear.',
    vibe: 'Vulnerable and highly embarrassing if seen by others.',
    triggers: 'Changing clothes in the locker room, accidental walk-in events, or high-intimacy sleepover scenes.',
    action_cues: 'Quickly covering herself with her hands, blushing heavily, or throwing a pillow at whoever walked in.'
  },
  nude: {
    visuals: 'Completely unclothed, revealing a petite and very flat/modest figure.',
    vibe: 'Maximum vulnerability. Can be relaxing (if alone) or chaotic (if interrupted).',
    triggers: 'Taking a bath, visiting a hot spring, or special R-rated story events.',
    action_cues: 'Sinking below the bathwater to hide up to her nose, crossing arms defensively over her flat chest, turning away with a bright red face.'
  }
} as const;

export type MamaOutfitDetailKey = keyof typeof MAMA_OUTFIT_DETAILS;

export const MAMA_MASCOT_EXPRESSIONS = {
  neruru_default: 'Cute, neutral smiling mascot.',
  neruru_happy: 'Big happy smile, radiating joyful energy.',
  neruru_laughing: 'Laughing out loud with (> <) eyes and crossed arms.',
  neruru_playful: 'Cheeky wink with a star popping out. Playful and energetic.',
  neruru_confident: 'Eyes closed, chin up, shining with sparkles. Very proud.',
  neruru_shy: 'Heavy blush, holding hands together with floating hearts.',
  neruru_starstruck: 'Starry eyes and hearts. Mesmerized by food, shiny things, or extreme excitement.',
  neruru_eating: 'Munching happily on a cookie.',
  neruru_sad: 'Tearing up with a small raincloud 🌧️ overhead. Very sad or feeling pitiful.',
  neruru_angry: 'Pouting with arms crossed and a red anger mark 💢. Cute but mad.',
  neruru_shock: 'Blank white eyes, jaw dropped with an exclamation mark ❗. Total shock.',
  neruru_nervous: 'Sweating profusely 💧, looking worried or guilty.',
  neruru_confused: 'Tilting head with a question mark ❓. Not understanding the situation.',
  neruru_sleepy: 'Dozing off while standing, featuring a classic sleepy snot bubble.',
  neruru_charge: 'Zooming forward with speed lines, looking brave and determined to protect.',
  neruru_exhausted: 'Melted flat on the ground, dizzy eyes with gloomy vertical lines. Out of energy.'
} as const;

export type MamaMascotExpression = keyof typeof MAMA_MASCOT_EXPRESSIONS;
export const DEFAULT_MAMA_MASCOT_EXPRESSION: MamaMascotExpression = 'neruru_default';

const MASCOT_EXPRESSION_ALIASES: Record<string, MamaMascotExpression> = {
  default: 'neruru_default',
  neutral: 'neruru_default'
};

export interface MamaState {
  affection: number;
  week: number;
  day: number;
  timePhase: MamaTimePhase;
  location: string;
  outfit: string;
  mascotEmotion: MamaMascotExpression;
  mascotComment: string;
}

export const DEFAULT_MAMA_STATE: MamaState = {
  affection: 0,
  week: 1,
  day: 1,
  timePhase: 'morning',
  location: 'unknown',
  outfit: 'streetwear_full',
  mascotEmotion: DEFAULT_MAMA_MASCOT_EXPRESSION,
  mascotComment: '唔噜噜，绘奈今天还撑得住噜。别太欺负她，涅露露可是在看着的噜。'
};

export function normalizeMamaState(value: unknown): MamaState {
  const source = isRecord(value) ? value : {};

  return {
    affection: clampNumber(source.affection, 0, 255, DEFAULT_MAMA_STATE.affection),
    week: clampNumber(source.week, 1, 9999, DEFAULT_MAMA_STATE.week),
    day: clampNumber(source.day, 1, 9999, DEFAULT_MAMA_STATE.day),
    timePhase: normalizeTimePhase(source.timePhase, DEFAULT_MAMA_STATE.timePhase),
    location: normalizeString(source.location, DEFAULT_MAMA_STATE.location),
    outfit: normalizeString(source.outfit, DEFAULT_MAMA_STATE.outfit),
    mascotEmotion: normalizeMascotExpression(source.mascotEmotion, DEFAULT_MAMA_STATE.mascotEmotion),
    mascotComment: normalizeString(source.mascotComment, DEFAULT_MAMA_STATE.mascotComment)
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

export function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function normalizeTimePhase(value: unknown, fallback: MamaTimePhase = DEFAULT_MAMA_STATE.timePhase): MamaTimePhase {
  return typeof value === 'string' && MAMA_TIME_PHASES.includes(value as MamaTimePhase)
    ? value as MamaTimePhase
    : fallback;
}

export function normalizeMascotExpression(
  value: unknown,
  fallback: MamaMascotExpression = DEFAULT_MAMA_MASCOT_EXPRESSION
): MamaMascotExpression {
  if (typeof value !== 'string') return fallback;
  const key = value.trim();
  if (key in MAMA_MASCOT_EXPRESSIONS) return key as MamaMascotExpression;
  return MASCOT_EXPRESSION_ALIASES[key] || fallback;
}
