export const EXPRESSION_FALLBACK_CONFIG = {
  defaults: {
    face: 'face_default',
    mouth: 'mouth_neutral',
    eye: 'eye_normal',
    brow: 'brow_normal'
  },
  priorities: {
    explicitComponent: 90,
    visualKeyword: 50,
    secondaryKeyword: 40,
    emotionKeyword: 30
  },
  thresholds: {
    presetMinConfidence: 0.88,
    syntheticMinTokenMatchRatio: 0.5,
    shortTokenMaxDistance: 1,
    longTokenMaxDistance: 2,
    longTokenMinLength: 6
  },
  stopTokens: ['exp', 'expression', 'ena', 'mama'],
  keywordRules: [
    { alias: 'jitome', effects: [{ slot: 'eye', value: 'eye_jitome', priority: 50 }] },
    {
      alias: 'pout',
      effects: [
        { slot: 'mouth', value: 'mouth_pout_2', priority: 50 },
        { slot: 'brow', value: 'brow_up_max', priority: 40 }
      ]
    },
    { alias: 'smile', effects: [{ slot: 'mouth', value: 'mouth_smile', priority: 50 }] },
    { alias: 'smirk', effects: [{ slot: 'mouth', value: 'mouth_smirk_1', priority: 50 }] },
    { alias: 'laugh', effects: [{ slot: 'mouth', value: 'mouth_laugh', priority: 50 }] },
    { alias: 'cat', effects: [{ slot: 'mouth', value: 'mouth_cat', priority: 50 }] },
    { alias: 'huh', effects: [{ slot: 'mouth', value: 'mouth_huh', priority: 50 }] },
    { alias: 'drool', effects: [{ slot: 'mouth', value: 'mouth_drool', priority: 50 }] },
    { alias: 'chu', effects: [{ slot: 'mouth', value: 'mouth_chu', priority: 50 }] },
    { alias: 'shock', effects: [{ slot: 'mouth', value: 'mouth_shock', priority: 50 }] },
    { alias: 'panic', effects: [{ slot: 'mouth', value: 'mouth_panic_open', priority: 50 }] },
    { alias: 'awawa', effects: [{ slot: 'mouth', value: 'mouth_awawa', priority: 50 }] },
    { alias: 'tremble', effects: [{ slot: 'mouth', value: 'mouth_tremble_1', priority: 50 }] },
    { alias: 'blank', effects: [{ slot: 'mouth', value: 'mouth_blank_1', priority: 50 }] },
    { alias: 'fang', effects: [{ slot: 'mouth', value: 'mouth_fang_open', priority: 50 }] },
    { alias: 'tongue', effects: [{ slot: 'mouth', value: 'mouth_tongue_2', priority: 50 }] },
    { alias: 'neutral', effects: [{ slot: 'mouth', value: 'mouth_neutral', priority: 40 }] },
    { alias: 'closed', effects: [{ slot: 'eye', value: 'eye_closed_1', priority: 50 }] },
    { alias: 'wink', effects: [{ slot: 'eye', value: 'eye_wink_2', priority: 50 }] },
    { alias: 'line', effects: [{ slot: 'eye', value: 'eye_line', priority: 50 }] },
    { alias: 'slit', effects: [{ slot: 'eye', value: 'eye_slit', priority: 50 }] },
    {
      alias: 'drowsy',
      effects: [
        { slot: 'eye', value: 'eye_slit', priority: 50 },
        { slot: 'emotion', value: 'Emotion_Sleepy', priority: 30 }
      ]
    },
    {
      alias: 'star',
      effects: [
        { slot: 'eye', value: 'eye_star', priority: 50 },
        { slot: 'emotion', value: 'Emotion_Star', priority: 30 }
      ]
    },
    {
      alias: 'heart',
      effects: [
        { slot: 'eye', value: 'eye_heart', priority: 50 },
        { slot: 'emotion', value: 'Emotion_Heart', priority: 30 }
      ]
    },
    { alias: 'xd', effects: [{ slot: 'eye', value: 'eye_xd', priority: 50 }] },
    { alias: 'wide', effects: [{ slot: 'eye', value: 'eye_wide', priority: 50 }] },
    { alias: 'cry', effects: [{ slot: 'eye', value: 'eye_cry_2', priority: 50 }] },
    { alias: 'dizzy', effects: [{ slot: 'eye', value: 'eye_dizzy_2', priority: 50 }] },
    { alias: 'puppy', effects: [{ slot: 'eye', value: 'eye_puppy', priority: 50 }] },
    { alias: 'dark', effects: [{ slot: 'eye', value: 'eye_dark', priority: 50 }] },
    { alias: 'disgust', effects: [{ slot: 'eye', value: 'eye_disgust', priority: 50 }] },
    { alias: 'roll', effects: [{ slot: 'eye', value: 'eye_roll', priority: 50 }] },
    { alias: 'avert', effects: [{ slot: 'eye', value: 'eye_avert', priority: 50 }] },
    { alias: 'half', effects: [{ slot: 'eye', value: 'eye_half_1', priority: 40 }] },
    { alias: 'up', effects: [{ slot: 'brow', value: 'brow_up', priority: 50 }] },
    { alias: 'down', effects: [{ slot: 'brow', value: 'brow_down', priority: 50 }] },
    { alias: 'up_max', effects: [{ slot: 'brow', value: 'brow_up_max', priority: 50 }] },
    { alias: 'down_max', effects: [{ slot: 'brow', value: 'brow_down_max', priority: 50 }] },
    { alias: 'question', effects: [{ slot: 'brow', value: 'brow_question', priority: 50 }] },
    { alias: 'normal', effects: [{ slot: 'brow', value: 'brow_normal', priority: 40 }] },
    { alias: 'default', effects: [{ slot: 'face', value: 'face_default', priority: 40 }] },
    { alias: 'shadow', effects: [{ slot: 'face', value: 'face_shadow', priority: 50 }] },
    { alias: 'pale', effects: [{ slot: 'face', value: 'face_pale', priority: 50 }] },
    { alias: 'blush', effects: [{ slot: 'face', value: 'face_blush_light', priority: 40 }] },
    { alias: 'heavy', effects: [{ slot: 'face', value: 'face_blush_heavy', priority: 50 }] },
    { alias: 'light', effects: [{ slot: 'face', value: 'face_blush_light', priority: 50 }] },
    { alias: 'sweat', effects: [{ slot: 'other', value: 'sweat', priority: 50 }] },
    { alias: 'mist', effects: [{ slot: 'other', value: 'mist', priority: 50 }] },
    { alias: 'angry', effects: [{ slot: 'emotion', value: 'Emotion_Angry', priority: 30 }] },
    { alias: 'sleepy', effects: [{ slot: 'emotion', value: 'Emotion_Sleepy', priority: 30 }] },
    { alias: 'sparkle', effects: [{ slot: 'emotion', value: 'Emotion_Sparkle', priority: 30 }] },
    { alias: 'confusion', effects: [{ slot: 'emotion', value: 'Emotion_Confusion', priority: 30 }] },
    { alias: 'confused', effects: [{ slot: 'emotion', value: 'Emotion_Confusion', priority: 30 }] },
    { alias: 'fearful', effects: [{ slot: 'emotion', value: 'Emotion_Fearful', priority: 30 }] },
    { alias: 'surprise', effects: [{ slot: 'emotion', value: 'Emotion_Surprise', priority: 30 }] },
    { alias: 'cloud', effects: [{ slot: 'emotion', value: 'Emotion_Cloud', priority: 30 }] },
    { alias: 'heartbubble', effects: [{ slot: 'emotion', value: 'Emotion_HeartBubble', priority: 30 }] },
    { alias: 'heart_bubble', effects: [{ slot: 'emotion', value: 'Emotion_HeartBubble', priority: 30 }] },
    { alias: 'heartburst', effects: [{ slot: 'emotion', value: 'Emotion_HeartBurst', priority: 30 }] },
    { alias: 'heart_burst', effects: [{ slot: 'emotion', value: 'Emotion_HeartBurst', priority: 30 }] },
    { alias: 'zzz', effects: [{ slot: 'emotion', value: 'Emotion_zzz', priority: 30 }] },
    {
      alias: 'sad',
      effects: [
        { slot: 'mouth', value: 'mouth_down', priority: 50 },
        { slot: 'brow', value: 'brow_down', priority: 50 }
      ]
    },
    {
      alias: 'surprised',
      effects: [
        { slot: 'eye', value: 'eye_wide', priority: 50 },
        { slot: 'emotion', value: 'Emotion_Surprise', priority: 30 }
      ]
    },
    {
      alias: 'embarrassed',
      effects: [
        { slot: 'face', value: 'face_blush_light', priority: 50 },
        { slot: 'other', value: 'sweat', priority: 50 }
      ]
    }
  ]
} as const;

