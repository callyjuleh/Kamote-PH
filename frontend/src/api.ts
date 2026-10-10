const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api";

export type LicenseStatus = "none" | "pending" | "verified" | "rejected";

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  track: "new" | "licensed";
  dailyGoal: number;
  notificationsOn: boolean;
  reminderTime: string;
  sounds: boolean;
  licenseStatus?: LicenseStatus;
  licenseReviewNote?: string | null;
  consent?: {
    privacy: { version: string | null; acceptedAt: string | null };
    terms: { version: string | null; acceptedAt: string | null };
  };
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
  return authorizedRequest<{
    text: string;
    model: string;
    mode: "vector" | "keyword-fallback" | "keyword" | "local-general" | "local-smalltalk";
    warning: string | null;
  }>(token, "/ai/chat", {
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
  return authorizedRequest<{ user: ApiUser }>(token, "/me/license", {
    method: "PUT",
    body: JSON.stringify(license),
  });
}

export function deleteLicense(token: string) {
  return authorizedRequest<{ user: ApiUser }>(token, "/me/license", { method: "DELETE" });
}

// ───────── Flashcards ─────────

export type ApiDeck = { deck: string; category: string; icon: string; total: number };
export type ApiCard = { id: number; deck: string; category: string; icon: string; front: string; back: string };

export function getFlashcardDecks() {
  return request<{ decks: ApiDeck[] }>("/flashcards/decks");
}

export function getFlashcards(deck?: string) {
  const query = deck ? `?deck=${encodeURIComponent(deck)}` : "";
  return request<{ cards: ApiCard[] }>(`/flashcards${query}`);
}

export type ApiFlashcardProgress = { deck: string; currentIndex: number; cardsTotal: number; updatedAt: string };

export function getMyFlashcardProgress(token: string) {
  return authorizedRequest<{ progress: ApiFlashcardProgress[] }>(token, "/me/flashcards");
}

export function saveMyFlashcardProgress(token: string, deck: string, currentIndex: number, cardsTotal: number) {
  return authorizedRequest<void>(token, "/me/flashcards", {
    method: "PUT",
    body: JSON.stringify({ deck, currentIndex, cardsTotal }),
  });
}

// ───────── Achievements / goals / suggestions / history ─────────

export type ApiAchievement = { id: number; code: string; title: string; description: string; icon: string; earned: boolean; earnedAt: string | null };

export function getAchievements(token: string) {
  return authorizedRequest<{ achievements: ApiAchievement[] }>(token, "/me/achievements");
}

export type ApiGoals = {
  dailyGoal: number;
  stats: { cardsReviewed: number; decksTouched: number; quizzesTaken: number; quizzesPassed: number; lessonsCompleted: number; streak: number };
  weekly: ApiDailyStudyProgress[];
  goals: { key: string; label: string; target: number; current?: number; done: boolean }[];
};

export function getGoals(token: string) {
  return authorizedRequest<ApiGoals>(token, "/me/goals");
}

// ───────── Lessons / study (progress-aware) ─────────

export type ApiStudyLesson = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  icon: string | null;
  order_index: number;
  duration_min: number;
  section_count: number;
  quiz_id: number | null;
  status: "not_started" | "in_progress" | "completed";
  completed_at: string | null;
};

export function getStudy(token: string) {
  return authorizedRequest<{ data: ApiStudyLesson[] }>(token, "/me/study");
}

export type ApiLesson = Omit<ApiStudyLesson, "status" | "completed_at"> & {
  quiz_id?: number | null;
};

export function getLessons() {
  return request<{ data: ApiLesson[] }>("/lessons");
}

export type ApiDailyStudyProgress = { date: string; cardsReviewed: number };

export type ApiLessonSection = { id: number; heading: string; body: string; media_url: string | null; source_document: string | null; source_page: string | null; source_ref: string | null; order_index: number };
export type ApiLessonDetail = { id: number; title: string; description: string | null; category: string; icon: string | null; duration_min: number; sections: ApiLessonSection[] };

export function getLesson(id: number) {
  return request<{ data: ApiLessonDetail }>(`/lessons/${id}`);
}

export type ApiAttempt = { id: number; quizId: number; title: string; kind: string; score: number; total: number; percent: number; passed: boolean; completedAt: string };

export function getAttemptHistory(token: string) {
  return authorizedRequest<{ attempts: ApiAttempt[] }>(token, "/me/attempts");
}

export type ApiSuggestions = {
  personalized: boolean;
  weakCategories: { lessonTitle: string; category: string; wrong: number; answered: number }[];
  wrongQuestions: { questionId: number; prompt: string; lessonId: number | null }[];
  recentAttempts: ApiAttempt[];
  general: { lessonId: number; title: string; category: string; question: string }[];
  personalizedPrompts: string[];
};

export function getSuggestions(token: string) {
  return authorizedRequest<ApiSuggestions>(token, "/me/suggestions");
}

// ───────── Persistent quiz sessions ─────────

export type QuizAnswer = { questionId: number; optionId: number | null };
export type QuizSession = { attemptId: number; currentIndex: number; answers: QuizAnswer[]; resumed?: boolean };

export type ApiQuizQuestion = {
  id: number;
  prompt: string;
  points: number;
  order_index: number;
  options: { id: number; body: string; order_index: number }[];
};

export type ApiQuiz = {
  id: number;
  lessonId: number | null;
  title: string;
  description: string;
  kind: string;
  timeLimit: number;
  passScore: number;
  questions: ApiQuizQuestion[];
};

export function getQuiz(quizId: number) {
  return request<{ data: ApiQuiz }>(`/quizzes/${quizId}`);
}

export function startQuizSession(token: string, quizId: number) {
  return authorizedRequest<{ data: QuizSession }>(token, `/quizzes/${quizId}/start`, { method: "POST" });
}

export function getQuizSession(token: string, quizId: number) {
  return authorizedRequest<{ data: QuizSession | null }>(token, `/quizzes/${quizId}/attempt`);
}

export function saveQuizSession(token: string, quizId: number, attemptId: number, answers: QuizAnswer[], currentIndex: number) {
  return authorizedRequest<{ data: QuizSession }>(token, `/quizzes/${quizId}/attempt`, {
    method: "PUT",
    body: JSON.stringify({ attemptId, answers, currentIndex }),
  });
}

export type ApiGradedOption = { id: number; body: string };
export type ApiGradedAnswer = {
  questionId: number;
  optionId: number | null;
  isCorrect: boolean;
  correctOptionId: number | null;
  explanation: string | null;
  prompt: string;
  options: ApiGradedOption[];
};

export function submitQuizSession(token: string, quizId: number, attemptId: number, answers: QuizAnswer[]) {
  return authorizedRequest<{ data: {
    attemptId: number;
    quizId: number;
    lessonId: number | null;
    score: number;
    totalPoints: number;
    percent: number;
    passScore: number;
    passed: boolean;
    answers: ApiGradedAnswer[];
    earnedAchievements: string[];
  } }>(
    token,
    `/quizzes/${quizId}/submit`,
    { method: "POST", body: JSON.stringify({ attemptId, answers }) }
  );
}

// ───────── Consent (privacy policy / terms) ─────────

export type ApiConsent = {
  version: string;
  privacy: { version: string | null; acceptedAt: string | null };
  terms: { version: string | null; acceptedAt: string | null };
};

export function getConsent(token: string) {
  return authorizedRequest<ApiConsent>(token, "/me/consent");
}

export function saveConsent(token: string, type: "privacy" | "terms") {
  return authorizedRequest<{ user: ApiUser }>(token, "/me/consent", {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}
