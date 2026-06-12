import type { MamaSTBridgeApi } from '../bridge/st-bridge-types';

declare global {
  const unsafeWindow: any;
  const handleVariablesInMessage: any;
  const eventOn: any;
  const injectPrompts: any;
  const uninjectPrompts: any;
  const registerMvuSchema: any;
  const playAudio: any;
  const pauseAudio: any;
  const stopAudio: any;
  const getCurrentAudio: any;
  const setAudioSettings: any;
  const tavern_events: any;

  interface Window {
    [key: string]: any;
    STBridge?: MamaSTBridgeApi;
    MAMA_ST_HOST?: any;
    MAMA_ST_HOST_ROOT?: any;
    MAMA_ST_UI_ROOT?: any;
    MAMA_ST_API_ROOT?: any;
    MAMAMainRuntime?: any;
    MAMASchemaRuntime?: any;
    MAMAPlugin?: any;
    MAMA_ST_API?: any;
    __MAMA_ST_BRIDGE_READY__?: Promise<unknown>;
    ST_BRIDGE_PACK?: string;
    ST_BRIDGE_ENV?: string;
    ST_BRIDGE_URL?: string;
    ST_BRIDGE_MANIFEST_URL?: string;
    MAMA_APP_BASE_URL?: string;
    MAMA_APP_URL?: string;
    MAMA_STATUS_URL?: string;
    MAMA_BGM_URL?: string;
    MAMA_ASSET_BASE_URL?: string;
  }
}

export {};
