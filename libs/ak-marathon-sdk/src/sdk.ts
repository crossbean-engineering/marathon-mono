import { WinRegistrySpecs, type WinRegistryApiSpecT } from './core';
import { createSDKProvider } from '@rabstack/rab-react-sdk';
import { encodeRabQuery } from '@rabstack/rab-query';

export const AkMarathonSdk = createSDKProvider<WinRegistryApiSpecT>({
  apiSpecs: WinRegistrySpecs,
  parseQuery: encodeRabQuery,
});

export const AkMarathonSDKProvider = AkMarathonSdk.SDKProvider;
export const useAkMarathonSDK = AkMarathonSdk.useSDK;
export const useAkMarathonQuery = AkMarathonSdk.useQuery;
export const useAkMarathonMutation = AkMarathonSdk.useMutation;
