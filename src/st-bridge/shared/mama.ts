import {
  DEFAULT_MAMA_STATE,
  MAMA_TIME_PHASE_LABELS,
  MAMA_TIME_PHASES,
  normalizeMamaState,
  normalizeTimePhase,
  type MamaTimePhase,
  type MamaState
} from '../../mama/state';

export {
  DEFAULT_MAMA_STATE,
  MAMA_TIME_PHASE_LABELS,
  MAMA_TIME_PHASES,
  normalizeMamaState,
  normalizeTimePhase,
  type MamaTimePhase,
  type MamaState
};

export const MAMA_STAT_KEY = 'stat_data';
export const MAMA_NAMESPACE = 'mama';

export const MAMA_ALLOWED_FIELD_PATHS = [
  '/mama/affection',
  '/mama/week',
  '/mama/day',
  '/mama/timePhase',
  '/mama/location',
  '/mama/outfit',
  '/mama/mascotEmotion',
  '/mama/mascotComment',
  '/mama/enaDialogue'
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
