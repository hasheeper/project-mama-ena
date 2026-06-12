import {
  DEFAULT_MAMA_STATE,
  DEFAULT_MAMA_MONSTER_ALERT_STATUS,
  DEFAULT_MAMA_MASCOT_EXPRESSION,
  MAMA_MONSTER_ALERT_EXCLUDED_LOCATIONS,
  MAMA_MONSTER_ALERT_STATUSES,
  MAMA_MASCOT_EXPRESSION_KEYS,
  MAMA_OUTFIT_DETAILS,
  MAMA_LOCATIONS,
  MAMA_LOCATION_KEYS,
  MAMA_STATUS_DYNAMICS,
  MAMA_TIME_PHASE_LABELS,
  MAMA_TIME_PHASES,
  MAMA_WEEKDAY_LABELS,
  DEFAULT_MAMA_LOCATION,
  clampMamaLevel,
  getAffectionLevel,
  getMamaWeekday,
  normalizeMamaLocation,
  normalizeMamaLocationValue,
  normalizeMonsterAlertStatus,
  normalizeMascotExpression,
  normalizeMamaState,
  normalizeTimePhase,
  resolveMamaLocation,
  type MamaMonsterAlertStatus,
  type MamaMascotExpression,
  type MamaLocationResolution,
  type MamaLocationKey,
  type MamaOutfitDetailKey,
  type MamaTimePhase,
  type MamaState
} from '../../mama/state';

export {
  DEFAULT_MAMA_STATE,
  DEFAULT_MAMA_MONSTER_ALERT_STATUS,
  DEFAULT_MAMA_MASCOT_EXPRESSION,
  MAMA_MONSTER_ALERT_EXCLUDED_LOCATIONS,
  MAMA_MONSTER_ALERT_STATUSES,
  MAMA_MASCOT_EXPRESSION_KEYS,
  MAMA_OUTFIT_DETAILS,
  MAMA_LOCATIONS,
  MAMA_LOCATION_KEYS,
  MAMA_STATUS_DYNAMICS,
  MAMA_TIME_PHASE_LABELS,
  MAMA_TIME_PHASES,
  MAMA_WEEKDAY_LABELS,
  DEFAULT_MAMA_LOCATION,
  clampMamaLevel,
  getAffectionLevel,
  getMamaWeekday,
  normalizeMamaLocation,
  normalizeMamaLocationValue,
  normalizeMonsterAlertStatus,
  normalizeMascotExpression,
  normalizeMamaState,
  normalizeTimePhase,
  resolveMamaLocation,
  type MamaMonsterAlertStatus,
  type MamaMascotExpression,
  type MamaLocationResolution,
  type MamaLocationKey,
  type MamaOutfitDetailKey,
  type MamaTimePhase,
  type MamaState
};

export const MAMA_STAT_KEY = 'stat_data';
export const MAMA_NAMESPACE = 'mama';

export const MAMA_ALLOWED_FIELD_PATHS = [
  '/mama/affection',
  '/mama/fatigueLevel',
  '/mama/manaLevel',
  '/mama/livingExpense',
  '/mama/corruptionLevel',
  '/mama/week',
  '/mama/day',
  '/mama/timePhase',
  '/mama/userLocation',
  '/mama/enaLocation',
  '/mama/monsterAlertStatus',
  '/mama/monsterAlertLocation',
  '/mama/monsterAlertRollKey',
  '/mama/outfit',
  '/mama/mascotEmotion',
  '/mama/mascotComment'
] as const;

export function cloneJson<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch (_) {
    return fallback;
  }
}

export function makeDefaultMamaState(): MamaState {
  return cloneJson(DEFAULT_MAMA_STATE, DEFAULT_MAMA_STATE);
}
