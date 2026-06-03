const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "API request failed");
  }

  return data;
}

export function listPollMetadata() {
  return request("/api/polls");
}

export function savePollMetadata(metadata) {
  return request("/api/polls", {
    method: "POST",
    body: JSON.stringify(metadata)
  });
}
