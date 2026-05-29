export const MAMA_TIME_PHASES = ['morning', 'noon', 'dusk', 'night'] as const;
export type MamaTimePhase = (typeof MAMA_TIME_PHASES)[number];

export const MAMA_TIME_PHASE_LABELS: Record<MamaTimePhase, string> = {
  morning: '晨',
  noon: '午',
  dusk: '暮',
  night: '夜'
};

export interface MamaState {
  affection: number;
  week: number;
  day: number;
  timePhase: MamaTimePhase;
  location: string;
  outfit: string;
  mascotEmotion: string;
  mascotComment: string;
  enaDialogue: string;
}

export const DEFAULT_MAMA_STATE: MamaState = {
  affection: 0,
  week: 1,
  day: 1,
  timePhase: 'morning',
  location: 'unknown',
  outfit: 'streetwear_full',
  mascotEmotion: 'neutral',
  mascotComment: '唔噜噜，绘奈今天还撑得住噜。别太欺负她，涅露露可是在看着的噜。',
  enaDialogue: '……你太吵了。顺毛刚好顺得我要睡着了，你安静点待一会儿嘛。'
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
    mascotEmotion: normalizeString(source.mascotEmotion, DEFAULT_MAMA_STATE.mascotEmotion),
    mascotComment: normalizeString(source.mascotComment, DEFAULT_MAMA_STATE.mascotComment),
    enaDialogue: normalizeString(source.enaDialogue, DEFAULT_MAMA_STATE.enaDialogue)
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
