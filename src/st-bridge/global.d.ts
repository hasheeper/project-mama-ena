import type { MamaSTBridgeApi } from '../bridge/st-bridge-types';

declare global {
  const unsafeWindow: any;
  const handleVariablesInMessage: any;

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
    ST_BRIDGE_PACK?: string;
    ST_BRIDGE_URL?: string;
    ST_BRIDGE_MANIFEST_URL?: string;
  }
}

export {};
