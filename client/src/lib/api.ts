// For mobile testing, use the computer's IP address instead of localhost
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isMobile ? "http://192.168.3.11:4000" : "http://localhost:4000");

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Now using real API instead of mock
  const url = `${API_BASE_URL}${endpoint}`;

  // Mobile-friendly timeout (15 seconds for mobile connections)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const timeout = isMobile ? 15000 : 10000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`API request timeout for ${endpoint} (${timeout}ms)`);
      throw new Error('Request timeout - please check your connection');
    }

    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}
