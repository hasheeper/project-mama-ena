export interface MamaSTBridgeState {
  bridgeVersion: string;
  manifestUrl: string;
  manifestVersion: string;
  packId: string;
  product: string;
  label: string;
  loaded: Array<{ id?: string; type?: string; url: string }>;
  loadedAt: string;
}

export interface MamaSTBridgeApi {
  version: string;
  state: MamaSTBridgeState;
  actionHandlers: Record<string, Record<string, (payload?: unknown) => unknown | Promise<unknown>>>;
  mvu: {
    readVariables(options?: { type?: string }): Promise<Record<string, unknown>>;
    writeVariables(data: Record<string, unknown>, options?: { type?: string }): Promise<Record<string, unknown>>;
    readState(rootKey?: string, stateKey?: string | null, options?: { type?: string }): Promise<unknown>;
    writeState(rootKey: string, stateKey: string | null, state: unknown, options?: { type?: string }): Promise<unknown>;
    patchState(rootKey: string, stateKey: string | null, patcher: (draft: unknown, current: unknown) => unknown | Promise<unknown>, options?: { type?: string }): Promise<unknown>;
  };
  registerActions(namespace: string, handlers: Record<string, (payload?: unknown) => unknown | Promise<unknown>>): void;
  dispatch(namespace: string, action: string, payload?: unknown): Promise<unknown>;
  reload(): Promise<unknown>;
}

declare global {
  interface Window {
    STBridge?: MamaSTBridgeApi;
    ST_BRIDGE_PACK?: string;
    ST_BRIDGE_URL?: string;
    ST_BRIDGE_MANIFEST_URL?: string;
    MAMAPlugin?: unknown;
  }
}
