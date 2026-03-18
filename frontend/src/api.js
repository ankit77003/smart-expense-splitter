const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5050/api";

function getToken() {
  return localStorage.getItem("ses_token");
}

export function setToken(token) {
  if (!token) localStorage.removeItem("ses_token");
  else localStorage.setItem("ses_token", token);
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  listGroups: () => request("/groups"),
  createGroup: (payload) => request("/groups", { method: "POST", body: payload }),
  getGroup: (groupId) => request(`/groups/${groupId}`),
  addMembers: (groupId, payload) => request(`/groups/${groupId}/members`, { method: "POST", body: payload }),

  listExpenses: (groupId) => request(`/groups/${groupId}/expenses`),
  addExpense: (groupId, payload) => request(`/groups/${groupId}/expenses`, { method: "POST", body: payload }),
  settlement: (groupId) => request(`/groups/${groupId}/settlement`),
};

