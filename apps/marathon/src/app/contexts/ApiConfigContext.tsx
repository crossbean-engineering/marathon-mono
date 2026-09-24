import { createContext, useContext, ReactNode } from 'react';

// Carries the already-resolved API base URL (computed once in main.tsx via
// @org/config, which uses import.meta and so can only be statically imported
// from the Vite entry point — Jest never loads main.tsx, but it does eagerly
// load the whole app.tsx route tree for component tests, so anything under
// src/app must get the base URL through context/props instead of importing
// @org/config itself).
const ApiConfigContext = createContext<string | null>(null);

export function ApiConfigProvider({ baseUrl, children }: { baseUrl: string; children: ReactNode }) {
  return <ApiConfigContext.Provider value={baseUrl}>{children}</ApiConfigContext.Provider>;
}

export function useApiBaseUrl(): string {
  const baseUrl = useContext(ApiConfigContext);
  if (!baseUrl) {
    throw new Error('useApiBaseUrl must be used within ApiConfigProvider');
  }
  return baseUrl;
}
