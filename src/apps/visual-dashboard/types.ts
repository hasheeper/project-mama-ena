import type { MamaState } from '../../mama/state';

export interface VisualDashboardDefaults {
  appId: string;
  title: string;
}

export interface VisualDashboardViewModel extends VisualDashboardDefaults {
  state: MamaState;
  connectedHostName?: string;
  bgm?: MamaBgmState;
  onToggleBgm?: () => void;
}

export interface MamaStatePushMessage {
  type: 'MAMA_STATE_PUSH';
  state?: unknown;
  reason?: string;
}

export interface MamaBgmState {
  available: boolean;
  playing: boolean;
  provider?: string;
  title?: string;
  url?: string;
  error?: string;
}

export interface MamaBgmStateMessage {
  type: 'MAMA_BGM_STATE';
  state?: MamaBgmState;
}
