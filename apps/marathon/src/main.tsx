import { StrictMode, useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AkMarathonSDKProvider } from '@ak-marathon/sdk';
import { getApiUri } from '@org/config';
import { Toaster as SonnerToaster } from "sonner";

import "./tailwind.css"
import App from './app/app';
import { AuthProvider } from './app/contexts/AuthContext';
import { ApiConfigProvider } from './app/contexts/ApiConfigContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const API_BASE_URL = getApiUri('ak_marathon');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AkMarathonSDKProvider
        baseUrl={API_BASE_URL}
        getAuthorization={() => {
          const token = localStorage.getItem('auth_token');
          return token ? { Authorization: `Bearer ${token}` } : undefined;
        }}
      >

        <ApiConfigProvider baseUrl={API_BASE_URL}>
          <BrowserRouter>
            <ScrollToTop />
           <AuthProvider>
              <SonnerToaster
                expand={false}
                position="top-right"
                richColors
                closeButton
              />
            <App />
           </AuthProvider>
          </BrowserRouter>
        </ApiConfigProvider>
      </AkMarathonSDKProvider>
    </QueryClientProvider>
  </StrictMode>
);
