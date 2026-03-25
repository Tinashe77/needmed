const API_URL = "http://127.0.0.1:5001/api";

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed.");
  }

  return data;
};
