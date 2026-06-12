(function() {
  "use strict";
  const MAMA_WEEKDAY_LABELS = [
    { short: "MON", label: "星期一" },
    { short: "TUE", label: "星期二" },
    { short: "WED", label: "星期三" },
    { short: "THU", label: "星期四" },
    { short: "FRI", label: "星期五" },
    { short: "SAT", label: "星期六" },
    { short: "SUN", label: "星期日" }
  ];
  const MAMA_OUTFIT_DETAILS = {
    outfit_winter: {
      visuals: "Oversized cream cable-knit sweater, thick red scarf hiding her chin, grey pleated skirt, and dark tights.",
      vibe: "Cozy, warm, cute, and slightly vulnerable to the cold.",
      triggers: "Winter environments, snowing outside, or winter dates.",
      action_cues: "Burying half her face in the red scarf, pulling her long sleeves over her hands to keep warm, breath visible in the cold air."
    },
    school_uniform: {
      visuals: "White dress shirt, a slightly loose light blue tie, an unbuttoned beige oversized cardigan, and a dark plaid pleated skirt.",
      vibe: "Relaxed, casual, and a bit sloppy in a cute way. Classic everyday schoolgirl energy.",
      triggers: "School scenes, classrooms, lunch breaks, or walking home together after school.",
      action_cues: "Fiddling with her loose tie, grabbing the edge of her oversized cardigan, sleeves slipping down her shoulders slightly, walking with a light bounce."
    },
    outfit_gym: {
      visuals: "A classic Japanese P.E. uniform. White T-shirt with dark blue piping around the collar and sleeves, a name tag on the chest, and dark blue gym shorts.",
      vibe: "Energetic but easily exhausted. Has a cute, dutiful student feel.",
      triggers: "Physical education, school sports festivals, or running away/getting physically tired.",
      action_cues: "Panting heavily, wiping sweat from her forehead, tugging at the edge of her tight gym shorts."
    },
    outfit_maid_jersey: {
      visuals: "A unique 'Jersey Maid' outfit. She wears a vibrant pink zipped track jacket, with a white heavily-frilled maid apron tied around her waist. A classic maid headdress sits on her head.",
      vibe: "Awkward, subculture, clumsy, and extremely reluctant. The ultimate 'forced to work' tsundere look.",
      triggers: "School festival cafes, forced part-time jobs, or losing a bet.",
      action_cues: "Looking away in embarrassment, hiding her hands in the sleeves of the track jacket, nervously holding the edge of her apron."
    },
    nightwear: {
      visuals: "Her signature double-buns are undone, leaving extremely long, messy, fluffy hair flowing down like a waterfall. She wears a white ruffled camisole (with one strap slipping), light blue striped shorts, and a loose pink hoodie falling off her shoulders.",
      vibe: "Zero defenses, incredibly sleepy, soft, and radiating pure intimacy.",
      triggers: "Waking up in the morning, late-night sleepovers, or answering the door at 2 AM.",
      action_cues: "Yawning sleepily through her messy waterfall hair, rubbing her eyes, lazily pulling her slipped camisole strap back up."
    },
    outfit_swimsuit: {
      visuals: "A pure white, two-piece bikini with two layers of heavy frills/ruffles on the top and bottom. Openly reveals her flat chest, pale skin, and navel.",
      vibe: "Summery, delicate, and slightly self-conscious about her modest figure.",
      triggers: "Beach episodes, pool parties, or summer vacations.",
      action_cues: "Fidgeting with the frills on her top, attempting to hide her flat chest with her arms or a towel when people stare."
    },
    outfit_yukata: {
      visuals: "A beautiful light blue/periwinkle Yukata adorned with white floral patterns. Secured with a dark navy obi (sash) and a white cord knot. She holds a traditional semi-transparent Uchiwa (round fan) depicting a fish. Worn slightly loose around the shoulders.",
      vibe: "Festive, elegant, cooling, and deeply romantic.",
      triggers: "Summer festivals, shrine visits, scooping goldfish, and watching fireworks.",
      action_cues: "Gently fanning herself with the Uchiwa, walking with small steps in wooden sandals, looking up at the fireworks with glowing eyes."
    },
    streetwear_inner: {
      visuals: "A black-and-white split T-shirt with a 'broken heart' graphic, grey pleated mini-skirt. Asymmetrical legs: loose white slouch sock on the right, and a tight pink/white striped thigh-high on the left.",
      vibe: "Casual, lazy Harajuku style. Extremely comfortable and slightly sloppy at-home look.",
      triggers: "Relaxing indoors, hanging out in her room, playing games or resting.",
      action_cues: "Stretching her bare arms, tugging at the hem of her loose T-shirt, kicking her feet playfully."
    },
    streetwear_full: {
      visuals: "Same as 'streetwear_inner', but topped with an incredibly oversized holographic sports jacket (shifting from light blue to purple/white). Zipped only halfway.",
      vibe: "Street-smart, trendy, lazy, and effortlessly attractive.",
      triggers: "Going out for a walk, casual dates, shopping in the city.",
      action_cues: "The oversized jacket constantly slipping off one shoulder revealing her collarbone, burying her hands deep in the giant jacket pockets."
    },
    seraphim: {
      visuals: "Traditional pure white and blue magical girl dress. Off-shoulder straight collarbone, multiple layers of lace and ruffles with silver trims. Pure white wing hairpin. Single white thigh-high with a ruffled garter, crystal shoes.",
      weapon: "[White Moon-Star Wand] - A classic holy staff radiating pure white healing waves.",
      vibe: "Holy, pure, healing, and absolute traditional magical girl heroism.",
      triggers: "Saving the protagonist, healing injuries, facing pure evil with determination.",
      action_cues: "Floating gracefully with glowing blue/white ribbons and starlight particles. Gripping her wand tightly with a resolute, angelic expression."
    },
    nephilim: {
      visuals: "Hair fades from white to pitch black with glowing cyan streaks. Black wing hairpin trailing cyan light. Shattered half-black/half-white gothic dress with torn black lace. Intense glowing neon cyan magic fissures on her left thigh and skirt.",
      weapon: "[Black Feather Night-Chain Wand] - A dark, thorny, corrupted version of her wand emitting low-pressure violent magic.",
      vibe: "Corrupted, intimidating, highly aggressive, and dangerously protective (yandere-adjacent).",
      triggers: "Extreme rage, protagonist gets hurt entirely, losing control, or entering a berserker state.",
      action_cues: "Floating amidst shattered glass shards and glowing cyan chains. Glaring with piercing, intense neon eyes. Swinging her dark wand with terrifying, devastating force."
    },
    underwear: {
      visuals: "Simple, modest plain white underwear.",
      vibe: "Vulnerable and highly embarrassing if seen by others.",
      triggers: "Changing clothes in the locker room, accidental walk-in events, or high-intimacy sleepover scenes.",
      action_cues: "Quickly covering herself with her hands, blushing heavily, or throwing a pillow at whoever walked in."
    },
    nude: {
      visuals: "Completely unclothed, revealing a petite and very flat/modest figure.",
      vibe: "Maximum vulnerability. Can be relaxing (if alone) or chaotic (if interrupted).",
      triggers: "Taking a bath, visiting a hot spring, or special R-rated story events.",
      action_cues: "Sinking below the bathwater to hide up to her nose, crossing arms defensively over her flat chest, turning away with a bright red face."
    }
  };
  const MAMA_LOCATIONS = {
    home_living_room: {
      label: "家",
      aliases: ["home", "house", "living_room", "livingroom", "家", "客厅", "公寓"],
      image: "bg_home_living_room",
      x: 394,
      y: 386,
      rotation: -2,
      pin: "pink"
    },
    school_gate: {
      label: "学校",
      aliases: ["school", "school_gate", "学校", "校门", "高中"],
      image: "bg_school_gate",
      x: 781,
      y: 405,
      rotation: 3,
      pin: "pink"
    },
    convenience_store: {
      label: "便利店",
      aliases: ["convenience", "store", "convenience_store", "便利店"],
      image: "bg_convenience_store",
      x: 387,
      y: 554,
      rotation: 4,
      pin: "yellow"
    },
    shopping_street: {
      label: "商业街",
      aliases: ["shopping", "street", "shopping_street", "商业街"],
      image: "bg_shopping_street",
      x: 202,
      y: 365,
      rotation: -3,
      pin: "yellow"
    },
    arcade: {
      label: "电玩城",
      aliases: ["arcade", "game_center", "电玩城", "游戏厅"],
      image: "bg_arcade",
      x: 230,
      y: 188,
      rotation: 2,
      pin: "yellow"
    },
    neighborhood_park: {
      label: "街心公园",
      aliases: ["park", "neighborhood_park", "街心公园", "公园"],
      image: "bg_neighborhood_park",
      x: 423,
      y: 172,
      rotation: -4,
      pin: "green"
    },
    riverbank: {
      label: "河堤",
      aliases: ["river", "riverbank", "河堤", "河岸"],
      image: "bg_riverbank",
      x: 381,
      y: 733,
      rotation: 3,
      pin: "green"
    },
    train_station: {
      label: "电车站",
      aliases: ["station", "train_station", "电车站", "车站"],
      image: "bg_train_station",
      x: 199,
      y: 590,
      rotation: -2,
      pin: "purple"
    },
    izakaya_street: {
      label: "居酒屋街",
      aliases: ["izakaya", "izakaya_street", "居酒屋街"],
      image: "bg_izakaya_street",
      x: 61,
      y: 310,
      rotation: 4,
      pin: "yellow"
    },
    abandoned_factory: {
      label: "废弃工厂",
      aliases: ["factory", "abandoned_factory", "废弃工厂", "工厂"],
      image: "bg_abandoned_factory",
      x: 784,
      y: 660,
      rotation: -3,
      pin: "purple"
    },
    suburban_shrine: {
      label: "郊外神社",
      aliases: ["shrine", "suburban_shrine", "郊外神社", "神社"],
      image: "bg_suburban_shrine",
      x: 1001,
      y: 166,
      rotation: 2,
      pin: "purple"
    },
    hospital_interior: {
      label: "市医院",
      aliases: ["hospital", "hospital_interior", "市医院", "医院"],
      image: "bg_hospital_interior",
      x: 945,
      y: 391,
      rotation: -4,
      pin: "yellow"
    },
    company: {
      label: "公司",
      aliases: ["company", "office", "workplace", "公司", "办公室", "职场"],
      image: "bg_company",
      x: 551,
      y: 408,
      rotation: 1,
      pin: "yellow"
    }
  };
  const DEFAULT_MAMA_LOCATION = "home_living_room";
  const MAMA_LOCATION_KEYS = Object.keys(MAMA_LOCATIONS);
  const LOCATION_BLOCKED_KEYWORDS = /* @__PURE__ */ new Set(["street", "room", "interior", "store", "station", "gate"]);
  const LOCATION_KEYWORD_INDEX = buildLocationKeywordIndex();
  const MAMA_MONSTER_ALERT_EXCLUDED_LOCATIONS = ["home_living_room"];
  const MAMA_STATUS_DYNAMICS = {
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
  };
  function clampNumber(value, min, max, fallback) {
    const next = readFiniteNumber(value);
    if (!Number.isFinite(next)) return fallback;
    return Math.max(min, Math.min(max, Math.round(next)));
  }
  function clampMamaLevel(value, fallback = 0) {
    return clampNumber(value, 0, 5, fallback);
  }
  function getMamaWeekday(day) {
    const safeDay = clampNumber(day, 1, 9999, 1);
    const index = (safeDay - 1) % MAMA_WEEKDAY_LABELS.length;
    return MAMA_WEEKDAY_LABELS[index] || MAMA_WEEKDAY_LABELS[0];
  }
  function readFiniteNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return Number(value);
    const trimmed = value.trim();
    if (!trimmed) return Number.NaN;
    const normalized = trimmed.replace(/,/g, "");
    const exact = Number(normalized);
    if (Number.isFinite(exact)) return exact;
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : Number.NaN;
  }
  function getAffectionLevel(affection) {
    return value255ToLevel(affection, [
      [0, 39],
      [40, 79],
      [80, 129],
      [130, 189],
      [190, 239],
      [240, 255]
    ]);
  }
  function value255ToLevel(value, bands) {
    const safeValue = clampNumber(value, 0, 255, 0);
    const index = bands.findIndex(([min, max]) => safeValue >= min && safeValue <= max);
    return index >= 0 ? index : 0;
  }
  function normalizeMamaLocationValue(value, fallback = DEFAULT_MAMA_LOCATION) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }
  function resolveMamaLocation(value, fallback = DEFAULT_MAMA_LOCATION) {
    const raw = normalizeMamaLocationValue(value, fallback);
    const normalized = normalizeLocationToken(raw);
    const knownKey = resolveKnownLocationKey(normalized, raw);
    if (knownKey) {
      return {
        kind: "known",
        key: knownKey,
        detail: MAMA_LOCATIONS[knownKey],
        raw
      };
    }
    return { kind: "unknown", raw };
  }
  function resolveKnownLocationKey(normalized, raw) {
    if (normalized in MAMA_LOCATIONS) return normalized;
    const exactMatched = MAMA_LOCATION_KEYS.find((key) => {
      const detail = MAMA_LOCATIONS[key];
      if (detail.image === raw || normalizeLocationToken(detail.image) === normalized) return true;
      return !LOCATION_BLOCKED_KEYWORDS.has(normalized) && detail.aliases.some((alias) => normalizeLocationToken(alias) === normalized);
    });
    if (exactMatched) return exactMatched;
    return LOCATION_KEYWORD_INDEX[normalized] || null;
  }
  function normalizeLocationToken(value) {
    return value.trim().toLowerCase().replace(/^bg_/, "").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_").replace(/^_+|_+$/g, "");
  }
  function buildLocationKeywordIndex() {
    const candidates = /* @__PURE__ */ new Map();
    const addKeyword = (keyword, key) => {
      const normalized = normalizeLocationToken(keyword);
      if (!normalized || LOCATION_BLOCKED_KEYWORDS.has(normalized)) return;
      const existing = candidates.get(normalized) || /* @__PURE__ */ new Set();
      existing.add(key);
      candidates.set(normalized, existing);
    };
    MAMA_LOCATION_KEYS.forEach((key) => {
      const detail = MAMA_LOCATIONS[key];
      addKeyword(key, key);
      addKeyword(detail.image, key);
      detail.aliases.forEach((alias) => addKeyword(alias, key));
      const parts = key.split("_");
      parts.forEach((part) => addKeyword(part, key));
      for (let index = 0; index < parts.length - 1; index += 1) {
        addKeyword(`${parts[index]}_${parts[index + 1]}`, key);
      }
    });
    return Array.from(candidates.entries()).reduce((index, [keyword, keys]) => {
      if (keys.size === 1) index[keyword] = Array.from(keys)[0];
      return index;
    }, {});
  }
  (function() {
    const CURRENT_ROOT = typeof window !== "undefined" ? window : globalThis;
    const DEBUG_KEY = "__MAMA_LAST_PROMPT_INJECTION__";
    const MONSTER_ALERT_OPERATION_PREFIX = "state:monster-alert";
    const MONSTER_ALERT_CHANCE_BY_CORRUPTION = [
      { min: 90, chance: { morning: 0.4, noon: 0.55, dusk: 0.7, night: 0.85 } },
      { min: 75, chance: { morning: 0.25, noon: 0.35, dusk: 0.55, night: 0.75 } },
      { min: 50, chance: { morning: 0.15, noon: 0.25, dusk: 0.35, night: 0.55 } },
      { min: 25, chance: { morning: 0, noon: 0, dusk: 0.1, night: 0.3 } },
      { min: 0, chance: { morning: 0, noon: 0, dusk: 0, night: 0.15 } }
    ];
    function resolveBridgeHost() {
      try {
        if (CURRENT_ROOT.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST;
      } catch (_) {
      }
      try {
        if (CURRENT_ROOT.MAMA_ST_HOST_ROOT?.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST_ROOT.MAMA_ST_HOST;
      } catch (_) {
      }
      try {
        if (CURRENT_ROOT.parent?.MAMA_ST_HOST) return CURRENT_ROOT.parent.MAMA_ST_HOST;
      } catch (_) {
      }
      try {
        if (CURRENT_ROOT.top?.MAMA_ST_HOST) return CURRENT_ROOT.top.MAMA_ST_HOST;
      } catch (_) {
      }
      return {};
    }
    const BRIDGE_HOST = resolveBridgeHost();
    const ROOT = BRIDGE_HOST.apiRoot || CURRENT_ROOT.MAMA_ST_API_ROOT || CURRENT_ROOT.MAMA_ST_HOST_ROOT || CURRENT_ROOT;
    const RUNTIME = ROOT.MAMAMainRuntime || CURRENT_ROOT.MAMAMainRuntime || {};
    ROOT.MAMAMainRuntime = RUNTIME;
    CURRENT_ROOT.MAMAMainRuntime = RUNTIME;
    function getPromptTargets(host) {
      const targets = [];
      const pushTarget = (target) => {
        try {
          if (target && !targets.includes(target)) targets.push(target);
        } catch (_) {
        }
      };
      pushTarget(CURRENT_ROOT);
      pushTarget(globalThis);
      pushTarget(host.root);
      pushTarget(host.uiRoot);
      pushTarget(host.apiRoot);
      try {
        pushTarget(typeof unsafeWindow === "object" ? unsafeWindow : null);
      } catch (_) {
      }
      (Array.isArray(host.candidates) ? host.candidates : []).forEach((target) => pushTarget(target));
      try {
        pushTarget(CURRENT_ROOT.parent);
      } catch (_) {
      }
      try {
        pushTarget(CURRENT_ROOT.top);
      } catch (_) {
      }
      targets.slice().forEach((target) => {
        try {
          pushTarget(target.parent);
        } catch (_) {
        }
        try {
          pushTarget(target.top);
        } catch (_) {
        }
      });
      return targets;
    }
    function pushPromptApi(apis, seen, api, thisArg, source) {
      try {
        if (!api || typeof api.injectPrompts !== "function" || seen.includes(api.injectPrompts)) return;
        seen.push(api.injectPrompts);
        apis.push({
          source,
          injectPrompts(prompts, options) {
            return api.injectPrompts.call(thisArg || api, prompts, options);
          },
          uninjectPrompts(ids) {
            if (typeof api.uninjectPrompts === "function") return api.uninjectPrompts.call(thisArg || api, ids);
            return void 0;
          }
        });
      } catch (_) {
      }
    }
    function findPromptApi() {
      const apis = [];
      const seen = [];
      try {
        if (typeof injectPrompts === "function") {
          pushPromptApi(apis, seen, {
            injectPrompts,
            uninjectPrompts: typeof uninjectPrompts === "function" ? uninjectPrompts : void 0
          }, null, "direct");
        }
      } catch (_) {
      }
      getPromptTargets(BRIDGE_HOST).forEach((target) => {
        try {
          pushPromptApi(apis, seen, target?.MAMA_ST_API, target?.MAMA_ST_API, "MAMA_ST_API");
        } catch (_) {
        }
        try {
          pushPromptApi(apis, seen, target, target, "window");
        } catch (_) {
        }
      });
      return apis[0] || null;
    }
    const INJECT_ID = "mama_status_context";
    const MONSTER_ALERT_INJECT_ID = "mama_monster_alert_context";
    const CORRUPTION_PRESSURE_INJECT_ID = "mama_corruption_pressure_context";
    const PROMPT_IDS = [INJECT_ID, MONSTER_ALERT_INJECT_ID, CORRUPTION_PRESSURE_INJECT_ID];
    function publishPromptDebug(detail) {
      const snapshot = {
        id: INJECT_ID,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...detail
      };
      getPromptTargets(BRIDGE_HOST).forEach((target) => {
        try {
          target[DEBUG_KEY] = snapshot;
        } catch (_) {
        }
        try {
          target.MAMA_LAST_PROMPT_INJECTION = snapshot;
        } catch (_) {
        }
      });
      return snapshot;
    }
    function clearPromptDebug() {
      getPromptTargets(BRIDGE_HOST).forEach((target) => {
        try {
          if (target?.[DEBUG_KEY]?.id === INJECT_ID) delete target[DEBUG_KEY];
        } catch (_) {
        }
        try {
          if (target?.MAMA_LAST_PROMPT_INJECTION?.id === INJECT_ID) delete target.MAMA_LAST_PROMPT_INJECTION;
        } catch (_) {
        }
      });
    }
    function clearPromptInjection(reason = "clearPromptInjection") {
      const promptApi = findPromptApi();
      try {
        if (promptApi) promptApi.uninjectPrompts(PROMPT_IDS);
        clearPromptDebug();
        return {
          id: INJECT_ID,
          cleared: Boolean(promptApi),
          reason,
          apiSource: promptApi?.source || "none",
          clearedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      } catch (error) {
        return publishPromptDebug({
          injected: false,
          reason: "clearPromptInjectionFailed",
          apiSource: promptApi?.source || "none",
          error: error?.message || String(error)
        });
      }
    }
    function formatCounter(value) {
      const number = Number(value);
      const safeValue = Number.isFinite(number) ? Math.max(1, Math.round(number)) : 1;
      return String(safeValue).padStart(2, "0");
    }
    function formatAffectionValue(value) {
      const number = Number(value);
      const safeValue = Number.isFinite(number) ? Math.max(0, Math.min(255, Math.round(number))) : 0;
      return `${safeValue}/255`;
    }
    function formatMoney(value) {
      const number = Number(value);
      const safeValue = Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
      return String(safeValue);
    }
    function formatPercent(value) {
      const number = Number(value);
      const safeValue = Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
      return String(safeValue);
    }
    function getStatusBand(type, value) {
      const number = Number(value);
      const safeValue = Number.isFinite(number) ? clampMamaLevel(number) : 0;
      const bands = MAMA_STATUS_DYNAMICS[type] || [];
      return bands.find((band) => band.level === safeValue) || bands[0];
    }
    function formatCurrentOutfitDetail(outfit) {
      const detail = MAMA_OUTFIT_DETAILS[outfit];
      if (!detail) return "";
      const lines = [
        "currentOutfitDetail:",
        `  visuals: ${detail.visuals}`
      ];
      if (detail.weapon) lines.push(`  weapon: ${detail.weapon}`);
      lines.push(
        `  vibe: ${detail.vibe}`,
        `  triggers: ${detail.triggers}`,
        `  action_cues: ${detail.action_cues}`
      );
      return lines.join("\n");
    }
    function formatBandLine(type, band, level) {
      if (!band) return "";
      const suffix = band.expressionCue ? ` ${band.expressionCue}` : "";
      return `  ${type}: LV ${level}/5; ${band.label}; ${band.cue}${suffix}`;
    }
    function getStatusLevels(state) {
      return {
        affection: getAffectionLevel(state.affection),
        fatigue: clampMamaLevel(state.fatigueLevel),
        mana: clampMamaLevel(state.manaLevel)
      };
    }
    function formatCombinedStatusCue(state) {
      const { affection, fatigue, mana } = getStatusLevels(state);
      if (fatigue >= 5) {
        return "  combined: 极度疲劳主导了现在的状态。大脑迟钝，勉强应付完最基本的对话或动作后，随时都会控制不住闭上眼睡着。";
      }
      if (fatigue >= 3 && mana >= 3) {
        return "  combined: 身体很累但魔力充足。战斗时懒得多跑动，直接站在原地用魔法硬轰；照顾你时不想多说话，更倾向于直接靠在一起安静休息。";
      }
      if (fatigue >= 3 && mana <= 1) {
        return "  combined: 身体疲惫且魔力见底。行动能省则省，只用最不费力的基础魔法，并会主动要求靠近贴贴来紧急恢复体力。";
      }
      if (affection >= 3 && fatigue >= 2) {
        return "  combined: 因为关系亲密且感到疲惫，距离感大幅拉近。话变少了，虽然可能还会习惯性地随便嘟囔两句，但肢体接触变得非常自然且毫无防备。";
      }
      if (mana >= 4 && affection >= 2) {
        return "  combined: 魔力充足且拿{{user}}当自己人。遇到危险时能毫不犹豫地火力全开把你护住，事情解决后也会非常顺手地凑过来继续待在一起。";
      }
      return "  combined: 综合当前的好感度、疲劳和魔力水平，决定了她此时的态度脾气、是否愿意动弹以及对{{user}}的依赖程度。";
    }
    function formatCurrentStatusDynamics(state) {
      const levels = getStatusLevels(state);
      const affection = getStatusBand("affection", levels.affection);
      const fatigue = getStatusBand("fatigue", levels.fatigue);
      const mana = getStatusBand("mana", levels.mana);
      const lines = [
        "statusDynamics:",
        formatBandLine("affectionLevel", affection, levels.affection),
        formatBandLine("fatigueLevel", fatigue, levels.fatigue),
        formatBandLine("manaLevel", mana, levels.mana),
        formatCombinedStatusCue(state)
      ].filter(Boolean);
      return lines.join("\n");
    }
    function getCorruptionPressure(level) {
      const safeLevel = Math.max(0, Math.min(100, Math.round(Number(level) || 0)));
      if (safeLevel >= 90) return "critical";
      if (safeLevel >= 75) return "high";
      if (safeLevel >= 50) return "mid";
      if (safeLevel >= 25) return "low";
      return "trace";
    }
    function formatCorruptionDynamics(state) {
      const level = Math.max(0, Math.min(100, Math.round(Number(state.corruptionLevel) || 0)));
      const pressure = getCorruptionPressure(level);
      const cues = level >= 90 ? {
        userPain: "{{user}} 承受剧烈的全身性痛苦。头痛欲裂、胸闷气短、严重耳鸣、浑身发冷，连正常的睡眠和站立都无法维持，随时濒临失去意识。",
        cityThreat: "危险已经彻底暴露在明面上。白天也会出现大范围的异常，普通人群表现出明显的精神恍惚，大型怪物频繁在周围聚集。",
        enaResponse: "彻底放弃日常行动，把护住 {{user}} 放在绝对的第一位。会强制把 {{user}} 留在身边，确认他状态稳定后才会去清理靠近的怪物。"
      } : level >= 75 ? {
        userPain: "{{user}} 的痛苦频繁发作。经常突然皱眉、冒冷汗、呼吸急促，即使在安全区也会因为周围的异常气息而感到极度不适和焦躁。",
        cityThreat: "城市环境明显变得压抑不安。傍晚以后危险程度直线上升，随时可能在生活区直接遭遇成型的怪物。",
        enaResponse: "保护欲明显上升。比起主动出门找怪，更倾向于贴身守着 {{user}}。会把他按在腿上抱紧，或者低声哄劝，优先靠肢体安抚强行帮他缓解症状。"
      } : level >= 50 ? {
        userPain: "{{user}} 身体有持续的间歇性不适。频繁出现突发的偏头痛、胸口发闷、半夜容易惊醒，偶尔会听到外界传来的奇怪噪音。",
        cityThreat: "日常生活受到轻微干扰。大白天在阴暗的角落或没人的死角，也会突然冒出小型怪物和异常状况。",
        enaResponse: "把 {{user}} 当作重点看护对象。察觉他难受时会立刻停下脚步让他靠一会儿，一边抱怨一边顺手挡掉周围靠近的麻烦。"
      } : {
        userPain: "{{user}} 只有轻微的疲惫感。偶尔觉得头疼、心口发紧，或者刚睡醒时感到身体发冷发虚。",
        cityThreat: "城市整体保持正常的运转。危险只存在于深夜的废弃区或者绝对无人的角落，不影响白天出门。",
        enaResponse: "维持正常的同居节奏。看 {{user}} 难受时最多随口吐槽两句，顺手给他倒杯水、拍拍背，或者拉着他坐下休息。"
      };
      return [
        "corruptionDynamics:",
        `  pressure: ${pressure}`,
        `  userPain: ${cues.userPain}`,
        `  cityThreat: ${cues.cityThreat}`,
        `  enaResponse: ${cues.enaResponse}`
      ].join("\n");
    }
    function formatCurrentLocationDynamics(state) {
      const userLocation = resolveMamaLocation(state.userLocation);
      const enaLocation = resolveMamaLocation(state.enaLocation);
      const isTogether = isSameLocationResolution(userLocation, enaLocation);
      const lines = [
        "currentLocationDynamics:",
        formatResolvedLocationLine("userLocation", userLocation),
        formatResolvedLocationLine("enaLocation", enaLocation),
        formatLocationRelation(userLocation, enaLocation, isTogether)
      ].filter(Boolean);
      return lines.join("\n");
    }
    function isSameLocationResolution(left, right) {
      if (left.kind === "known" && right.kind === "known") return left.key === right.key;
      if (left.kind === "unknown" && right.kind === "unknown") return left.raw === right.raw;
      return false;
    }
    function formatResolvedLocationLine(label, location) {
      return location.kind === "known" ? `  ${label}: ${location.detail.label} (${location.key})` : `  ${label}: unregistered (${location.raw})`;
    }
    function formatLocationRelation(userLocation, enaLocation, isTogether) {
      if (isTogether && userLocation.kind === "known") {
        return "  relation: 同场；对话、触碰、照料和共同移动都可自然发生。";
      }
      if (isTogether) {
        return "  relation: 同名未知地点；按同场处理，但地点细节必须依据正文已经给出的场景描写。";
      }
      const hasUnknown = userLocation.kind === "unknown" || enaLocation.kind === "unknown";
      return hasUnknown ? "  relation: 异地或未确认同场；未知地点不能自动等同于任何登记地点，不能直接触碰、递东西或同画面贴近，除非正文明确汇合。" : "  relation: 异地；不能直接触碰、递东西或同画面贴近，只能通过电话、消息、等待、移动后汇合来衔接。";
    }
    function formatMonsterAlert(state) {
      const status = state.monsterAlertStatus === "active" || state.monsterAlertStatus === "cleared" ? state.monsterAlertStatus : "none";
      if (status !== "active") return "";
      const location = resolveMamaLocation(state.monsterAlertLocation || "unregistered");
      const locationLine = location.kind === "known" ? `  location: ${location.detail.label} (${location.key})` : `  location: unregistered (${location.raw})`;
      return [
        "<mama_monster_alert>",
        "monsterAlert:",
        "  status: active",
        locationLine,
        "  safety: dangerous; 此地点出现厄兽、结界或异常魔力污染，进入会有直接风险。",
        "  needResolution: yes; 需要侦察、回避、救援、战斗或净化。若角色不在现场，可以先通过涅露露、新闻、魔力感知或远处异象得知，不强制立刻抵达。",
        "  safeScope: 其他地点默认仍按普通日常处理，除非正文明确把异常扩散过去。",
        "</mama_monster_alert>"
      ].join("\n");
    }
    function formatCorruptionPressure(state) {
      const level = Math.max(0, Math.min(100, Math.round(Number(state.corruptionLevel) || 0)));
      if (level < 75 && state.monsterAlertStatus !== "active") return "";
      const pressure = getCorruptionPressure(level);
      return [
        "<mama_corruption_pressure>",
        `corruption: ${pressure}; level: ${level}%`,
        level >= 75 ? "effect: 城市浊息正在直接压迫 {{user}}，他的疼痛、失眠、耳鸣和胸口压迫会成为当前场景的一部分。" : "effect: 当前有厄兽警报，城市异常会牵动 {{user}} 的不适，也会把日常场景推向应对或安抚。",
        level >= 75 ? "sceneCue: ENA 可以选择出击清除源头，也可以先护住 {{user}}、贴近安抚、让他缓过一阵。" : "sceneCue: 目的地、通讯、等待和移动都带上紧迫感；ENA 的反应可以在战斗和照料之间切换。",
        "</mama_corruption_pressure>"
      ].join("\n");
    }
    function buildMamaPrompt(state) {
      const weekday = getMamaWeekday(state.day);
      const currentOutfitDetail = formatCurrentOutfitDetail(state.outfit);
      const currentStatusDynamics = formatCurrentStatusDynamics(state);
      const currentLocationDynamics = formatCurrentLocationDynamics(state);
      const levels = getStatusLevels(state);
      return `<mama_status>
affectionLevel: LV ${levels.affection}/5 (${formatAffectionValue(state.affection)})
fatigueLevel: LV ${levels.fatigue}/5
manaLevel: LV ${levels.mana}/5
livingExpense: ¥${formatMoney(state.livingExpense)}
corruptionLevel: ${formatPercent(state.corruptionLevel)}%
${currentStatusDynamics}
${formatCorruptionDynamics(state)}
${currentLocationDynamics}
time: WEEK ${formatCounter(state.week)} / DAY ${formatCounter(state.day)} / ${weekday.short} / ${state.timePhase}
outfit: ${state.outfit}
${currentOutfitDetail ? `${currentOutfitDetail}
` : ""}mascotEmotion: ${state.mascotEmotion}
mascotComment: ${state.mascotComment}
</mama_status>`;
    }
    function getMonsterAlertRollKey(state) {
      const week = Math.max(1, Math.round(Number(state.week) || 1));
      const day = Math.max(1, Math.round(Number(state.day) || 1));
      const phase = typeof state.timePhase === "string" && state.timePhase ? state.timePhase : "morning";
      return `W${week}D${day}:${phase}`;
    }
    function isOpeningNightRollKey(rollKey) {
      return rollKey === "W1D1:night";
    }
    function getMonsterAlertChance(state) {
      const level = Math.max(0, Math.min(100, Math.round(Number(state.corruptionLevel) || 0)));
      const phase = typeof state.timePhase === "string" && state.timePhase ? state.timePhase : "morning";
      const band = MONSTER_ALERT_CHANCE_BY_CORRUPTION.find((item) => level >= item.min) || MONSTER_ALERT_CHANCE_BY_CORRUPTION[MONSTER_ALERT_CHANCE_BY_CORRUPTION.length - 1];
      const chance = band?.chance?.[phase];
      return Number.isFinite(chance) ? Math.max(0, Math.min(1, chance)) : 0;
    }
    function hashString(value) {
      let hash = 2166136261;
      const text = String(value);
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }
    function seededUnit(seed, salt) {
      return hashString(`${seed}:${salt}`) / 4294967296;
    }
    function getEligibleMonsterLocations(previousLocation) {
      const excluded = new Set(MAMA_MONSTER_ALERT_EXCLUDED_LOCATIONS);
      const preferred = MAMA_LOCATION_KEYS.filter((key) => !excluded.has(key) && key !== previousLocation);
      return preferred.length ? preferred : MAMA_LOCATION_KEYS.filter((key) => !excluded.has(key));
    }
    function computePhaseMonsterAlertPatch(state) {
      const rollKey = getMonsterAlertRollKey(state);
      if (isOpeningNightRollKey(rollKey)) return { changed: false, reason: "openingNightSkipped", rollKey };
      if (state.monsterAlertStatus === "active") {
        if (state.monsterAlertRollKey === rollKey) return { changed: false, reason: "activeAlertPreserved", rollKey };
        return {
          changed: true,
          reason: "activeAlertPreserved",
          rollKey,
          patch: { monsterAlertRollKey: rollKey }
        };
      }
      if (state.monsterAlertRollKey === rollKey) return { changed: false, reason: "alreadyRolled", rollKey };
      const chance = getMonsterAlertChance(state);
      const roll = seededUnit(rollKey, "monster-alert");
      if (chance <= 0 || roll >= chance) {
        const patch2 = {
          monsterAlertStatus: "none",
          monsterAlertLocation: "",
          monsterAlertRollKey: rollKey
        };
        return { changed: true, reason: "rolledNone", rollKey, roll, chance, patch: patch2 };
      }
      const candidates = getEligibleMonsterLocations(state.monsterAlertLocation);
      const index = Math.min(candidates.length - 1, Math.floor(seededUnit(rollKey, "monster-location") * candidates.length));
      const patch = {
        monsterAlertStatus: "active",
        monsterAlertLocation: candidates[index] || "abandoned_factory",
        monsterAlertRollKey: rollKey
      };
      return { changed: true, reason: "rolledActive", rollKey, roll, chance, patch };
    }
    async function refreshPhaseMonsterAlert(stateService, state, dryRun) {
      const refresh = computePhaseMonsterAlertPatch(state);
      if (!refresh.changed || dryRun) {
        return { state, refresh: dryRun && refresh.changed ? { ...refresh, skipped: "dryRun" } : refresh };
      }
      try {
        const nextState = await stateService.patchState((draft) => ({ ...draft, ...refresh.patch }), {
          operationId: `${MONSTER_ALERT_OPERATION_PREFIX}:${refresh.rollKey}`,
          reason: "monsterAlertPhaseRefresh",
          refresh: "affected"
        });
        return { state: nextState, refresh: { ...refresh, written: true } };
      } catch (error) {
        console.warn("[MAMA Prompt] monster alert refresh failed:", error);
        return {
          state,
          refresh: {
            ...refresh,
            written: false,
            error: error?.message || String(error)
          }
        };
      }
    }
    function isDryRun(args) {
      if (args.length >= 3) return args[2] === true;
      const detail = args[0];
      return Boolean(detail && typeof detail === "object" && detail.dryRun === true);
    }
    RUNTIME.createPromptInjection = function createPromptInjection(stateService) {
      async function injectCurrentState(...args) {
        const dryRun = isDryRun(args);
        const promptApi = findPromptApi();
        if (!promptApi) {
          const result = publishPromptDebug({
            injected: false,
            reason: "injectPromptsUnavailable",
            hint: "Expose JS-Slash-Runner APIs with window.MAMA_ST_API before loading bridge.js."
          });
          console.warn("[MAMA Prompt] injectPrompts is unavailable. Expose JS-Slash-Runner APIs with window.MAMA_ST_API before loading MAMA bridge.");
          return result;
        }
        let state;
        try {
          state = await stateService.loadState({ persist: false });
        } catch (error) {
          const result = publishPromptDebug({
            injected: false,
            reason: "loadStateFailed",
            apiSource: promptApi.source,
            error: error?.message || String(error)
          });
          console.warn("[MAMA Prompt] loadState failed:", error);
          return result;
        }
        const monsterAlertRefresh = await refreshPhaseMonsterAlert(stateService, state, dryRun);
        state = monsterAlertRefresh.state;
        const content = buildMamaPrompt(state);
        try {
          promptApi.uninjectPrompts(PROMPT_IDS);
        } catch (_) {
        }
        const prompt = {
          id: INJECT_ID,
          position: "in_chat",
          depth: 2,
          role: "system",
          should_scan: false,
          content
        };
        const monsterAlertContent = formatMonsterAlert(state);
        const corruptionPressureContent = formatCorruptionPressure(state);
        const monsterAlertPrompt = monsterAlertContent ? {
          id: MONSTER_ALERT_INJECT_ID,
          position: "in_chat",
          depth: 0,
          role: "system",
          should_scan: false,
          content: monsterAlertContent
        } : null;
        const corruptionPressurePrompt = corruptionPressureContent ? {
          id: CORRUPTION_PRESSURE_INJECT_ID,
          position: "in_chat",
          depth: 0,
          role: "system",
          should_scan: false,
          content: corruptionPressureContent
        } : null;
        const prompts = [prompt, monsterAlertPrompt, corruptionPressurePrompt].filter(Boolean);
        try {
          const injectionResult = promptApi.injectPrompts(prompts, { once: true });
          const extraContent = [monsterAlertContent, corruptionPressureContent].filter(Boolean).join("\n\n");
          const result = publishPromptDebug({
            injected: true,
            reason: "ok",
            apiSource: promptApi.source,
            dryRun,
            once: true,
            content: extraContent ? `${content}

${extraContent}` : content,
            contentLength: content.length + (extraContent ? extraContent.length : 0),
            statusContent: content,
            monsterAlertContent,
            corruptionPressureContent,
            state,
            monsterAlertRefresh: monsterAlertRefresh.refresh,
            prompt,
            prompts,
            hasUninjectResult: Boolean(injectionResult && typeof injectionResult.uninject === "function"),
            injectedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          console.log(`[MAMA Prompt] injected ${prompts.map((item) => item.id).join(", ")}, length=${content.length}, api=${promptApi.source}`);
          return result;
        } catch (error) {
          const result = publishPromptDebug({
            injected: false,
            reason: "injectFailed",
            apiSource: promptApi.source,
            content,
            contentLength: content.length,
            state,
            prompt,
            prompts,
            error: error?.message || String(error)
          });
          console.error("[MAMA Prompt] injectPrompts failed:", error);
          return result;
        }
      }
      return {
        INJECT_ID,
        MONSTER_ALERT_INJECT_ID,
        buildMamaPrompt,
        formatMonsterAlert,
        formatCurrentLocationDynamics,
        formatCurrentStatusDynamics,
        injectCurrentState,
        clearPromptInjection
      };
    };
  })();
})();
