export type MamaAppId = string;

export type MamaMessage =
  | MamaContainerReadyMessage
  | MamaAppReadyMessage
  | MamaOpenAppMessage
  | MamaRequestDataMessage
  | MamaRefreshMessage
  | MamaCommandMessage
  | MamaCommandResultMessage;

export interface MamaContainerReadyMessage {
  type: 'mama:container-ready';
  appId: MamaAppId;
  app: MamaRegistryApp;
}

export interface MamaAppReadyMessage {
  type: 'mama:app-ready';
  appId: MamaAppId;
}

export interface MamaOpenAppMessage {
  type: 'mama:open-app';
  app: MamaAppId;
  params?: Record<string, string | number | boolean | null | undefined>;
}

export interface MamaRequestDataMessage {
  type: 'mama:request-data';
  topic?: string;
}

export interface MamaRefreshMessage {
  type: 'mama:refresh';
  payload?: unknown;
}

export interface MamaCommandMessage {
  type: 'mama:command';
  namespace: string;
  action: string;
  payload?: unknown;
  requestId?: string;
}

export interface MamaCommandResultMessage {
  type: 'mama:command-result';
  ok: boolean;
  requestId?: string;
  payload?: unknown;
  error?: string;
}

export interface MamaRegistry {
  version: number;
  defaultApp?: string;
  apps: Record<string, MamaRegistryApp>;
}

export interface MamaRegistryApp {
  id: string;
  name: string;
  type: string;
  container?: string;
  entry?: string;
  status?: 'active' | 'legacy' | 'experimental' | string;
  notes?: string;
}

export function isMamaMessage(value: unknown): value is MamaMessage {
  return Boolean(value && typeof value === 'object' && 'type' in value && String((value as { type: unknown }).type).startsWith('mama:'));
}
