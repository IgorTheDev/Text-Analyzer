export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Now using real API instead of mock
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}
