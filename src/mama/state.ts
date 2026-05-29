export interface MamaState {
  affection: number;
  outfit: string;
  mascotComment: string;
  enaDialogue: string;
}

export const DEFAULT_MAMA_STATE: MamaState = {
  affection: 0,
  outfit: 'school_uniform',
  mascotComment: '使魔与主体反应序列已介入...',
  enaDialogue: '……你太吵了。顺毛刚好顺得我要睡着了，你安静点待一会儿嘛。'
};

export function normalizeMamaState(value: unknown): MamaState {
  const source = isRecord(value) ? value : {};

  return {
    affection: clampNumber(source.affection, 0, 255, DEFAULT_MAMA_STATE.affection),
    outfit: normalizeString(source.outfit, DEFAULT_MAMA_STATE.outfit),
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
