/**
 * MAMA prompt injection runtime.
 */
import {
  MAMA_LOCATION_KEYS,
  MAMA_MONSTER_ALERT_EXCLUDED_LOCATIONS,
  MAMA_OUTFIT_DETAILS,
  MAMA_STATUS_DYNAMICS,
  clampMamaLevel,
  getAffectionLevel,
  getMamaWeekday,
  resolveMamaLocation
} from '../../../mama/state';

(function () {
  'use strict';

  const CURRENT_ROOT = typeof window !== 'undefined' ? window : globalThis;
  const DEBUG_KEY = '__MAMA_LAST_PROMPT_INJECTION__';
  const MONSTER_ALERT_OPERATION_PREFIX = 'state:monster-alert';
  const MONSTER_ALERT_CHANCE_BY_CORRUPTION = [
    { min: 90, chance: { morning: 0.4, noon: 0.55, dusk: 0.7, night: 0.85 } },
    { min: 75, chance: { morning: 0.25, noon: 0.35, dusk: 0.55, night: 0.75 } },
    { min: 50, chance: { morning: 0.15, noon: 0.25, dusk: 0.35, night: 0.55 } },
    { min: 25, chance: { morning: 0, noon: 0, dusk: 0.1, night: 0.3 } },
    { min: 0, chance: { morning: 0, noon: 0, dusk: 0, night: 0.15 } }
  ];

  function resolveBridgeHost() {
    try { if (CURRENT_ROOT.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.MAMA_ST_HOST_ROOT?.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST_ROOT.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.parent?.MAMA_ST_HOST) return CURRENT_ROOT.parent.MAMA_ST_HOST; } catch (_) {}
    try { if (CURRENT_ROOT.top?.MAMA_ST_HOST) return CURRENT_ROOT.top.MAMA_ST_HOST; } catch (_) {}
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
      } catch (_) {}
    };
    pushTarget(CURRENT_ROOT);
    pushTarget(globalThis);
    pushTarget(host.root);
    pushTarget(host.uiRoot);
    pushTarget(host.apiRoot);
    try { pushTarget(typeof unsafeWindow === 'object' ? unsafeWindow : null); } catch (_) {}
    (Array.isArray(host.candidates) ? host.candidates : []).forEach((target) => pushTarget(target));
    try { pushTarget(CURRENT_ROOT.parent); } catch (_) {}
    try { pushTarget(CURRENT_ROOT.top); } catch (_) {}
    targets.slice().forEach((target) => {
      try { pushTarget(target.parent); } catch (_) {}
      try { pushTarget(target.top); } catch (_) {}
    });
    return targets;
  }

  function pushPromptApi(apis, seen, api, thisArg, source) {
    try {
      if (!api || typeof api.injectPrompts !== 'function' || seen.includes(api.injectPrompts)) return;
      seen.push(api.injectPrompts);
      apis.push({
        source,
        injectPrompts(prompts, options) {
          return api.injectPrompts.call(thisArg || api, prompts, options);
        },
        uninjectPrompts(ids) {
          if (typeof api.uninjectPrompts === 'function') return api.uninjectPrompts.call(thisArg || api, ids);
          return undefined;
        }
      });
    } catch (_) {}
  }

  function findPromptApi() {
    const apis = [];
    const seen = [];
    try {
      if (typeof injectPrompts === 'function') {
        pushPromptApi(apis, seen, {
          injectPrompts,
          uninjectPrompts: typeof uninjectPrompts === 'function' ? uninjectPrompts : undefined
        }, null, 'direct');
      }
    } catch (_) {}
    getPromptTargets(BRIDGE_HOST).forEach((target) => {
      try { pushPromptApi(apis, seen, target?.MAMA_ST_API, target?.MAMA_ST_API, 'MAMA_ST_API'); } catch (_) {}
      try { pushPromptApi(apis, seen, target, target, 'window'); } catch (_) {}
    });
    return apis[0] || null;
  }

  const INJECT_ID = 'mama_status_context';
  const MONSTER_ALERT_INJECT_ID = 'mama_monster_alert_context';
  const CORRUPTION_PRESSURE_INJECT_ID = 'mama_corruption_pressure_context';
  const PROMPT_IDS = [INJECT_ID, MONSTER_ALERT_INJECT_ID, CORRUPTION_PRESSURE_INJECT_ID];

  function publishPromptDebug(detail) {
    const snapshot = {
      id: INJECT_ID,
      updatedAt: new Date().toISOString(),
      ...detail
    };
    getPromptTargets(BRIDGE_HOST).forEach((target) => {
      try { target[DEBUG_KEY] = snapshot; } catch (_) {}
      try { target.MAMA_LAST_PROMPT_INJECTION = snapshot; } catch (_) {}
    });
    return snapshot;
  }

  function clearPromptDebug() {
    getPromptTargets(BRIDGE_HOST).forEach((target) => {
      try {
        if (target?.[DEBUG_KEY]?.id === INJECT_ID) delete target[DEBUG_KEY];
      } catch (_) {}
      try {
        if (target?.MAMA_LAST_PROMPT_INJECTION?.id === INJECT_ID) delete target.MAMA_LAST_PROMPT_INJECTION;
      } catch (_) {}
    });
  }

  function clearPromptInjection(reason = 'clearPromptInjection') {
    const promptApi = findPromptApi();
    try {
      if (promptApi) promptApi.uninjectPrompts(PROMPT_IDS);
      clearPromptDebug();
      return {
        id: INJECT_ID,
        cleared: Boolean(promptApi),
        reason,
        apiSource: promptApi?.source || 'none',
        clearedAt: new Date().toISOString()
      };
    } catch (error) {
      return publishPromptDebug({
        injected: false,
        reason: 'clearPromptInjectionFailed',
        apiSource: promptApi?.source || 'none',
        error: error?.message || String(error)
      });
    }
  }

  function formatCounter(value) {
    const number = Number(value);
    const safeValue = Number.isFinite(number) ? Math.max(1, Math.round(number)) : 1;
    return String(safeValue).padStart(2, '0');
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
    if (!detail) return '';

    const lines = [
      'currentOutfitDetail:',
      `  visuals: ${detail.visuals}`
    ];
    if (detail.weapon) lines.push(`  weapon: ${detail.weapon}`);
    lines.push(
      `  vibe: ${detail.vibe}`,
      `  triggers: ${detail.triggers}`,
      `  action_cues: ${detail.action_cues}`
    );
    return lines.join('\n');
  }

  function formatBandLine(type, band, level) {
    if (!band) return '';
    const suffix = band.expressionCue ? ` ${band.expressionCue}` : '';
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
      return '  combined: 极度疲劳主导了现在的状态。大脑迟钝，勉强应付完最基本的对话或动作后，随时都会控制不住闭上眼睡着。';
    }
    if (fatigue >= 3 && mana >= 3) {
      return '  combined: 身体很累但魔力充足。战斗时懒得多跑动，直接站在原地用魔法硬轰；照顾你时不想多说话，更倾向于直接靠在一起安静休息。';
    }
    if (fatigue >= 3 && mana <= 1) {
      return '  combined: 身体疲惫且魔力见底。行动能省则省，只用最不费力的基础魔法，并会主动要求靠近贴贴来紧急恢复体力。';
    }
    if (affection >= 3 && fatigue >= 2) {
      return '  combined: 因为关系亲密且感到疲惫，距离感大幅拉近。话变少了，虽然可能还会习惯性地随便嘟囔两句，但肢体接触变得非常自然且毫无防备。';
    }
    if (mana >= 4 && affection >= 2) {
      return '  combined: 魔力充足且拿{{user}}当自己人。遇到危险时能毫不犹豫地火力全开把你护住，事情解决后也会非常顺手地凑过来继续待在一起。';
    }
    return '  combined: 综合当前的好感度、疲劳和魔力水平，决定了她此时的态度脾气、是否愿意动弹以及对{{user}}的依赖程度。';
  }

  function formatCurrentStatusDynamics(state) {
    const levels = getStatusLevels(state);
    const affection = getStatusBand('affection', levels.affection);
    const fatigue = getStatusBand('fatigue', levels.fatigue);
    const mana = getStatusBand('mana', levels.mana);
    const lines = [
      'statusDynamics:',
      formatBandLine('affectionLevel', affection, levels.affection),
      formatBandLine('fatigueLevel', fatigue, levels.fatigue),
      formatBandLine('manaLevel', mana, levels.mana),
      formatCombinedStatusCue(state)
    ].filter(Boolean);
    return lines.join('\n');
  }

  function getCorruptionPressure(level) {
    const safeLevel = Math.max(0, Math.min(100, Math.round(Number(level) || 0)));
    if (safeLevel >= 90) return 'critical';
    if (safeLevel >= 75) return 'high';
    if (safeLevel >= 50) return 'mid';
    if (safeLevel >= 25) return 'low';
    return 'trace';
  }

  function formatCorruptionDynamics(state) {
    const level = Math.max(0, Math.min(100, Math.round(Number(state.corruptionLevel) || 0)));
    const pressure = getCorruptionPressure(level);
    const cues = level >= 90
      ? {
          userPain: '{{user}} 承受剧烈的全身性痛苦。头痛欲裂、胸闷气短、严重耳鸣、浑身发冷，连正常的睡眠和站立都无法维持，随时濒临失去意识。',
          cityThreat: '危险已经彻底暴露在明面上。白天也会出现大范围的异常，普通人群表现出明显的精神恍惚，大型怪物频繁在周围聚集。',
          enaResponse: '彻底放弃日常行动，把护住 {{user}} 放在绝对的第一位。会强制把 {{user}} 留在身边，确认他状态稳定后才会去清理靠近的怪物。'
        }
      : level >= 75
        ? {
            userPain: '{{user}} 的痛苦频繁发作。经常突然皱眉、冒冷汗、呼吸急促，即使在安全区也会因为周围的异常气息而感到极度不适和焦躁。',
            cityThreat: '城市环境明显变得压抑不安。傍晚以后危险程度直线上升，随时可能在生活区直接遭遇成型的怪物。',
            enaResponse: '保护欲明显上升。比起主动出门找怪，更倾向于贴身守着 {{user}}。会把他按在腿上抱紧，或者低声哄劝，优先靠肢体安抚强行帮他缓解症状。'
          }
        : level >= 50
          ? {
              userPain: '{{user}} 身体有持续的间歇性不适。频繁出现突发的偏头痛、胸口发闷、半夜容易惊醒，偶尔会听到外界传来的奇怪噪音。',
              cityThreat: '日常生活受到轻微干扰。大白天在阴暗的角落或没人的死角，也会突然冒出小型怪物和异常状况。',
              enaResponse: '把 {{user}} 当作重点看护对象。察觉他难受时会立刻停下脚步让他靠一会儿，一边抱怨一边顺手挡掉周围靠近的麻烦。'
            }
          : {
              userPain: '{{user}} 只有轻微的疲惫感。偶尔觉得头疼、心口发紧，或者刚睡醒时感到身体发冷发虚。',
              cityThreat: '城市整体保持正常的运转。危险只存在于深夜的废弃区或者绝对无人的角落，不影响白天出门。',
              enaResponse: '维持正常的同居节奏。看 {{user}} 难受时最多随口吐槽两句，顺手给他倒杯水、拍拍背，或者拉着他坐下休息。'
            };
    return [
      'corruptionDynamics:',
      `  pressure: ${pressure}`,
      `  userPain: ${cues.userPain}`,
      `  cityThreat: ${cues.cityThreat}`,
      `  enaResponse: ${cues.enaResponse}`
    ].join('\n');
  }

  function formatCurrentLocationDynamics(state) {
    const userLocation = resolveMamaLocation(state.userLocation);
    const enaLocation = resolveMamaLocation(state.enaLocation);
    const isTogether = isSameLocationResolution(userLocation, enaLocation);
    const lines = [
      'currentLocationDynamics:',
      formatResolvedLocationLine('userLocation', userLocation),
      formatResolvedLocationLine('enaLocation', enaLocation),
      formatLocationRelation(userLocation, enaLocation, isTogether)
    ].filter(Boolean);
    return lines.join('\n');
  }

  function isSameLocationResolution(left, right) {
    if (left.kind === 'known' && right.kind === 'known') return left.key === right.key;
    if (left.kind === 'unknown' && right.kind === 'unknown') return left.raw === right.raw;
    return false;
  }

  function formatResolvedLocationLine(label, location) {
    return location.kind === 'known'
      ? `  ${label}: ${location.detail.label} (${location.key})`
      : `  ${label}: unregistered (${location.raw})`;
  }

  function formatLocationRelation(userLocation, enaLocation, isTogether) {
    if (isTogether && userLocation.kind === 'known') {
      return '  relation: 同场；对话、触碰、照料和共同移动都可自然发生。';
    }
    if (isTogether) {
      return '  relation: 同名未知地点；按同场处理，但地点细节必须依据正文已经给出的场景描写。';
    }
    const hasUnknown = userLocation.kind === 'unknown' || enaLocation.kind === 'unknown';
    return hasUnknown
      ? '  relation: 异地或未确认同场；未知地点不能自动等同于任何登记地点，不能直接触碰、递东西或同画面贴近，除非正文明确汇合。'
      : '  relation: 异地；不能直接触碰、递东西或同画面贴近，只能通过电话、消息、等待、移动后汇合来衔接。';
  }

  function formatMonsterAlert(state) {
    const status = state.monsterAlertStatus === 'active' || state.monsterAlertStatus === 'cleared'
      ? state.monsterAlertStatus
      : 'none';
    if (status !== 'active') return '';

    const location = resolveMamaLocation(state.monsterAlertLocation || 'unregistered');
    const locationLine = location.kind === 'known'
      ? `  location: ${location.detail.label} (${location.key})`
      : `  location: unregistered (${location.raw})`;

    return [
      '<mama_monster_alert>',
      'monsterAlert:',
      '  status: active',
      locationLine,
      '  safety: dangerous; 此地点出现厄兽、结界或异常魔力污染，进入会有直接风险。',
      '  needResolution: yes; 需要侦察、回避、救援、战斗或净化。若角色不在现场，可以先通过涅露露、新闻、魔力感知或远处异象得知，不强制立刻抵达。',
      '  safeScope: 其他地点默认仍按普通日常处理，除非正文明确把异常扩散过去。',
      '</mama_monster_alert>'
    ].join('\n');
  }

  function formatCorruptionPressure(state) {
    const level = Math.max(0, Math.min(100, Math.round(Number(state.corruptionLevel) || 0)));
    if (level < 75 && state.monsterAlertStatus !== 'active') return '';
    const pressure = getCorruptionPressure(level);
    return [
      '<mama_corruption_pressure>',
      `corruption: ${pressure}; level: ${level}%`,
      level >= 75
        ? 'effect: 城市浊息正在直接压迫 {{user}}，他的疼痛、失眠、耳鸣和胸口压迫会成为当前场景的一部分。'
        : 'effect: 当前有厄兽警报，城市异常会牵动 {{user}} 的不适，也会把日常场景推向应对或安抚。',
      level >= 75
        ? 'sceneCue: ENA 可以选择出击清除源头，也可以先护住 {{user}}、贴近安抚、让他缓过一阵。'
        : 'sceneCue: 目的地、通讯、等待和移动都带上紧迫感；ENA 的反应可以在战斗和照料之间切换。',
      '</mama_corruption_pressure>'
    ].join('\n');
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
${currentOutfitDetail ? `${currentOutfitDetail}\n` : ''}mascotEmotion: ${state.mascotEmotion}
mascotComment: ${state.mascotComment}
</mama_status>`;
  }

  function getMonsterAlertRollKey(state) {
    const week = Math.max(1, Math.round(Number(state.week) || 1));
    const day = Math.max(1, Math.round(Number(state.day) || 1));
    const phase = typeof state.timePhase === 'string' && state.timePhase ? state.timePhase : 'morning';
    return `W${week}D${day}:${phase}`;
  }

  function isOpeningNightRollKey(rollKey) {
    return rollKey === 'W1D1:night';
  }

  function getMonsterAlertChance(state) {
    const level = Math.max(0, Math.min(100, Math.round(Number(state.corruptionLevel) || 0)));
    const phase = typeof state.timePhase === 'string' && state.timePhase ? state.timePhase : 'morning';
    const band = MONSTER_ALERT_CHANCE_BY_CORRUPTION.find((item) => level >= item.min)
      || MONSTER_ALERT_CHANCE_BY_CORRUPTION[MONSTER_ALERT_CHANCE_BY_CORRUPTION.length - 1];
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
    return hashString(`${seed}:${salt}`) / 0x100000000;
  }

  function getEligibleMonsterLocations(previousLocation) {
    const excluded = new Set(MAMA_MONSTER_ALERT_EXCLUDED_LOCATIONS);
    const preferred = MAMA_LOCATION_KEYS.filter((key) => !excluded.has(key) && key !== previousLocation);
    return preferred.length ? preferred : MAMA_LOCATION_KEYS.filter((key) => !excluded.has(key));
  }

  function computePhaseMonsterAlertPatch(state) {
    const rollKey = getMonsterAlertRollKey(state);
    if (isOpeningNightRollKey(rollKey)) return { changed: false, reason: 'openingNightSkipped', rollKey };
    if (state.monsterAlertStatus === 'active') {
      if (state.monsterAlertRollKey === rollKey) return { changed: false, reason: 'activeAlertPreserved', rollKey };
      return {
        changed: true,
        reason: 'activeAlertPreserved',
        rollKey,
        patch: { monsterAlertRollKey: rollKey }
      };
    }
    if (state.monsterAlertRollKey === rollKey) return { changed: false, reason: 'alreadyRolled', rollKey };

    const chance = getMonsterAlertChance(state);
    const roll = seededUnit(rollKey, 'monster-alert');
    if (chance <= 0 || roll >= chance) {
      const patch = {
        monsterAlertStatus: 'none',
        monsterAlertLocation: '',
        monsterAlertRollKey: rollKey
      };
      return { changed: true, reason: 'rolledNone', rollKey, roll, chance, patch };
    }

    const candidates = getEligibleMonsterLocations(state.monsterAlertLocation);
    const index = Math.min(candidates.length - 1, Math.floor(seededUnit(rollKey, 'monster-location') * candidates.length));
    const patch = {
      monsterAlertStatus: 'active',
      monsterAlertLocation: candidates[index] || 'abandoned_factory',
      monsterAlertRollKey: rollKey
    };
    return { changed: true, reason: 'rolledActive', rollKey, roll, chance, patch };
  }

  async function refreshPhaseMonsterAlert(stateService, state, dryRun) {
    const refresh = computePhaseMonsterAlertPatch(state);
    if (!refresh.changed || dryRun) {
      return { state, refresh: dryRun && refresh.changed ? { ...refresh, skipped: 'dryRun' } : refresh };
    }

    try {
      const nextState = await stateService.patchState((draft) => ({ ...draft, ...refresh.patch }), {
        operationId: `${MONSTER_ALERT_OPERATION_PREFIX}:${refresh.rollKey}`,
        reason: 'monsterAlertPhaseRefresh',
        refresh: 'affected'
      });
      return { state: nextState, refresh: { ...refresh, written: true } };
    } catch (error) {
      console.warn('[MAMA Prompt] monster alert refresh failed:', error);
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
    return Boolean(detail && typeof detail === 'object' && detail.dryRun === true);
  }

  RUNTIME.createPromptInjection = function createPromptInjection(stateService) {
    async function injectCurrentState(...args) {
      const dryRun = isDryRun(args);
      const promptApi = findPromptApi();
      if (!promptApi) {
        const result = publishPromptDebug({
          injected: false,
          reason: 'injectPromptsUnavailable',
          hint: 'Expose JS-Slash-Runner APIs with window.MAMA_ST_API before loading bridge.js.'
        });
        console.warn('[MAMA Prompt] injectPrompts is unavailable. Expose JS-Slash-Runner APIs with window.MAMA_ST_API before loading MAMA bridge.');
        return result;
      }

      let state;
      try {
        state = await stateService.loadState({ persist: false });
      } catch (error) {
        const result = publishPromptDebug({
          injected: false,
          reason: 'loadStateFailed',
          apiSource: promptApi.source,
          error: error?.message || String(error)
        });
        console.warn('[MAMA Prompt] loadState failed:', error);
        return result;
      }

      const monsterAlertRefresh = await refreshPhaseMonsterAlert(stateService, state, dryRun);
      state = monsterAlertRefresh.state;

      const content = buildMamaPrompt(state);
      try {
        promptApi.uninjectPrompts(PROMPT_IDS);
      } catch (_) {}
      const prompt = {
        id: INJECT_ID,
        position: 'in_chat',
        depth: 2,
        role: 'system',
        should_scan: false,
        content
      };
      const monsterAlertContent = formatMonsterAlert(state);
      const corruptionPressureContent = formatCorruptionPressure(state);
      const monsterAlertPrompt = monsterAlertContent
        ? {
            id: MONSTER_ALERT_INJECT_ID,
            position: 'in_chat',
            depth: 0,
            role: 'system',
            should_scan: false,
            content: monsterAlertContent
          }
        : null;
      const corruptionPressurePrompt = corruptionPressureContent
        ? {
            id: CORRUPTION_PRESSURE_INJECT_ID,
            position: 'in_chat',
            depth: 0,
            role: 'system',
            should_scan: false,
            content: corruptionPressureContent
          }
        : null;
      const prompts = [prompt, monsterAlertPrompt, corruptionPressurePrompt].filter(Boolean);
      try {
        const injectionResult = promptApi.injectPrompts(prompts, { once: true });
        const extraContent = [monsterAlertContent, corruptionPressureContent].filter(Boolean).join('\n\n');
        const result = publishPromptDebug({
          injected: true,
          reason: 'ok',
          apiSource: promptApi.source,
          dryRun,
          once: true,
          content: extraContent ? `${content}\n\n${extraContent}` : content,
          contentLength: content.length + (extraContent ? extraContent.length : 0),
          statusContent: content,
          monsterAlertContent,
          corruptionPressureContent,
          state,
          monsterAlertRefresh: monsterAlertRefresh.refresh,
          prompt,
          prompts,
          hasUninjectResult: Boolean(injectionResult && typeof injectionResult.uninject === 'function'),
          injectedAt: new Date().toISOString()
        });
        console.log(`[MAMA Prompt] injected ${prompts.map((item) => item.id).join(', ')}, length=${content.length}, api=${promptApi.source}`);
        return result;
      } catch (error) {
        const result = publishPromptDebug({
          injected: false,
          reason: 'injectFailed',
          apiSource: promptApi.source,
          content,
          contentLength: content.length,
          state,
          prompt,
          prompts,
          error: error?.message || String(error)
        });
        console.error('[MAMA Prompt] injectPrompts failed:', error);
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
