import type { MamaState } from '../../mama/state';

export interface VisualDashboardDefaults {
  appId: string;
  title: string;
}

export interface VisualDashboardViewModel extends VisualDashboardDefaults {
  state: MamaState;
  connectedHostName?: string;
}

export interface MamaStatePushMessage {
  type: 'MAMA_STATE_PUSH';
  state?: unknown;
  reason?: string;
}
