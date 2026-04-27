import { API_BASE } from "./types";
const TOKEN_KEY = "transaction_tracker_token";
const USER_KEY = "transaction_tracker_user";
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
export function getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event("auth:logout"));
}
export async function login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        throw new Error("Login failed");
    }
    const data = await res.json();
    saveSession(data.token, data.user);
    return data.user;
}
export async function logout() {
    const token = getToken();
    if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => undefined);
    }
    clearSession();
}
export async function apiFetch(path, init) {
    const token = getToken();
    const headers = new Headers(init?.headers ?? {});
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    const body = init?.body;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (!isFormData && !headers.has("Content-Type") && body) {
        headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (response.status === 401) {
        clearSession();
    }
    return response;
}
