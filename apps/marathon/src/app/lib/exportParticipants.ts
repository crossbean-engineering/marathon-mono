import type { ListParticipantsQuery } from '@ak-marathon/sdk';

// GET /participants/export returns a binary .xlsx — the typed SDK hooks
// assume JSON, so this fetches directly and triggers a browser download.
//
// baseUrl is passed in (from useApiBaseUrl(), resolved once in main.tsx)
// rather than looked up here via @org/config, which uses import.meta —
// Vite-only syntax that Jest can't parse, and this module is reachable from
// component trees under test (app.spec.tsx renders <App/>, which eagerly
// pulls in every route including this one).
export async function exportParticipants(baseUrl: string, query: ListParticipantsQuery): Promise<void> {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, value]) => value !== undefined) as [string, string][]
  );

  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${baseUrl}/participants/export?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Export failed with status ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const filenameMatch = res.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/);
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: filenameMatch?.[1] ?? `participants_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });
  link.click();
  URL.revokeObjectURL(url);
}
