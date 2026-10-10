const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api";

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  track: "new" | "licensed";
  dailyGoal: number;
  notificationsOn: boolean;
  reminderTime: string;
  sounds: boolean;
};

type AuthResponse = { token: string; user: ApiUser };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as { error?: string } | T | null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? body.error : "The server request failed";
    throw new Error(message || "The server request failed");
  }
  return body as T;
}

export function register(name: string, email: string, password: string, track: "new" | "licensed") {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, track }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

function authorizedRequest<T>(token: string, path: string, options: RequestInit = {}) {
  return request<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export function getCurrentUser(token: string) {
  return authorizedRequest<{ user: ApiUser }>(token, "/me");
}

export function updateSettings(token: string, settings: Partial<{
  name: string;
  track: "new" | "licensed";
  dailyGoal: number;
  notificationsOn: boolean;
  reminderTime: string;
  sounds: boolean;
}>) {
  return authorizedRequest<{ user: ApiUser }>(token, "/me/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}

export function saveQuizAttempt(token: string, score: number, total: number) {
  return authorizedRequest<{ saved: boolean }>(token, "/progress/quiz", {
    method: "POST",
    body: JSON.stringify({ score, total }),
  });
}

export function saveStudyProgress(token: string, studySet: string, cardsCompleted: number, cardsTotal: number, accuracy = 0) {
  return authorizedRequest<{ saved: boolean }>(token, "/progress/study", {
    method: "PUT",
    body: JSON.stringify({ studySet, cardsCompleted, cardsTotal, accuracy }),
  });
}

export type ApiNotification = {
  id: string;
  kind: "streak" | "reminder" | "lesson" | "quiz" | "tip" | "system";
  title: string;
  body: string;
  target?: string;
  time: number;
  read: boolean;
};

export function getNotifications(token: string) {
  return authorizedRequest<{ notifications: ApiNotification[] }>(token, "/notifications");
}

export function markNotificationRead(token: string, id: string, read: boolean) {
  return authorizedRequest<void>(token, `/notifications/${encodeURIComponent(id)}/read`, {
    method: read ? "PATCH" : "DELETE",
  });
}

export function markAllNotificationsRead(token: string) {
  return authorizedRequest<void>(token, "/notifications/read-all", { method: "PATCH" });
}

export function deleteNotification(token: string, id: string) {
  return authorizedRequest<void>(token, `/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function askLocalAi(token: string, messages: { role: "user" | "assistant"; content: string }[]) {
  return authorizedRequest<{ text: string; model: string }>(token, "/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}

export function updateReminderSettings(token: string, reminders: boolean, reminderTime: string) {
  return updateSettings(token, {
    notificationsOn: reminders,
    reminderTime,
  });
}

export function saveLicense(token: string, license: { number: string; fileName: string; thumb: string | null }) {
  return authorizedRequest<void>(token, "/me/license", {
    method: "PUT",
    body: JSON.stringify(license),
  });
}

export function deleteLicense(token: string) {
  return authorizedRequest<void>(token, "/me/license", { method: "DELETE" });
}
