export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit,
  timeout: number = 30000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      console.error(`[fetchWithTimeout] ${response.status} ${response.statusText}`, { url, body: errorData });
      throw new Error(
        errorData.status_message ||
          errorData.StatusMessage ||
          `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
