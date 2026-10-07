const API_BASE_URL = "http://localhost:5000";

export async function apiFetch(url, options = {}) {
  try {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(
        data?.message ||
          `Request failed with status ${response.status}.`
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      const networkError = new Error(
        "Unable to connect to the server. Please check your internet connection or try again later."
      );

      networkError.status = 0;
      networkError.isNetworkError = true;

      throw networkError;
    }

    throw error;
  }
}

export { API_BASE_URL };