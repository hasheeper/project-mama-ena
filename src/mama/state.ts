export const MAMA_TIME_PHASES = ['morning', 'noon', 'dusk', 'night'] as const;
export type MamaTimePhase = (typeof MAMA_TIME_PHASES)[number];

export const MAMA_MONSTER_ALERT_STATUSES = ['none', 'active', 'cleared'] as const;
export type MamaMonsterAlertStatus = (typeof MAMA_MONSTER_ALERT_STATUSES)[number];
export const DEFAULT_MAMA_MONSTER_ALERT_STATUS: MamaMonsterAlertStatus = 'none';

export const MAMA_TIME_PHASE_LABELS: Record<MamaTimePhase, string> = {
  morning: '晨',
  noon: '午',
  dusk: '暮',
  night: '夜'
};

export const MAMA_WEEKDAY_LABELS = [
  { short: 'MON', label: '星期一' },
  { short: 'TUE', label: '星期二' },
  { short: 'WED', label: '星期三' },
  { short: 'THU', label: '星期四' },
  { short: 'FRI', label: '星期五' },
  { short: 'SAT', label: '星期六' },
  { short: 'SUN', label: '星期日' }
] as const;

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
  outfit_gym: {
    visuals: 'A classic Japanese P.E. uniform. White T-shirt with dark blue piping around the collar and sleeves, a name tag on the chest, and dark blue gym shorts.',
    vibe: 'Energetic but easily exhausted. Has a cute, dutiful student feel.',
    triggers: 'Physical education, school sports festivals, or running away/getting physically tired.',
    action_cues: 'Panting heavily, wiping sweat from her forehead, tugging at the edge of her tight gym shorts.'
  },
  outfit_maid_jersey: {
    visuals: "A unique 'Jersey Maid' outfit. She wears a vibrant pink zipped track jacket, with a white heavily-frilled maid apron tied around her waist. A classic maid headdress sits on her head.",
    vibe: "Awkward, subculture, clumsy, and extremely reluctant. The ultimate 'forced to work' tsundere look.",
    triggers: 'School festival cafes, forced part-time jobs, or losing a bet.',
    action_cues: 'Looking away in embarrassment, hiding her hands in the sleeves of the track jacket, nervously holding the edge of her apron.'
  },
  nightwear: {
    visuals: 'Her signature double-buns are undone, leaving extremely long, messy, fluffy hair flowing down like a waterfall. She wears a white ruffled camisole (with one strap slipping), light blue striped shorts, and a loose pink hoodie falling off her shoulders.',
    vibe: 'Zero defenses, incredibly sleepy, soft, and radiating pure intimacy.',
    triggers: 'Waking up in the morning, late-night sleepovers, or answering the door at 2 AM.',
    action_cues: 'Yawning sleepily through her messy waterfall hair, rubbing her eyes, lazily pulling her slipped camisole strap back up.'
  },
  outfit_swimsuit: {
    visuals: 'A pure white, two-piece bikini with two layers of heavy frills/ruffles on the top and bottom. Openly reveals her flat chest, pale skin, and navel.',
    vibe: 'Summery, delicate, and slightly self-conscious about her modest figure.',
    triggers: 'Beach episodes, pool parties, or summer vacations.',
    action_cues: 'Fidgeting with the frills on her top, attempting to hide her flat chest with her arms or a towel when people stare.'
  },
  outfit_yukata: {
    visuals: 'A beautiful light blue/periwinkle Yukata adorned with white floral patterns. Secured with a dark navy obi (sash) and a white cord knot. She holds a traditional semi-transparent Uchiwa (round fan) depicting a fish. Worn slightly loose around the shoulders.',
    vibe: 'Festive, elegant, cooling, and deeply romantic.',
    triggers: 'Summer festivals, shrine visits, scooping goldfish, and watching fireworks.',
    action_cues: 'Gently fanning herself with the Uchiwa, walking with small steps in wooden sandals, looking up at the fireworks with glowing eyes.'
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

export interface MamaLocationDetail {
  label: string;
  aliases: readonly string[];
  image: string;
  x: number;
  y: number;
  rotation: number;
  pin: 'pink' | 'yellow' | 'green' | 'purple';
}

export const MAMA_LOCATIONS = {
  home_living_room: {
    label: '家',
    aliases: ['home', 'house', 'living_room', 'livingroom', '家', '客厅', '公寓'],
    image: 'bg_home_living_room',
    x: 394,
    y: 386,
    rotation: -2,
    pin: 'pink'
  },
  school_gate: {
    label: '学校',
    aliases: ['school', 'school_gate', '学校', '校门', '高中'],
    image: 'bg_school_gate',
    x: 781,
    y: 405,
    rotation: 3,
    pin: 'pink'
  },
  convenience_store: {
    label: '便利店',
    aliases: ['convenience', 'store', 'convenience_store', '便利店'],
    image: 'bg_convenience_store',
    x: 387,
    y: 554,
    rotation: 4,
    pin: 'yellow'
  },
  shopping_street: {
    label: '商业街',
    aliases: ['shopping', 'street', 'shopping_street', '商业街'],
    image: 'bg_shopping_street',
    x: 202,
    y: 365,
    rotation: -3,
    pin: 'yellow'
  },
  arcade: {
    label: '电玩城',
    aliases: ['arcade', 'game_center', '电玩城', '游戏厅'],
    image: 'bg_arcade',
    x: 230,
    y: 188,
    rotation: 2,
    pin: 'yellow'
  },
  neighborhood_park: {
    label: '街心公园',
    aliases: ['park', 'neighborhood_park', '街心公园', '公园'],
    image: 'bg_neighborhood_park',
    x: 423,
    y: 172,
    rotation: -4,
    pin: 'green'
  },
  riverbank: {
    label: '河堤',
    aliases: ['river', 'riverbank', '河堤', '河岸'],
    image: 'bg_riverbank',
    x: 381,
    y: 733,
    rotation: 3,
    pin: 'green'
  },
  train_station: {
    label: '电车站',
    aliases: ['station', 'train_station', '电车站', '车站'],
    image: 'bg_train_station',
    x: 199,
    y: 590,
    rotation: -2,
    pin: 'purple'
  },
  izakaya_street: {
    label: '居酒屋街',
    aliases: ['izakaya', 'izakaya_street', '居酒屋街'],
    image: 'bg_izakaya_street',
    x: 61,
    y: 310,
    rotation: 4,
    pin: 'yellow'
  },
  abandoned_factory: {
    label: '废弃工厂',
    aliases: ['factory', 'abandoned_factory', '废弃工厂', '工厂'],
    image: 'bg_abandoned_factory',
    x: 784,
    y: 660,
    rotation: -3,
    pin: 'purple'
  },
  suburban_shrine: {
    label: '郊外神社',
    aliases: ['shrine', 'suburban_shrine', '郊外神社', '神社'],
    image: 'bg_suburban_shrine',
    x: 1001,
    y: 166,
    rotation: 2,
    pin: 'purple'
  },
  hospital_interior: {
    label: '市医院',
    aliases: ['hospital', 'hospital_interior', '市医院', '医院'],
    image: 'bg_hospital_interior',
    x: 945,
    y: 391,
    rotation: -4,
    pin: 'yellow'
  },
  company: {
    label: '公司',
    aliases: ['company', 'office', 'workplace', '公司', '办公室', '职场'],
    image: 'bg_company',
    x: 551,
    y: 408,
    rotation: 1,
    pin: 'yellow'
  }
} as const satisfies Record<string, MamaLocationDetail>;

export type MamaLocationKey = keyof typeof MAMA_LOCATIONS;
export const DEFAULT_MAMA_LOCATION: MamaLocationKey = 'home_living_room';
export const MAMA_LOCATION_KEYS = Object.keys(MAMA_LOCATIONS) as MamaLocationKey[];

export type MamaLocationResolution =
  | {
      kind: 'known';
      key: MamaLocationKey;
      detail: MamaLocationDetail;
      raw: string;
    }
  | {
      kind: 'unknown';
      raw: string;
    };

const LOCATION_BLOCKED_KEYWORDS = new Set(['street', 'room', 'interior', 'store', 'station', 'gate']);
const LOCATION_KEYWORD_INDEX = buildLocationKeywordIndex();
export const MAMA_MONSTER_ALERT_EXCLUDED_LOCATIONS: readonly MamaLocationKey[] = ['home_living_room'];

export interface MamaStatusBandDetail {
  level: number;
  label: string;
  cue: string;
  expressionCue?: string;
}

export const MAMA_STATUS_DYNAMICS = {
"affection": [
    {
      "level": 0,
      "label": "糊弄差事",
      "cue": "似乎有点讨厌你，把你当成推不掉的麻烦。心里烦躁，态度容易敷衍，只想快点应付过去，透着明显的距离感和不耐烦。"
    },
    {
      "level": 1,
      "label": "同居老好人",
      "cue": "习惯了同居的日常。本来就是随性散漫的性格，虽然嘴上总是习惯性地抱怨和嫌弃，但本质上是嘴硬心软的老好人。把你当成身边熟悉的人，顺手照顾时显得随意且自然。"
    },
    {
      "level": 2,
      "label": "摆烂损友",
      "cue": "彻底不见外了。卸下了所有的防备和包袱，展现出懒散的一面。相处起来毫无顾忌，完全把你当成可以倒苦水、取乐、偷懒甚至撒泼的对象，甚至觉得反过来差遣你也理所当然。"
    },
    {
      "level": 3,
      "label": "害羞倒退",
      "cue": "平时还是那副随性散漫、不见外的样子，但偶尔会察觉到自己内心的颤动而脸红。为了掩饰偶尔泛起的害羞与动摇，有时会刻意保持一点距离感，显得有些欲盖弥彰的别扭。"
    },
    {
      "level": 4,
      "label": "热恋女友",
      "cue": "明确了甜甜的恋爱氛围。虽然底子里依然随性散漫且容易害羞，但态度变得更主动自然了。不再掩饰想要亲近的心思，偶尔会故意使坏逗弄、讨要关注，也会非常直白地展露依赖和撒娇的倾向。"
    },
    {
      "level": 5,
      "label": "完全依托",
      "cue": "达到了最舒服的相处阶段，完全的老夫老妻模式。保留了损友的随意，又充满了伴侣间的信任。在你面前彻底摆烂毫无掩饰。极其自然地将所有疲惫和软弱都展露出来，只想毫无保留地依赖你。"
    }
  ],
  "fatigue": [
    {
      "level": 0,
      "label": "精力充沛",
      "cue": "难得睡饱了的满血状态。褪去了平时那股拖拖拉拉的丧气，展现出属于正常精神女高中生的活力。动作轻快，脑子转得快，跟人斗嘴也毫不落下风。今天有心情利索地把麻烦事干完，甚至会主动找点话题闲聊。",
      "expressionCue": "推荐自然清醒、心情不错的常规表情，遇到槽点正常发挥颜艺。像是精神状态很好的普通女高中生。绝对禁止犯困。"
    },
    {
      "level": 1,
      "label": "清醒精神",
      "cue": "状态良好的正常水平。脑子清醒，动作利索。虽然骨子里还是个怕麻烦的女高中生，但有足够的耐心去正常应对各种突发情况，不会表现出明显的烦躁。",
      "expressionCue": "推荐自然清醒的常规状态，可以随心所欲地使用各种颜艺和吐槽脸。此阶段绝对要压制犯困、打瞌睡的表情。"
    },
    {
      "level": 2,
      "label": "日常慵懒",
      "cue": "她的标准常态。体态有点松垮，稍微拖着步子走路。会习惯性地叹气和抱怨“好麻烦”，但手上的动作并没有变慢，还能正常应付所有事。",
      "expressionCue": "推荐无奈、死鱼眼或随性的日常表情，但也完全可以自由使用搞怪、炸毛等颜艺反应。此阶段依然要减少/适当打瞌睡/犯困的表情。"
    },
    {
      "level": 3,
      "label": "肢体沉重",
      "cue": "真的开始觉得累了。能坐着绝不站着，能靠着绝不坐直。不想多说话，句子开始变短。对周围的吵闹声会感到明显的厌烦，只想安静待着。",
      "expressionCue": "底色推荐嫌麻烦、无语或叹气闭眼的表情。遇到突发状况依然可以有大开大合的颜艺，但要体现出懒懒的感觉。"
    },
    {
      "level": 4,
      "label": "强撑收尾",
      "cue": "累得很烦躁，但手里还有事没干完。为了省力气，动作能省则省（打怪变站桩输出，照顾你直接上手懒得说话），憋着一股气只想用最快速度搞定然后去睡觉。",
      "expressionCue": "推荐因为烦躁而显得憋气、无力或者下撇嘴角的表情。从这里开始，可以合理地融入轻度的犯困、半睁眼或打盹神态。"
    },
    {
      "level": 5,
      "label": "迷糊断电",
      "cue": "大脑转不动了，到达生理极限。眼神发直，反应慢半拍，说话变成轻声的嘟囔。身体像没骨头一样，坐着就会忍不住点头打瞌睡，只想立刻闭上眼睛趴着。",
      "expressionCue": "推荐眼神涣散、半睁半闭的打盹眼、彻底闭眼休息或打哈欠的表情。重点表现出大脑迟钝的呆萌或脱力感，禁止活泼、夸张的表情。"
    }
  ],
  "mana": [
    {
      "level": 0,
      "label": "枯竭",
      "cue": "魔力彻底见底。大型魔法全部罢工，只能勉强维持最基础的微弱治愈或小护盾。"
    },
    {
      "level": 1,
      "label": "贫魔",
      "cue": "蓝量告急。施法变得抠抠搜搜，能不开大就不开大，以省力为第一原则。"
    },
    {
      "level": 2,
      "label": "勉强够用",
      "cue": "刚好能应付日常的打怪和治愈任务，但经不起长时间的剧烈消耗。技能选择偏向稳妥省蓝，打完后需要按时回补。"
    },
    {
      "level": 3,
      "label": "状态稳定",
      "cue": "魔力处于健康水平。能流畅变身迎战，火力和治愈输出都很稳定。"
    },
    {
      "level": 4,
      "label": "充沛",
      "cue": "蓝量非常充足。魔法光效都变亮了，火力、净化和守护结界给得十分大方。面对突发状况能迅速展开完整的魔法少女姿态。"
    },
    {
      "level": 5,
      "label": "满溢",
      "cue": "魔力满得快要溢出来。各种治愈光环和星屑波甚至不需要费力念咒就能强力释放，强大的储备让她在保护你或打怪时显得格外游刃有余甚至强势。"
    }
  ]
} as const satisfies Record<'affection' | 'fatigue' | 'mana', readonly MamaStatusBandDetail[]>;

export const MAMA_MASCOT_EXPRESSION_KEYS = [
  'neruru_default',
  'neruru_happy',
  'neruru_laughing',
  'neruru_playful',
  'neruru_confident',
  'neruru_shy',
  'neruru_starstruck',
  'neruru_eating',
  'neruru_sad',
  'neruru_angry',
  'neruru_shock',
  'neruru_nervous',
  'neruru_confused',
  'neruru_sleepy',
  'neruru_charge',
  'neruru_exhausted'
] as const;

export type MamaMascotExpression = (typeof MAMA_MASCOT_EXPRESSION_KEYS)[number];
export const DEFAULT_MAMA_MASCOT_EXPRESSION: MamaMascotExpression = 'neruru_default';
const MAMA_MASCOT_EXPRESSION_KEY_SET = /* @__PURE__ */ new Set<string>(MAMA_MASCOT_EXPRESSION_KEYS);

const MASCOT_EXPRESSION_ALIASES: Record<string, MamaMascotExpression> = {
  default: 'neruru_default',
  neutral: 'neruru_default'
};

export interface MamaState {
  affection: number;
  fatigueLevel: number;
  manaLevel: number;
  livingExpense: number;
  corruptionLevel: number;
  week: number;
  day: number;
  timePhase: MamaTimePhase;
  userLocation: string;
  enaLocation: string;
  monsterAlertStatus: MamaMonsterAlertStatus;
  monsterAlertLocation: string;
  monsterAlertRollKey: string;
  outfit: string;
  mascotEmotion: MamaMascotExpression;
  mascotComment: string;
}

export const DEFAULT_MAMA_STATE: MamaState = {
  affection: 0,
  fatigueLevel: 0,
  manaLevel: 0,
  livingExpense: 1250,
  corruptionLevel: 82,
  week: 1,
  day: 1,
  timePhase: 'morning',
  userLocation: DEFAULT_MAMA_LOCATION,
  enaLocation: DEFAULT_MAMA_LOCATION,
  monsterAlertStatus: DEFAULT_MAMA_MONSTER_ALERT_STATUS,
  monsterAlertLocation: '',
  monsterAlertRollKey: '',
  outfit: 'streetwear_full',
  mascotEmotion: DEFAULT_MAMA_MASCOT_EXPRESSION,
  mascotComment: '唔噜噜，绘奈今天还撑得住噜。别太欺负她，涅露露可是在看着的噜。'
};

export function normalizeMamaState(value: unknown): MamaState {
  const source = isRecord(value) ? value : {};

  return {
    affection: clampNumber(source.affection, 0, 255, DEFAULT_MAMA_STATE.affection),
    fatigueLevel: clampMamaLevel(source.fatigueLevel, DEFAULT_MAMA_STATE.fatigueLevel),
    manaLevel: clampMamaLevel(source.manaLevel, DEFAULT_MAMA_STATE.manaLevel),
    livingExpense: clampNumber(source.livingExpense, 0, 999999, DEFAULT_MAMA_STATE.livingExpense),
    corruptionLevel: clampNumber(source.corruptionLevel, 0, 100, DEFAULT_MAMA_STATE.corruptionLevel),
    week: clampNumber(source.week, 1, 9999, DEFAULT_MAMA_STATE.week),
    day: clampNumber(source.day, 1, 9999, DEFAULT_MAMA_STATE.day),
    timePhase: normalizeTimePhase(source.timePhase, DEFAULT_MAMA_STATE.timePhase),
    userLocation: normalizeMamaLocationValue(source.userLocation, DEFAULT_MAMA_STATE.userLocation),
    enaLocation: normalizeMamaLocationValue(source.enaLocation, DEFAULT_MAMA_STATE.enaLocation),
    monsterAlertStatus: normalizeMonsterAlertStatus(source.monsterAlertStatus, DEFAULT_MAMA_STATE.monsterAlertStatus),
    monsterAlertLocation: normalizeString(source.monsterAlertLocation, DEFAULT_MAMA_STATE.monsterAlertLocation),
    monsterAlertRollKey: normalizeString(source.monsterAlertRollKey, DEFAULT_MAMA_STATE.monsterAlertRollKey),
    outfit: normalizeString(source.outfit, DEFAULT_MAMA_STATE.outfit),
    mascotEmotion: normalizeMascotExpression(source.mascotEmotion, DEFAULT_MAMA_STATE.mascotEmotion),
    mascotComment: normalizeString(source.mascotComment, DEFAULT_MAMA_STATE.mascotComment)
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const next = readFiniteNumber(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

export function clampMamaLevel(value: unknown, fallback = 0): number {
  return clampNumber(value, 0, 5, fallback);
}

export function getMamaWeekday(day: unknown): (typeof MAMA_WEEKDAY_LABELS)[number] {
  const safeDay = clampNumber(day, 1, 9999, 1);
  const index = (safeDay - 1) % MAMA_WEEKDAY_LABELS.length;
  return MAMA_WEEKDAY_LABELS[index] || MAMA_WEEKDAY_LABELS[0];
}

function readFiniteNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number(value);
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  const normalized = trimmed.replace(/,/g, '');
  const exact = Number(normalized);
  if (Number.isFinite(exact)) return exact;
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

export function getAffectionLevel(affection: unknown): number {
  return value255ToLevel(affection, [
    [0, 39],
    [40, 79],
    [80, 129],
    [130, 189],
    [190, 239],
    [240, 255]
  ]);
}

function value255ToLevel(value: unknown, bands: readonly (readonly [number, number])[]): number {
  const safeValue = clampNumber(value, 0, 255, 0);
  const index = bands.findIndex(([min, max]) => safeValue >= min && safeValue <= max);
  return index >= 0 ? index : 0;
}

export function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function normalizeTimePhase(value: unknown, fallback: MamaTimePhase = DEFAULT_MAMA_STATE.timePhase): MamaTimePhase {
  return typeof value === 'string' && MAMA_TIME_PHASES.includes(value as MamaTimePhase)
    ? value as MamaTimePhase
    : fallback;
}

export function normalizeMonsterAlertStatus(
  value: unknown,
  fallback: MamaMonsterAlertStatus = DEFAULT_MAMA_MONSTER_ALERT_STATUS
): MamaMonsterAlertStatus {
  return typeof value === 'string' && MAMA_MONSTER_ALERT_STATUSES.includes(value as MamaMonsterAlertStatus)
    ? value as MamaMonsterAlertStatus
    : fallback;
}

export function normalizeMamaLocationValue(value: unknown, fallback: string = DEFAULT_MAMA_LOCATION): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function resolveMamaLocation(
  value: unknown,
  fallback: string = DEFAULT_MAMA_LOCATION
): MamaLocationResolution {
  const raw = normalizeMamaLocationValue(value, fallback);
  const normalized = normalizeLocationToken(raw);
  const knownKey = resolveKnownLocationKey(normalized, raw);
  if (knownKey) {
    return {
      kind: 'known',
      key: knownKey,
      detail: MAMA_LOCATIONS[knownKey],
      raw
    };
  }
  return { kind: 'unknown', raw };
}

export function normalizeMamaLocation(value: unknown, fallback: MamaLocationKey = DEFAULT_MAMA_LOCATION): MamaLocationKey {
  const resolved = resolveMamaLocation(value, fallback);
  return resolved.kind === 'known' ? resolved.key : fallback;
}

function resolveKnownLocationKey(normalized: string, raw: string): MamaLocationKey | null {
  if (normalized in MAMA_LOCATIONS) return normalized as MamaLocationKey;
  const exactMatched = MAMA_LOCATION_KEYS.find((key) => {
    const detail = MAMA_LOCATIONS[key];
    if (detail.image === raw || normalizeLocationToken(detail.image) === normalized) return true;
    return !LOCATION_BLOCKED_KEYWORDS.has(normalized)
      && detail.aliases.some((alias) => normalizeLocationToken(alias) === normalized);
  });
  if (exactMatched) return exactMatched;
  return LOCATION_KEYWORD_INDEX[normalized] || null;
}

function normalizeLocationToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^bg_/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildLocationKeywordIndex(): Partial<Record<string, MamaLocationKey>> {
  const candidates = new Map<string, Set<MamaLocationKey>>();
  const addKeyword = (keyword: string, key: MamaLocationKey) => {
    const normalized = normalizeLocationToken(keyword);
    if (!normalized || LOCATION_BLOCKED_KEYWORDS.has(normalized)) return;
    const existing = candidates.get(normalized) || new Set<MamaLocationKey>();
    existing.add(key);
    candidates.set(normalized, existing);
  };

  MAMA_LOCATION_KEYS.forEach((key) => {
    const detail = MAMA_LOCATIONS[key];
    addKeyword(key, key);
    addKeyword(detail.image, key);
    detail.aliases.forEach((alias) => addKeyword(alias, key));

    const parts = key.split('_');
    parts.forEach((part) => addKeyword(part, key));
    for (let index = 0; index < parts.length - 1; index += 1) {
      addKeyword(`${parts[index]}_${parts[index + 1]}`, key);
    }
  });

  return Array.from(candidates.entries()).reduce<Partial<Record<string, MamaLocationKey>>>((index, [keyword, keys]) => {
    if (keys.size === 1) index[keyword] = Array.from(keys)[0];
    return index;
  }, {});
}

export function normalizeMascotExpression(
  value: unknown,
  fallback: MamaMascotExpression = DEFAULT_MAMA_MASCOT_EXPRESSION
): MamaMascotExpression {
  if (typeof value !== 'string') return fallback;
  const key = value.trim();
  if (MAMA_MASCOT_EXPRESSION_KEY_SET.has(key)) return key as MamaMascotExpression;
  return MASCOT_EXPRESSION_ALIASES[key] || fallback;
}
