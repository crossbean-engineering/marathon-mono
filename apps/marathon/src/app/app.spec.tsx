import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AkMarathonSDKProvider } from '@ak-marathon/sdk';
import { AuthProvider } from './contexts/AuthContext';

import App from './app';

// Routes that render without hitting the API, so this stays a pure smoke test
// of the app shell and router.
function renderAt(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AkMarathonSDKProvider baseUrl="http://localhost/api" getAuthorization={() => undefined}>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      </AkMarathonSDKProvider>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the not-found page for unknown routes', () => {
    renderAt('/no-such-page');
    expect(screen.getByText('Oops! Page not found')).toBeTruthy();
  });

  it('renders the unauthorized page', () => {
    renderAt('/unauthorized');
    expect(screen.getByText("You don't have permission to access this page.")).toBeTruthy();
  });
});
