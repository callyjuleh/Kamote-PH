import { CSSProperties, FormEvent, InputHTMLAttributes, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import kamoteMascot from "./assets/dai-mascot.png";
import {
  deleteNotification,
  getCurrentUser,
  getNotifications,
  askLocalAi,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  register,
  saveLicense,
  deleteLicense,
  updateSettings,
  updateReminderSettings,
  getFlashcardDecks,
  getFlashcards,
  getMyFlashcardProgress,
  saveMyFlashcardProgress,
  getStudy,
  getLessons,
  getAchievements,
  getGoals,
  getSuggestions,
  startQuizSession,
  saveQuizSession,
  submitQuizSession,
  getQuiz,
  getLesson,
  getConsent,
  saveConsent,
} from "./api";
import type { ApiCard, ApiDeck, ApiAchievement, ApiGoals, ApiSuggestions, ApiFlashcardProgress, ApiStudyLesson, ApiDailyStudyProgress, LicenseStatus, ApiConsent, ApiLessonDetail } from "./api";

type Screen =
  | "home"
  | "library"
  | "set"
  | "flashcards"
  | "quiz"
  | "feedback"
  | "results"
  | "ai"
  | "profile"
  | "settings"
  | "notifications"
  | "privacy"
  | "terms";

type IconName =
  | "home"
  | "library"
  | "study"
  | "spark"
  | "user"
  | "search"
  | "arrow"
  | "chevron"
  | "bookmark"
  | "shuffle"
  | "check"
  | "close"
  | "send"
  | "clock"
  | "cards"
  | "sign"
  | "rules"
  | "marking"
  | "exam"
  | "flame"
  | "settings"
  | "back"
  | "bell"
  | "upright"
  | "signal"
  | "plus"
  | "dai"
  | "eye"
  | "eyeOff"
  | "mail"
  | "lock"
  | "logout"
  | "help"
  | "shield"
  | "info"
  | "volume"
  | "edit"
  | "upload";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M3 10.8 12 3l9 7.8" /><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" /></>,
    library: <><path d="M4 4.5h5.5v15H4zM10 4.5h5.5v15H10z" /><path d="m16.5 5 3.2-.8 3.2 14.4-3.2.8z" /></>,
    study: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h10M7 13h6" /></>,
    spark: <><path d="m12 2 1.2 4.1a6.6 6.6 0 0 0 4.7 4.7L22 12l-4.1 1.2a6.6 6.6 0 0 0-4.7 4.7L12 22l-1.2-4.1a6.6 6.6 0 0 0-4.7-4.7L2 12l4.1-1.2a6.6 6.6 0 0 0 4.7-4.7z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    bookmark: <path d="M6 3.5h12v17L12 17l-6 3.5z" />,
    shuffle: <><path d="M3 7h3c5 0 7 10 12 10h3" /><path d="m18 14 3 3-3 3M3 17h3c2 0 3.5-1.6 5-4M15 7c1-1 2-1 3-1h3M18 3l3 3-3 3" /></>,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    send: <path d="m3 4 18 8-18 8 3-8zm3 8h15" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    cards: <><rect x="5" y="3" width="14" height="17" rx="2" /><path d="M9 7h6M9 11h6" /></>,
    sign: <><path d="M12 3 4 9v9h16V9zM12 18v3" /><circle cx="12" cy="10.5" r="2.5" /></>,
    rules: <><path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4" /></>,
    marking: <><path d="M8 3h8l3 18H5zM12 4v4M12 11v4M12 18v2" /></>,
    exam: <><path d="M7 4h10a2 2 0 0 1 2 2v15H5V6a2 2 0 0 1 2-2Z" /><path d="M9 3h6v3H9zM9 11l2 2 4-4M9 17h6" /></>,
    flame: <path d="M13 2s1 5-3 8c-2 1.5-3 3.5-2 6a4.4 4.4 0 0 0 8.5-.5c.5-3-1.5-5.5-2.5-7.5 0 3-2 4-2 4s1-4-1-6c-1.5 3-5 5-6 8.5C3.8 19 7.5 22 12 22a8 8 0 0 0 8-8c0-5-3-8.5-7-12Z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    back: <path d="m15 18-6-6 6-6" />,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9Z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></>,
    signal: <><rect x="8" y="2.5" width="8" height="19" rx="3" /><circle cx="12" cy="7" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="17" r="1.6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <path d="M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.3 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>,
    lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
    logout: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></>,
    shield: <><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z" /><path d="m9 12 2 2 4-4" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></>,
    volume: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
    upload: <><path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
    edit: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
    dai: <><path d="M4 11.5a7.5 7 0 0 1 7.5-7h1A7.5 7 0 0 1 20 11.5a7.5 7 0 0 1-7.5 7H9l-4 2.5.9-3.9A7 7 0 0 1 4 11.5Z" /><path d="M12 7.6l1 2.9 2.9 1-2.9 1-1 2.9-1-2.9-2.9-1 2.9-1z" fill="currentColor" stroke="none" /></>,
    upright: <path d="M7 17 17 7M8.5 7H17v8.5" />,
  };
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Progress({ value }: { value: number }) {
  return <div className="progress"><span style={{ width: `${value}%` }} /></div>;
}

function AppHeader({
  title,
  subtitle,
  back,
  backLabel = "Back",
  action,
}: {
  title: string;
  subtitle?: string;
  back?: () => void;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      {(back || action) && (
        <div className="nav-bar">
          {back ? (
            <button className="back-link" onClick={back} aria-label={`Back to ${backLabel}`}>
              <Icon name="back" size={22} />
              <span>{backLabel}</span>
            </button>
          ) : <span />}
          {action && <div className="page-header-action">{action}</div>}
        </div>
      )}
      <div className="large-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}

function citationText(document: string | null | undefined, page: string | number | null | undefined): string | null {
  const doc = String(document ?? "").toLowerCase();
  let label = "";
  if (/ro102/.test(doc)) label = "RO102";
  else if (/fdm[- ]vol.?[- ]1/.test(doc)) label = "FDM Vol. 1";
  else if (/fdm[- ]vol.?[- ]2/.test(doc)) label = "FDM Vol. 2";
  else if (/traffic[-_ ]law/.test(doc)) label = "Traffic Law";
  else label = String(document ?? "").replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim() || "LTO reference";
  const pageRef = page != null && String(page).trim() !== "" ? ` p.${page}` : "";
  return pageRef ? `(${label}${pageRef})` : null;
}

const services: { icon: IconName; label: string; screen: Screen; tone: string; focus?: string }[] = [
  { icon: "cards", label: "Flashcards", screen: "flashcards", tone: "blue", focus: "Road Signs" },
  { icon: "exam", label: "Practice", screen: "quiz", tone: "red", focus: "3" },
  { icon: "sign", label: "Road signs", screen: "set", tone: "yellow", focus: "Road Signs" },
  { icon: "rules", label: "Road rules", screen: "set", tone: "blue", focus: "Road Rules" },
  { icon: "marking", label: "Markings", screen: "set", tone: "red", focus: "Road Safety" },
  { icon: "clock", label: "Refresher", screen: "set", tone: "yellow", focus: "Traffic Laws" },
  { icon: "dai", label: "Ask Dai", screen: "ai", tone: "blue" },
  { icon: "user", label: "Progress", screen: "profile", tone: "red" },
];

type Lamp = "red" | "amber" | "green";

function TrafficLight({ lit, flashing = false, size = "md" }: { lit: Lamp[]; flashing?: boolean; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`traffic-light ${size}`} aria-hidden="true">
      {(["red", "amber", "green"] as Lamp[]).map((lamp) => {
        const on = lit.includes(lamp);
        return <span key={lamp} className={`${lamp} ${on ? "on" : ""} ${on && flashing ? "flash" : ""}`} />;
      })}
    </div>
  );
}

function GoalChart({ selectable = false, onOpen, weekly = [], dailyGoal = 10 }: { selectable?: boolean; onOpen?: () => void; weekly?: ApiDailyStudyProgress[]; dailyGoal?: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [today] = useState(() => new Date());
  const week = useMemo(() => {
    const byDate = new Map(weekly.map((item) => [item.date, item.cardsReviewed]));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return {
        day: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date).slice(0, 1),
        date: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", weekday: "long" }).format(date),
        cardsReviewed: byDate.get(key) ?? 0,
      };
    });
  }, [weekly, today]);
  const max = Math.max(dailyGoal * 2, ...week.map((item) => item.cardsReviewed), 1);
  const average = Math.round(week.reduce((sum, item) => sum + item.cardsReviewed, 0) / week.length);
  const current = selected === null ? null : week[selected];
  const goalDays = week.filter((item) => item.cardsReviewed >= dailyGoal).length;
  return (
    <section className="week-card">
      <div className="week-head">
        <div>
          <span className="week-title">Weekly card goal</span>
          <strong className="week-number">{current ? current.cardsReviewed : average}</strong>
          <span className="week-sub">{current ? current.date : "Average cards per day"}</span>
        </div>
        <div className="week-head-side">
          {onOpen && <button className="text-button" onClick={onOpen}>Details</button>}
          <span className="goal-key"><i />{dailyGoal} cards</span>
        </div>
      </div>
      <div className="chart">
        <div className="goal-rule" style={{ bottom: `${(dailyGoal / max) * 100}%` }} />
        {week.map((item, index) => {
          const total = item.cardsReviewed;
          const met = total >= dailyGoal;
          const isSelected = selected === index;
          const tone = isSelected ? "stack" : selected !== null ? "dim" : met ? "met" : "missed";
          const bar = (
            <div className={`bar ${tone}`} style={{ height: `${(total / max) * 100}%` }}>
              {isSelected && total > 0 && <span className="blue" style={{ height: "100%" }} />}
            </div>
          );
          return selectable ? (
            <button className="bar-col" key={index} onClick={() => setSelected(isSelected ? null : index)} aria-label={`${item.date}: ${total} cards reviewed`} aria-pressed={isSelected}>{bar}</button>
          ) : (
            <div className="bar-col" key={index}>{bar}</div>
          );
        })}
      </div>
      <div className="chart-days">
        {week.map((item, index) => {
          const met = item.cardsReviewed >= dailyGoal;
          return (
            <div key={index} className={selected === index ? "selected" : ""}>
              <span>{item.day}</span>
              <i className={met ? "met" : "missed"}><Icon name={met ? "check" : "close"} size={10} /></i>
            </div>
          );
        })}
      </div>
      <div className="week-foot"><span>Goal achieved</span><strong>{goalDays}/7 days</strong></div>
    </section>
  );
}

type Track = "new" | "licensed";

const trackCopy: Record<Track, {
  switchLabel: string; title: string; body: string; role: string; goal: string;
  metricLabel: string; next: string; profileRole: string; bandSub: string; ringLabel: string; ringTitle: string;
}> = {
  new: {
    switchLabel: "New driver",
    title: "Handa ka na, {name}?",
    body: "Get road-ready for your LTO written exam, one rule at a time.",
    role: "New driver",
    goal: "First license",
    metricLabel: "Exam readiness",
    next: "Flashing signals",
    profileRole: "New driver",
    bandSub: "Track your road to the LTO written exam.",
    ringLabel: "Exam ready",
    ringTitle: "LTO exam readiness",
  },
  licensed: {
    switchLabel: "Licensed driver",
    title: "Refresh tayo, {name}?",
    body: "Brush up on signs, signals, and road rules anytime.",
    role: "Licensed driver",
    goal: "Rules refresher",
    metricLabel: "Rules mastery",
    next: "Right-of-way refresher",
    profileRole: "Licensed driver",
    bandSub: "See how well you still know the rules of the road.",
    ringLabel: "Mastered",
    ringTitle: "Rules mastery",
  },
};

function TrackSwitch({ track, onChange }: { track: Track; onChange: (track: Track) => void }) {
  return (
    <div className="track-switch" role="radiogroup" aria-label="I am a">
      {(["new", "licensed"] as Track[]).map((item) => (
        <button key={item} role="radio" aria-checked={track === item} className={track === item ? "active" : ""} onClick={() => onChange(item)}>
          {trackCopy[item].switchLabel}
        </button>
      ))}
    </div>
  );
}

function Home({ navigate, token, track, user, dailyGoal, unread, goals, consentDue, onAcceptConsent }: { navigate: (screen: Screen, focus?: string) => void; token: string | null; track: Track; user: User; dailyGoal: number; unread: number; goals: ApiGoals | null; consentDue: boolean; onAcceptConsent: (type: "privacy" | "terms") => void }) {
  const copy = trackCopy[track];
  const first = firstName(user.name);
  const { lessons, loading: lessonsLoading, error: lessonsError } = useStudyLessons(token);
  const continueLesson = lessons.find((lesson) => lesson.status === "in_progress")
    ?? lessons.find((lesson) => lesson.status !== "completed")
    ?? lessons[0];
  const stats = goals?.stats;
  const done = Math.min(stats?.cardsReviewed ?? 0, dailyGoal);
  const streak = stats?.streak ?? 0;
  const statTiles: { tone: string; icon: IconName; value: string; unit: string; label: string }[] = [
    { tone: "blue", icon: "check", value: String(stats?.cardsReviewed ?? 0), unit: "cards", label: "Cards reviewed" },
    { tone: "yellow", icon: "flame", value: String(streak), unit: "days", label: "Study streak" },
    { tone: "red", icon: "exam", value: String(stats?.quizzesTaken ?? 0), unit: "taken", label: "Quizzes taken" },
    { tone: "sky", icon: "clock", value: String(stats?.lessonsCompleted ?? 0), unit: "lessons", label: "Lessons completed" },
  ];
  return (
    <main className="screen">
      {consentDue && (
        <section className="consent-banner" role="region" aria-label="Privacy and terms">
          <div className="consent-banner-copy">
            <strong><Icon name="shield" size={16} /> A quick heads-up</strong>
            <p>The road changed its rules with you in mind. Please review and accept our <br />documents to keep studying uninterrupted.</p>
          </div>
          <div className="consent-actions">
            <button className="button secondary consent-link" onClick={() => navigate("privacy")}>Read privacy</button>
            <button className="button secondary consent-link" onClick={() => navigate("terms")}>Read terms</button>
            <button className="button primary consent-accept" onClick={() => onAcceptConsent("privacy")}>Accept privacy</button>
            <button className="button primary consent-accept" onClick={() => onAcceptConsent("terms")}>Accept terms</button>
          </div>
        </section>
      )}
      <section className="gov-hero">
        <div className="gov-hero-top">
          <div className="app-title">
            <strong className="app-wordmark">Kamote <em>PH</em></strong>
            <small className="app-title-greeting">Magandang araw, {first}!</small>
          </div>
          <div className="hero-actions">
            <button className="icon-button bell" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} onClick={() => navigate("notifications")}>
              <Icon name="bell" size={19} />
              {unread > 0 && <i className="bell-count">{unread > 9 ? "9+" : unread}</i>}
            </button>
            <button className="profile-shortcut" onClick={() => navigate("profile")} aria-label="Open profile">
              <span className="avatar">{initials(user.name)}</span>
            </button>
          </div>
        </div>

        <div className="track-row"><span>Driver status</span><strong className="track-status">{copy.profileRole}</strong></div>
        <div className="hero-intro">
          <div className="hero-intro-copy">
            <h1>{copy.title.replace("{name}", first)}</h1>
            <p>{copy.body}</p>
          </div>
          <img className="hero-mascot" src={kamoteMascot} alt="Dai, the Kamote PH mascot, in a salakot holding a traffic baton" />
        </div>

        <div className="id-card">
          <div className="id-card-head">
            <span className="id-seal"><Icon name="cards" size={20} /></span>
            <span className="id-card-title"><small>Kamote PH · Learner card</small><strong>{copy.role}</strong></span>
            <span className="id-status">Active</span>
          </div>
          <div className="id-card-fields">
            <div><small>Goal</small><strong>{copy.goal}</strong></div>
            <div><small>{copy.metricLabel}</small><strong>{Math.min(99, (stats?.quizzesPassed ?? 0) * 20)}%</strong></div>
            <div><small>Streak</small><strong>{streak} day{streak === 1 ? "" : "s"}</strong></div>
          </div>
          <div className="id-goal">
            <div><span>Today's goal</span><strong>{done} / {dailyGoal} cards</strong></div>
            <div className="signal-progress light"><span style={{ width: `${(done / dailyGoal) * 100}%` }} /></div>
          </div>
          <button className="id-cta" onClick={() => navigate("set", continueLesson?.title)} disabled={!continueLesson}>
            <span><small>Up next</small>{continueLesson?.title ?? (lessonsLoading ? "Loading lessons" : "No lessons available")}</span>
            <span className="id-cta-icon"><Icon name="arrow" size={18} /></span>
          </button>
          <i className="flag-stripe" aria-hidden="true" />
        </div>
      </section>

      <section className="section-block services-block">
        <div className="section-heading row">
          <h2>Services</h2>
          <button className="text-button" onClick={() => navigate("library")}>See all</button>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <button className="service" key={service.label} onClick={() => navigate(service.screen, service.focus)}>
              <span className={`service-icon ${service.tone}`}><Icon name={service.icon} size={22} /></span>
              <span>{service.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="section-heading row stats-heading"><h2>Your stats</h2><span className="muted">This month</span></div>
      <section className="stat-grid">
        {statTiles.map((tile) => (
          <div className={`stat-tile ${tile.tone}`} key={tile.label}>
            <span className="stat-icon"><Icon name={tile.icon} size={17} /></span>
            <strong>{tile.value}{tile.unit && <small> {tile.unit}</small>}</strong>
            <span className="stat-label">{tile.label}</span>
          </div>
        ))}
      </section>

      <GoalChart onOpen={() => navigate("profile")} weekly={goals?.weekly} dailyGoal={dailyGoal} />

      <section className="section-block">
        <div className="section-heading row">
          <h2>Continue learning</h2>
          <button className="text-button" onClick={() => navigate("library")}>Library</button>
        </div>
        {lessonsLoading && <div className="empty-state"><strong>Loading lessons…</strong><p>Checking your saved lesson progress.</p></div>}
        {!lessonsLoading && lessonsError && <div className="empty-state" role="alert"><strong>Could not load lessons</strong><p>{lessonsError}</p></div>}
        {!lessonsLoading && !lessonsError && !continueLesson && <div className="empty-state"><strong>No lessons available</strong><p>Lessons will appear here when they are added.</p></div>}
        {!lessonsLoading && !lessonsError && continueLesson && <button className="continue-card" onClick={() => navigate("set", continueLesson.title)}>
          <svg className="continue-swirl" viewBox="0 0 200 160" aria-hidden="true">
            <path d="M40 170C70 110 130 90 170 100c40 10 40-50 0-60-40-10-50 30-20 50 30 20 70 10 90-10" />
          </svg>
          <div className="continue-meta">
            <span className="continue-level"><span className="level-icon"><Icon name={lessonIcon(continueLesson.category)} size={19} /></span>{continueLesson.category}</span>
            <span className="time-pill"><Icon name="clock" size={15} />{continueLesson.duration_min} min</span>
          </div>
          <h3>{continueLesson.title}</h3>
          <p>{continueLesson.description}</p>
          <div className="continue-bottom">
            <span>{statusLabel(continueLesson.status)}</span>
            <span className="ring-arrow" style={{ "--p": continueLesson.status === "completed" ? "100%" : "0%" } as CSSProperties}>
              <span><Icon name="upright" size={18} /></span>
            </span>
          </div>
        </button>}
      </section>

    </main>
  );
}

function useStudyLessons(token: string | null) {
  const [result, setResult] = useState<{ token: string | null; lessons: ApiStudyLesson[]; loading: boolean; error: string }>({
    token,
    lessons: [],
    loading: true,
    error: "",
  });
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const lessons: ApiStudyLesson[] = token
          ? (await getStudy(token)).data
          : (await getLessons()).data.map((lesson) => ({
              ...lesson,
              quiz_id: lesson.quiz_id ?? null,
              status: "not_started",
              completed_at: null,
            }));
        if (!active) return;
        setResult({ token, lessons, loading: false, error: "" });
      } catch (error) {
        if (active) setResult({ token, lessons: [], loading: false, error: error instanceof Error ? error.message : "Unable to load lessons." });
      }
    };
    void load();
    return () => { active = false; };
  }, [token]);
  return result.token === token ? result : { token, lessons: [], loading: true, error: "" };
}

function lessonIcon(category: string): IconName {
  if (/sign/i.test(category)) return "sign";
  if (/rule|law/i.test(category)) return "rules";
  if (/safety/i.test(category)) return "marking";
  if (/vehicle/i.test(category)) return "cards";
  return "library";
}

function statusLabel(status: ApiStudyLesson["status"]) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

function Library({ navigate, token }: { navigate: (screen: Screen, focus?: string) => void; token: string | null }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const { lessons, loading, error } = useStudyLessons(token);
  const categories = [...new Set(lessons.map((lesson) => lesson.category))];
  const filtered = lessons.filter((lesson) => {
    const matchesQuery = `${lesson.title} ${lesson.description ?? ""} ${lesson.category}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "All" || lesson.category === filter;
    return matchesQuery && matchesFilter;
  });
  return (
    <main className="screen">
      <AppHeader title="Your library" subtitle="Study sets for the road ahead." />
      <label className="search-box">
        <Icon name="search" size={19} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search traffic rules and road signs" />
      </label>
      <div className="filter-row">
        {["All", ...categories].map((item) => (
          <button className={`chip ${filter === item ? "active" : ""}`} onClick={() => setFilter(item)} aria-pressed={filter === item} key={item}>{item}</button>
        ))}
      </div>
      <section className="section-block library-block">
        <div className="section-heading row"><h2>{filter === "All" ? "Study sets" : filter}</h2><span className="muted">{filtered.length} {filtered.length === 1 ? "lesson" : "lessons"}</span></div>
        {loading && <div className="empty-state"><strong>Loading lessons…</strong><p>Checking your saved lesson progress.</p></div>}
        {!loading && error && <div className="empty-state" role="alert"><strong>Could not load lessons</strong><p>{error}</p></div>}
        {filtered.length === 0 && (
          <div className="empty-state" hidden={loading || Boolean(error)}>
            <span className="stat-icon"><Icon name="search" size={18} /></span>
            <strong>No lessons found</strong>
            <p>Try another word, or browse all lessons.</p>
            <button className="button secondary" onClick={() => { setQuery(""); setFilter("All"); }}>Show all lessons</button>
          </div>
        )}
        <div className="set-list" hidden={loading || Boolean(error) || filtered.length === 0}>
          {filtered.map((lesson) => (
            <button className="set-row" key={lesson.id} onClick={() => navigate("set", lesson.title)}>
              <span className="set-icon"><Icon name={lessonIcon(lesson.category)} size={22} /></span>
              <span className="set-content">
                <span className="set-title-line"><strong>{lesson.title}</strong><small>{lesson.category}</small></span>
                <span className="set-description">{lesson.description}</span>
                <span className="set-footer"><span>{lesson.section_count} sections</span><span>•</span><span>{statusLabel(lesson.status)}</span></span>
                <Progress value={lesson.status === "completed" ? 100 : 0} />
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function SetDetail({ navigate, focus, token }: { navigate: (screen: Screen, focus?: string) => void; focus?: string; token: string | null }) {
  const { lessons, loading, error } = useStudyLessons(token);
  const [saved, setSaved] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quizData, setQuizData] = useState<{ id: number; count: number; error: string } | null>(null);
  const [detail, setDetail] = useState<ApiLessonDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const focusQuizId = Number(focus);
  const focusLesson = (focus
    ? lessons.find((lesson) => lesson.title === focus)
      ?? lessons.find((lesson) => focusQuizId > 0 && lesson.quiz_id === focusQuizId)
      ?? lessons.find((lesson) => lesson.category === focus || lesson.title.toLowerCase().includes(focus.toLowerCase()))
    : undefined)
    ?? lessons[0];
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedId) ?? focusLesson;
  const completed = lessons.filter((lesson) => lesson.status === "completed").length;
  const percent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
  const questionsAvailable = quizData && selectedLesson && quizData.id === selectedLesson.quiz_id ? quizData.count : 0;
  useEffect(() => {
    const quizId = selectedLesson?.quiz_id;
    if (!quizId) return;
    let active = true;
    getQuiz(quizId)
      .then(({ data }) => {
        if (active) setQuizData({ id: quizId, count: data.questions.length, error: "" });
      })
      .catch((error) => {
        if (active) setQuizData({ id: quizId, count: 0, error: error instanceof Error ? error.message : "Unable to load quiz data." });
      });
    return () => { active = false; };
  }, [selectedLesson?.quiz_id]);
  useEffect(() => {
    const lessonId = selectedLesson?.id;
    if (!lessonId) return;
    let active = true;
    getLesson(lessonId)
      .then(({ data }) => { if (active) { setDetail(data); setDetailError(""); } })
      .catch((loadError) => { if (active) { setDetail(null); setDetailError(loadError instanceof Error ? loadError.message : "Unable to load module content."); } });
    return () => { active = false; };
  }, [selectedLesson?.id]);
  const loadedDetail = detail && selectedLesson && detail.id === selectedLesson.id ? detail : null;
  return (
    <main className="screen">
      <AppHeader
        title="Lesson"
        back={() => navigate("library")} backLabel="Library"
        action={<button className={`icon-button round ${saved ? "selected" : ""}`} onClick={() => setSaved(!saved)} aria-label="Save lesson" aria-pressed={saved}><Icon name="bookmark" size={18} /></button>}
      />
      <section className="lesson-hero">
        <svg className="continue-swirl" viewBox="0 0 200 160" aria-hidden="true">
          <path d="M40 170C70 110 130 90 170 100c40 10 40-50 0-60-40-10-50 30-20 50 30 20 70 10 90-10" />
        </svg>
        <div className="continue-meta">
          <span className="continue-level"><span className="level-icon"><Icon name="signal" size={19} /></span>Beginner</span>
          <span className="time-pill"><Icon name="clock" size={15} />18 min</span>
        </div>
        <div className="lesson-hero-body">
          <div>
            <h2>{selectedLesson?.title ?? "Lessons"}</h2>
            <p>{selectedLesson?.description ?? "Choose a lesson to see its progress and available study material."}</p>
          </div>
          <TrafficLight lit={["amber"]} flashing size="lg" />
        </div>
        <div className="lesson-progress">
          <div><span>{completed} of {lessons.length} lessons completed</span><strong>{percent}%</strong></div>
          <div className="signal-progress light"><span style={{ width: `${percent}%` }} /></div>
        </div>
      </section>

      <section className="lesson-facts">
        <div><strong>{selectedLesson?.section_count ?? 0}</strong><span>Sections</span></div>
        <div><strong>{questionsAvailable}</strong><span>Questions</span></div>
        <div><strong>{lessons.length}</strong><span>Lessons</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading row"><h2>Units</h2><span className="muted">{loading ? "Loading…" : `${completed} completed`}</span></div>
        {!loading && error && <div className="empty-state" role="alert"><strong>Could not load progress</strong><p>{error}</p></div>}
        {!loading && !error && lessons.length === 0 && <div className="empty-state"><strong>No lessons available</strong><p>Lessons will appear here when they are added.</p></div>}
        <ol className="unit-list">
          {lessons.map((lesson, index) => {
            const unitStatus = lesson.status === "completed" ? "done" : lesson.status === "in_progress" ? "current" : "next";
            return (
            <li className={`unit ${unitStatus}`} key={lesson.id}>
              <button className="unit-select" onClick={() => setSelectedId(lesson.id)} aria-pressed={selectedLesson?.id === lesson.id}>
                <span className="unit-marker">{lesson.status === "completed" ? <Icon name="check" size={14} /> : index + 1}</span>
                <span className="unit-copy"><strong>{lesson.title}</strong><small>{lesson.section_count} sections · {statusLabel(lesson.status)}</small></span>
                {lesson.status === "in_progress" && <span className="unit-tag">In progress</span>}
              </button>
            </li>
          );})}
        </ol>
      </section>

      <section className="section-block">
        <div className="section-heading row"><h2>{selectedLesson ? selectedLesson.title : "Module"}</h2><span className="muted">{loadedDetail ? `${loadedDetail.sections.length} sections` : "Source-based"}</span></div>
        {detailError && <div className="empty-state" role="alert"><strong>Could not load module content</strong><p>{detailError}</p></div>}
        {!loadedDetail && !detailError && <div className="empty-state"><strong>Loading module…</strong><p>Pulling the sections from the LTO reference material.</p></div>}
        {loadedDetail && loadedDetail.sections.length === 0 && <div className="empty-state"><strong>No sections yet</strong><p>This module has no content yet.</p></div>}
        {loadedDetail && loadedDetail.sections.length > 0 && (
          <div className="lesson-sections">
            {loadedDetail.sections.map((section, sectionIndex) => {
              const citation = citationText(section.source_document, section.source_page);
              return (
                <article className="lesson-section" key={section.id}>
                  <span className="section-index">{sectionIndex + 1}</span>
                  <div className="lesson-section-body">
                    <h3>{section.heading}</h3>
                    <p>{section.body}</p>
                    {(citation || section.source_ref) && (
                      <span className="section-source">
                        {citation && <span className="source-chip"><Icon name="info" size={13} />{citation}</span>}
                        {section.source_ref && <span className="source-chip"><Icon name="rules" size={13} />{section.source_ref}</span>}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="section-block">
        <h2 className="mode-title">Ways to study</h2>
        <div className="mode-grid">
          <button className="mode-tile blue" onClick={() => navigate("flashcards", selectedLesson?.category)} disabled={!selectedLesson}><span className="stat-icon"><Icon name="cards" size={17} /></span><strong>Flashcards</strong><small>Study available cards</small></button>
          <button className="mode-tile yellow" onClick={() => navigate("quiz", selectedLesson?.quiz_id ? String(selectedLesson.quiz_id) : undefined)} disabled={!selectedLesson?.quiz_id || questionsAvailable === 0}><span className="stat-icon"><Icon name="exam" size={17} /></span><strong>Practice</strong><small>{questionsAvailable ? `${questionsAvailable} questions` : "Questions not available yet"}</small></button>
          <button className="mode-tile sky" onClick={() => navigate("ai")}><span className="stat-icon"><Icon name="spark" size={17} /></span><strong>AI Tutor</strong><small>Get help</small></button>
        </div>
      </section>

      <button className="button primary lesson-cta" onClick={() => navigate("quiz", selectedLesson?.quiz_id ? String(selectedLesson.quiz_id) : undefined)} disabled={!selectedLesson?.quiz_id || questionsAvailable === 0}>{questionsAvailable ? `Practice ${selectedLesson?.title}` : "Questions will be available when added"}<Icon name="arrow" size={18} /></button>
    </main>
  );
}

function Flashcards({ navigate, token, focus }: { navigate: (screen: Screen, focus?: string) => void; token: string | null; focus?: string }) {
  const [decks, setDecks] = useState<ApiDeck[]>([]);
  const [deck, setDeck] = useState("");
  const [cards, setCards] = useState<ApiCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeMap, setResumeMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [deckResult, progressResult] = await Promise.all([
          getFlashcardDecks(),
          token ? getMyFlashcardProgress(token) : Promise.resolve({ progress: [] as ApiFlashcardProgress[] }),
        ]);
        if (!active) return;
        setDecks(deckResult.decks);
        const map: Record<string, number> = {};
        progressResult.progress.forEach((item) => { map[item.deck] = item.currentIndex; });
        setResumeMap(map);
        const wanted = focus && deckResult.decks.some((item) => item.deck === focus) ? focus : deckResult.decks[0]?.deck ?? "";
        setError("");
        setDeck(wanted);
        if (!wanted) setLoading(false);
      } catch (err) {
        if (active) { setError(err instanceof Error ? err.message : "Could not load flashcards."); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [token, focus]);

  useEffect(() => {
    if (!deck) return;
    let active = true;
    getFlashcards(deck)
      .then(({ cards: list }) => {
        if (!active) return;
        setCards(list);
        setIndex(Math.min(resumeMap[deck] ?? 0, Math.max(list.length - 1, 0)));
        setFlipped(false);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (active) { setError(err instanceof Error ? err.message : "Could not load this deck."); setLoading(false); }
      });
    return () => { active = false; };
  }, [deck, resumeMap]);

  const total = cards.length;
  const card = cards[index];
  const persist = (next: number) => {
    if (!token || !deck) return;
    saveMyFlashcardProgress(token, deck, next, total).catch((err) => console.error("Unable to save flashcard progress", err));
  };
  const move = (direction: number) => {
    setIndex((current) => {
      const next = Math.min(total - 1, Math.max(0, current + direction));
      setFlipped(false);
      persist(next);
      return next;
    });
  };
  const selectDeck = (nextDeck: string) => {
    setLoading(true);
    setError("");
    setDeck(nextDeck);
  };
  const shuffleCards = () => {
    setCards((current) => {
      const shuffled = [...current];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
      }
      if (shuffled.length > 1 && shuffled.every((item, index) => item.id === current[index].id)) {
        const first = shuffled.shift();
        if (first) shuffled.push(first);
      }
      return shuffled;
    });
    setIndex(0);
    setFlipped(false);
  };

  return (
    <main className="screen flash-screen">
      <AppHeader title={deck || "Flashcards"} back={() => navigate("set", deck)} backLabel="Lesson" />
      {decks.length > 0 && (
        <div className="filter-row">
          {decks.map((item) => (
            <button key={item.deck} className={`chip ${deck === item.deck ? "active" : ""}`} onClick={() => selectDeck(item.deck)} aria-pressed={deck === item.deck}>{item.deck}</button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="empty-state"><strong>Loading cards…</strong><p>Fetching {deck || "your deck"} from the library.</p></div>
      ) : error ? (
        <div className="empty-state"><strong>Something went wrong</strong><p>{error}</p></div>
      ) : total === 0 ? (
        <div className="empty-state">
          <span className="stat-icon"><Icon name="cards" size={18} /></span>
          <strong>No flashcards yet</strong>
          <p>This deck has no cards. Pick another deck above.</p>
        </div>
      ) : (
        <>
          <div className="study-progress">
            <span>Card {index + 1} of {total}</span><strong>{Math.round(((index + 1) / total) * 100)}%</strong>
          </div>
          <Progress value={((index + 1) / total) * 100} />
          <div className="card-tools">
            <button className="tool-button" onClick={shuffleCards}><Icon name="shuffle" size={18} />Shuffle</button>
            <button className={`icon-button ${bookmarked ? "selected" : ""}`} onClick={() => setBookmarked(!bookmarked)} aria-label="Bookmark card"><Icon name="bookmark" size={19} /></button>
          </div>
          <button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
            <span className="card-side">{flipped ? "ANSWER" : "QUESTION"}</span>
            <h2>{flipped ? card.back : card.front}</h2>
            <span className="flip-hint"><Icon name="cards" size={17} />Tap to flip</span>
          </button>
          <div className="card-nav">
            <button className="circle-button" onClick={() => move(-1)} disabled={index === 0} aria-label="Previous card"><Icon name="back" /></button>
            <span><i style={{ width: `${((index + 1) / total) * 100}%` }} /></span>
            <button className="circle-button" onClick={() => move(1)} disabled={index >= total - 1} aria-label="Next card"><Icon name="arrow" /></button>
          </div>
          <button className="ai-entry" onClick={() => navigate("ai")}><Icon name="spark" size={18} /><span><strong>Ask AI about this card</strong><small>Get an example or simpler explanation</small></span><Icon name="chevron" size={18} /></button>
        </>
      )}
    </main>
  );
}

const letter = (index: number) => String.fromCharCode(65 + index);

type QuizOption = { id: number; body: string };
type QuizQuestion = { id: number; prompt: string; points: number; options: QuizOption[] };
type QuizGradedAnswer = { questionId: number; optionId: number | null; isCorrect: boolean; correctOptionId: number | null; explanation: string | null; prompt: string; options: QuizOption[] };
type QuizSubmitResult = { attemptId: number; quizId: number; lessonId: number | null; score: number; totalPoints: number; percent: number; passScore: number; passed: boolean; answers: QuizGradedAnswer[]; earnedAchievements: string[] };

const DEFAULT_QUIZ_ID = 1;
const CONSENT_VERSION = "1.0";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function QuizRunner({ navigate, token, quizId = DEFAULT_QUIZ_ID, onResults }: { navigate: (screen: Screen, focus?: string) => void; token: string | null; quizId?: number; onResults: (result: QuizSubmitResult) => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, number | null>>({});
  const [timeLimit, setTimeLimit] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) { if (active) { setError("Sign in to start the practice quiz."); setLoading(false); } return; }
      try {
        const [quiz, session] = await Promise.all([getQuiz(quizId), startQuizSession(token, quizId)]);
        if (!active) return;
        const items = (quiz.data?.questions ?? []).map((q) => ({ id: q.id, prompt: q.prompt, points: q.points, options: (q.options ?? []).map((o) => ({ id: o.id, body: o.body })) }));
        const existing: Record<number, number | null> = {};
        session.data.answers?.forEach((answer) => { existing[answer.questionId] = answer.optionId; });
        setQuestions(items);
        setLessonId(quiz.data.lessonId ?? null);
        setAttemptId(session.data.attemptId);
        setSelections(existing);
        setIndex(Math.min(session.data.currentIndex ?? 0, Math.max(items.length - 1, 0)));
        const limit = quiz.data?.timeLimit ?? 0;
        setTimeLimit(limit);
        setTimeLeft(limit);
        setLoading(false);
      } catch (err) {
        if (active) { setError(err instanceof Error ? err.message : "Could not start the quiz."); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [token, quizId]);

  useEffect(() => {
    if (loading || paused || timeLimit <= 0 || timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((ticks) => Math.max(0, ticks - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [loading, paused, timeLimit, timeLeft]);

  const question = questions[index];
  const answered = questions.filter((q) => selections[q.id] != null).length;

  const submit = useCallback(async () => {
    if (!token || !attemptId || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const answers = questions.map((q) => ({ questionId: q.id, optionId: selections[q.id] ?? null }));
      const result = await submitQuizSession(token, quizId, attemptId, answers);
      onResults(result.data);
      navigate("results");
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not submit the quiz.");
    }
  }, [token, quizId, attemptId, questions, selections, onResults, navigate]);

  useEffect(() => {
    if (loading || questions.length === 0 || timeLimit <= 0 || timeLeft > 0) return;
    const timer = window.setTimeout(() => { void submit(); }, 0);
    return () => window.clearTimeout(timer);
  }, [timeLeft, timeLimit, loading, questions.length, submit]);

  useEffect(() => {
    if (!token || !attemptId || loading || questions.length === 0) return;
    const answers = questions.map((q) => ({ questionId: q.id, optionId: selections[q.id] ?? null }));
    saveQuizSession(token, quizId, attemptId, answers, index).catch((err) => console.error("Unable to save quiz session", err));
  }, [token, quizId, attemptId, selections, index, loading, questions]);

  const select = (optionId: number) => {
    if (!question) return;
    setSelections((prev) => ({ ...prev, [question.id]: optionId }));
  };
  const resetQuiz = () => {
    setSelections({});
    setIndex(0);
    setTimeLeft(timeLimit);
    setPaused(false);
    setError("");
    setSubmitting(false);
    submittedRef.current = false;
  };

  return (
    <main className="screen quiz-screen">
      <AppHeader
        title="Practice"
        subtitle={`${answered}/${questions.length} answered`}
        back={() => lessonId ? navigate("set", String(lessonId)) : navigate("home")} backLabel={lessonId ? "Lesson" : "Home"}
        action={
          <span className="header-actions">
            <button className="time-pill" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Resume timer" : "Pause timer"}>
              <Icon name="clock" size={14} />{paused ? `Paused · ${formatTime(timeLeft)}` : formatTime(timeLeft)}
            </button>
            <button className="header-link" onClick={resetQuiz}>Reset</button>
          </span>
        }
      />
      {loading ? (
        <div className="empty-state"><strong>Preparing your quiz…</strong><p>Grabbing the latest questions from the road library.</p></div>
      ) : error ? (
        <div className="empty-state"><strong>Can't start the quiz</strong><p>{error}<button className="button secondary dismiss" onClick={() => setError("")}>Dismiss</button></p></div>
      ) : questions.length === 0 ? (
        <div className="empty-state"><strong>No questions yet</strong><p>This quiz does not have any questions yet. Try again later.</p></div>
      ) : (
        <>
          <div className="segments" aria-label={`Question ${index + 1} of ${questions.length}`}>
            {questions.map((item, segment) => <span key={item.id} className={selections[item.id] != null ? "done" : segment === index ? "current" : ""} />)}
          </div>
          <section className="question-card">
            <span className="question-count">Question {index + 1} of {questions.length}</span>
            <h2>{question.prompt}</h2>
          </section>
          <div className="answer-list" role="radiogroup" aria-label="Answer choices">
            {question.options.map((option, optionIndex) => (
              <button
                className={`answer ${selections[question.id] === option.id ? "selected" : ""}`}
                onClick={() => select(option.id)}
                role="radio"
                aria-checked={selections[question.id] === option.id}
                key={option.id}
              >
                <span className="answer-letter">{letter(optionIndex)}</span>
                <span>{option.body}</span>
              </button>
            ))}
          </div>
          <div className="action-bar">
            <p className="action-hint" aria-live="polite">{selections[question.id] != null ? "Answered — your progress is being saved" : "Choose an answer to continue"}</p>
            <button className="button secondary" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>Back</button>
            {index < questions.length - 1 ? (
              <button className="button primary quiz-action" disabled={selections[question.id] == null} onClick={() => setIndex((current) => current + 1)}>Next<Icon name="arrow" size={18} /></button>
            ) : (
              <button className="button primary quiz-action" disabled={submitting} onClick={() => void submit()}>{submitting ? "Submitting…" : "Submit quiz"}</button>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function QuizResults({ navigate, name, result, onReview, onAskAi }: { navigate: (screen: Screen, focus?: string) => void; name: string; result: QuizSubmitResult; onReview: () => void; onAskAi: (prompt: string) => void }) {
  const correct = result.answers.filter((item) => item.isCorrect).length;
  const total = result.answers.length;
  const passed = result.passed;
  return (
    <main className="screen results-screen">
      <AppHeader title="Quiz results" back={() => result.lessonId ? navigate("set", String(result.lessonId)) : navigate("home")} backLabel={result.lessonId ? "Lesson" : "Home"} />
      <section className="results-hero">
        <div className="score-ring" style={{ "--score": `${result.percent}%` } as CSSProperties}><span><strong>{result.percent}%</strong><small>{result.score}/{result.totalPoints} pts</small></span></div>
        <h2>{passed ? `Great work, ${name}!` : `Keep going, ${name}`}</h2>
        <p>{passed ? "You passed this practice quiz. Review the ones you missed and keep your streak going." : `Passing is ${result.passScore}%. Practice on — review the explanations below and try again.`}</p>
      </section>
      {result.earnedAchievements.length > 0 && (
        <section className="earned-badges">
          {result.earnedAchievements.map((code) => <span key={code} className="badge-chip"><Icon name="check" size={14} />Earned {code.replace(/_/g, " ")}</span>)}
        </section>
      )}
      <div className="score-breakdown">
        <div><span className="status-dot correct-dot"><Icon name="check" size={17} /></span><span><strong>{correct}</strong><small>Correct</small></span></div>
        <div><span className="status-dot wrong-dot"><Icon name="close" size={17} /></span><span><strong>{total - correct}</strong><small>To review</small></span></div>
      </div>
      <section className="review-list">
        <h3>Review your answers</h3>
        {result.answers.map((item, i) => {
          const correctIndex = (item.options ?? []).findIndex((option) => option.id === item.correctOptionId);
          const pickedIndex = (item.options ?? []).findIndex((option) => option.id === item.optionId);
          return (
            <div className={`review-item ${item.isCorrect ? "good" : "bad"}`} key={item.questionId}>
              <div className="review-head"><span className={`status-dot ${item.isCorrect ? "correct-dot" : "wrong-dot"}`}><Icon name={item.isCorrect ? "check" : "close"} size={14} /></span><p><b>Question {i + 1}.</b> {item.prompt}</p></div>
              <p className="review-answer"><b>Your answer:</b> {pickedIndex >= 0 ? `${letter(pickedIndex)}. ${item.options[pickedIndex].body}` : "Not answered"}</p>
              {!item.isCorrect && correctIndex >= 0 && <p className="review-answer correct"><b>Correct answer:</b> {letter(correctIndex)}. ${item.options[correctIndex].body}</p>}
              {item.explanation && <p className="review-note">{item.explanation}</p>}
            </div>
          );
        })}
      </section>
      <div className="action-stack">
        <button className="button primary" onClick={onReview}>{result.lessonId ? "Review the lesson" : "Back to home"}<Icon name="arrow" size={18} /></button>
        <button className="button secondary" onClick={() => navigate("quiz", String(result.quizId))}>Try again</button>
      </div>
      <button
        className="ai-entry"
        onClick={() => {
          const missed = result.answers.filter((a) => !a.isCorrect);
          let prompt = `Explain my mistakes for this quiz: `;
          if (missed.length === 0) {
            prompt = `I got all answers correct for this quiz. Can you give me a quick summary of key takeaways? `;
          } else {
            prompt += missed.slice(0, 5).map((m, idx) => `Q${idx + 1}. ${m.prompt}\n- My answer: ${(m.options.find(o => o.id === m.optionId))?.body || "Not answered"}\n- Correct: ${(m.options.find(o => o.id === m.correctOptionId))?.body || ""}`).join("\n\n");
          }
          onAskAi(prompt);
        }}
      >
        <Icon name="spark" size={18} />
        <span><strong>Ask AI to explain my mistakes</strong><small>Understand the rules you missed</small></span>
        <Icon name="chevron" size={18} />
      </button>
    </main>
  );
}

type ChatMessage = { role: "user" | "ai"; text: string; lit?: Lamp[]; flashing?: boolean };

const tutorReplies: { match: RegExp; reply: Omit<ChatMessage, "role"> }[] = [
  { match: /quiz|practice|question/i, reply: { text: "Here's one for you: a traffic light is flashing amber. What should you do? Reply with your answer and I'll check it.", lit: ["amber"], flashing: true } },
  { match: /red|amber|yellow|signal|light/i, reply: { text: "When red and amber show together, green is about to follow. Get ready to move — release the handbrake, check your mirrors — but don't go until the light turns green and the way is clear.", lit: ["red", "amber"] } },
  { match: /right of way|intersection|yield/i, reply: { text: "At an intersection without signals, slow down and look in all directions. Yield to vehicles already inside the intersection and to pedestrians crossing. Never assume the other driver will stop." } },
  { match: /overtak|pass/i, reply: { text: "Only overtake when the road ahead is clear and the markings allow it. Avoid overtaking on solid lines, on curves or hills, near intersections, and at pedestrian crossings." } },
];
const fallbackReply = { text: "Good question. Start by slowing down and reading the situation: signals first, then signs and markings, then other road users. Want me to turn this into a practice question?" };

const tutorPrompts = [
  { label: "What does a flashing amber light mean?", tone: "red", icon: "signal" as IconName },
  { label: "Who has the right of way at an intersection?", tone: "yellow", icon: "arrow" as IconName },
  { label: "When is it safe to overtake?", tone: "blue", icon: "marking" as IconName },
  { label: "What should I do at a pedestrian crossing?", tone: "sky", icon: "rules" as IconName },
  { label: "What does a solid yellow road line mean?", tone: "red", icon: "marking" as IconName },
  { label: "When must I stop at a red traffic light?", tone: "yellow", icon: "signal" as IconName },
  { label: "What should I do when driving in heavy rain?", tone: "blue", icon: "rules" as IconName },
  { label: "How can I check if a lane change is safe?", tone: "sky", icon: "arrow" as IconName },
];

function selectTutorPrompts(suggestions?: ApiSuggestions | null) {
  const personalized = suggestions?.personalizedPrompts ?? [];
  const general = (suggestions?.general ?? []).map((item) => item.question);
  const options = [...tutorPrompts];
  [...personalized, ...general].forEach((label, index) => {
    if (!options.some((option) => option.label === label)) {
      options.push({
        label,
        tone: ["red", "yellow", "blue", "sky"][index % 4],
        icon: (["signal", "arrow", "marking", "exam"] as IconName[])[index % 4],
      });
    }
  });
  for (let index = options.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[randomIndex]] = [options[randomIndex], options[index]];
  }
  return options.slice(0, 4);
}

function AskAI({ name, token, suggestions, initialPrompt }: { name: string; token: string | null; suggestions?: ApiSuggestions | null; initialPrompt?: string }) {
  const [prompts] = useState(() => selectTutorPrompts(suggestions));
  const aiContext = suggestions?.personalized ? "Personalised from your results" : "Suggested starter questions";
  const [messages, setMessages] = useState<ChatMessage[]>(initialPrompt ? [{ role: "user" as const, text: initialPrompt }] : []);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [aiWarning, setAiWarning] = useState("");
  const started = useRef(false);
  useEffect(() => {
    let active = true;
    let fallbackTimer: number | undefined;
    if (initialPrompt && !started.current && messages.length === 1) {
      started.current = true;
      (async () => {
        const text = initialPrompt;
        setTyping(true);
        if (token) {
          try {
            const response = await askLocalAi(token, [{ role: "user" as const, content: text }]);
            if (!active) return;
            setAiWarning(response.warning ?? "");
            setMessages((current) => [...current, { role: "ai", text: response.text }]);
            setTyping(false);
            return;
          } catch (error) {
            console.error("Local AI request failed", error);
            if (!active) return;
            setMessages((current) => [...current, { role: "ai", text: "I couldn't connect to the local AI just now. Please try sending your question again." }]);
            setTyping(false);
            return;
          }
        }
        if (!active) return;
        const reply = tutorReplies.find((item) => item.match.test(text))?.reply ?? fallbackReply;
        fallbackTimer = window.setTimeout(() => {
          setMessages((current) => [...current, { role: "ai", ...reply }]);
          setTyping(false);
        }, 750);
      })();
    }
    return () => {
      active = false;
      started.current = false;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };
  }, [initialPrompt, token, messages.length]);
  const send = async (message: string) => {
    const text = message.trim();
    if (!text || typing) return;
    const nextMessages = [...messages, { role: "user" as const, text }];
    setMessages(nextMessages);
    setDraft("");
    setTyping(true);
    setAiWarning("");
    if (token) {
      try {
        const response = await askLocalAi(token, nextMessages.map((item) => ({
          role: item.role === "ai" ? "assistant" : "user",
          content: item.text,
        })));
        setAiWarning(response.warning ?? "");
        setMessages((current) => [...current, { role: "ai", text: response.text }]);
        setTyping(false);
        return;
      } catch (error) {
        console.error("Local AI request failed", error);
        setMessages((current) => [...current, { role: "ai", text: "I couldn't connect to the local AI just now. Please try sending your question again." }]);
        setTyping(false);
        return;
      }
    }
    const reply = tutorReplies.find((item) => item.match.test(text))?.reply ?? fallbackReply;
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: "ai", ...reply }]);
      setTyping(false);
    }, 750);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };
  return (
    <main className="screen ai-screen">
      <header className="tutor-head">
        <span className="tutor-avatar"><Icon name="dai" size={22} /><i /></span>
        <div><h1>AI Tutor</h1><p>Local AI · Philippine traffic rules</p></div>
        <button className="icon-button round" onClick={() => { setMessages([]); setAiWarning(""); }} aria-label="New conversation"><Icon name="plus" size={18} /></button>
      </header>
      <div className="context-chip"><Icon name="signal" size={15} />{aiContext}</div>
      {aiWarning && <p className="ai-warning" role="status">{aiWarning}</p>}

      <div className="conversation">
        {messages.length === 0 && (
          <section className="dai-welcome">
            <img src={kamoteMascot} alt="Dai, the Kamote PH mascot" />
            <div>
              <span className="hero-kicker">Kumusta, {name}!</span>
              <h2>I'm Dai, your road buddy.</h2>
              <p>New driver or years behind the wheel, ask me about any traffic rule, sign, or road situation and I'll explain it simply.</p>
            </div>
          </section>
        )}
        <div className="bubble ai" hidden={messages.length === 0}>
          <p>Hi {name}! I'm your Kamote PH tutor. Ask me about any traffic rule, sign, or road situation and I'll explain it simply.</p>
        </div>
        {messages.length === 0 && (
          <div className="prompt-grid">
            {prompts.map((prompt) => (
              <button className={`prompt-tile ${prompt.tone}`} key={prompt.label} onClick={() => send(prompt.label)}>
                <span className="stat-icon"><Icon name={prompt.icon} size={16} /></span>
                <span>{prompt.label}</span>
              </button>
            ))}
          </div>
        )}
        {messages.map((message, index) => (
          <div className={`bubble ${message.role}`} key={index}>
            <p>{message.text}</p>
            {message.lit && (
              <div className="bubble-visual">
                <TrafficLight lit={message.lit} flashing={message.flashing} size="sm" />
                <span><strong>Key point</strong><small>{message.flashing ? "Flashing amber = proceed with caution" : "Red + amber = get ready, wait for green"}</small></span>
              </div>
            )}
          </div>
        ))}
        {typing && <div className="bubble ai typing" aria-label="AI Tutor is typing"><span /><span /><span /></div>}
      </div>

      <div className="composer-wrap">
        <form className="composer" onSubmit={submit}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about a rule or road sign..." aria-label="Message AI Tutor" />
          <button type="submit" aria-label="Send message" disabled={!draft.trim() || typing}><Icon name="send" size={18} /></button>
        </form>
        <p className="ai-note">AI can make mistakes. Check official LTO materials when in doubt.</p>
      </div>
    </main>
  );
}

function Profile({ track, user, navigate, goals, achievements, suggestions }: { track: Track; user: User; navigate: (screen: Screen) => void; goals: ApiGoals | null; achievements: ApiAchievement[]; suggestions: ApiSuggestions | null }) {
  const copy = trackCopy[track];
  const stats = goals?.stats;
  const readiness = Math.min(100, (stats?.quizzesPassed ?? 0) * 20);
  const weak = suggestions?.weakCategories ?? [];
  return (
    <main className="screen">
      <section className="gov-band">
      <header className="home-top">
        <div className="user-chip">
          <span className="avatar">{initials(user.name)}</span>
          <span className="user-copy"><strong>{user.name}</strong><small>{copy.profileRole}</small></span>
        </div>
        <button className="icon-button bell" aria-label="Settings" onClick={() => navigate("settings")}><Icon name="settings" size={19} /></button>
      </header>
      <h1 className="progress-title">Your progress</h1>
      <p className="band-sub">{copy.bandSub}</p>
      </section>

      <GoalChart selectable weekly={goals?.weekly} dailyGoal={goals?.dailyGoal ?? 10} />
      <section className="week-card">
        <span className="week-title">Where to focus</span>
        {weak.length === 0 ? (
          <p className="week-sub">Take a practice quiz and Dai will point out the topics to review.</p>
        ) : (
          <div className="dist-table">
            <div className="dist-head"><span>Topic</span><span>Missed</span><span>Answered</span></div>
            {weak.map((row) => (
              <div className="dist-row" key={row.lessonTitle}>
                <span><i className="red" />{row.lessonTitle}</span>
                <span>{row.wrong}</span>
                <span>{row.answered}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="section-block">
        <div className="section-heading row"><h2>Achievements</h2><span className="muted">{(achievements ?? []).filter((item) => item.earned).length}/{achievements?.length ?? 0}</span></div>
        <div className="set-list">
          {achievements.map((item) => (
            <div className="set-row" key={item.code} style={{ opacity: item.earned ? 1 : 0.55 }}>
              <span className="set-icon"><Icon name={item.earned ? "check" : "lock"} size={20} /></span>
              <span className="set-content">
                <span className="set-title-line"><strong>{item.title}</strong>{item.earned && <small>Earned</small>}</span>
                <span className="set-description">{item.description}</span>
              </span>
            </div>
          ))}
          {achievements.length === 0 && <div className="empty-state"><strong>No achievements yet</strong><p>Complete lessons and quizzes to earn badges.</p></div>}
        </div>
      </section>
      <section className="week-card readiness">
        <div className="donut" style={{ "--score": `${readiness}%` } as CSSProperties}><span><strong>{readiness}%</strong><small>{copy.ringLabel}</small></span></div>
        <div className="readiness-copy">
          <span className="week-title">{copy.ringTitle}</span>
          <ul>
            <li><i className="blue" />Cards<b>{stats?.cardsReviewed ?? 0}</b></li>
            <li><i className="yellow" />Quizzes<b>{stats?.quizzesTaken ?? 0}</b></li>
            <li><i className="red" />Lessons<b>{stats?.lessonsCompleted ?? 0}</b></li>
          </ul>
        </div>
      </section>
    </main>
  );
}


function RoadBackdrop() {
  return (
    <div className="road-backdrop" aria-hidden="true">
      <svg className="road-curve" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
        <path className="road-surface" d="M-40 120C120 140 330 210 330 360S60 520 80 680s260 160 360 240" />
        <path className="road-edge" d="M-40 120C120 140 330 210 330 360S60 520 80 680s260 160 360 240" />
        <path className="road-dash" d="M-40 120C120 140 330 210 330 360S60 520 80 680s260 160 360 240" />
      </svg>
      <svg className="road-signs" width="100%" height="100%">
        <defs>
          <pattern id="road-sign-pattern" width="440" height="440" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
            {/* Stop */}
            <g className="s-red" transform="translate(40 40)">
              <path d="M17 0h30l17 17v30L47 64H17L0 47V17Z" />
              <path d="M21 8h22l13 13v22L43 56H21L8 43V21Z" />
            </g>
            {/* Yield */}
            <g className="s-red" transform="translate(250 30) rotate(10)">
              <path d="M0 0h72L36 62Z" />
              <path d="M14 8h44L36 46Z" />
            </g>
            {/* Warning: curve ahead */}
            <g className="s-yellow" transform="translate(150 150)">
              <path d="M38 0 76 38 38 76 0 38Z" />
              <path d="M30 52c0-10 16-10 16-20s-8-12-8-12" />
              <path d="m33 18 5-2 2 5" />
            </g>
            {/* Speed limit */}
            <g className="s-red" transform="translate(330 180)">
              <circle cx="34" cy="34" r="34" />
              <circle cx="34" cy="34" r="25" />
              <text x="34" y="41" textAnchor="middle">60</text>
            </g>
            {/* Mandatory: turn right */}
            <g className="s-blue" transform="translate(30 250)">
              <circle cx="32" cy="32" r="32" />
              <path d="M22 46V30c0-6 4-9 10-9h10" />
              <path d="m36 14 8 7-8 7" />
            </g>
            {/* No entry */}
            <g className="s-red" transform="translate(220 320) rotate(-6)">
              <circle cx="30" cy="30" r="30" />
              <path d="M14 30h32" />
            </g>
            {/* Pedestrian crossing */}
            <g className="s-blue" transform="translate(370 360) rotate(6)">
              <rect width="64" height="64" rx="10" />
              <path d="m32 8 20 34H12Z" />
              <circle cx="32" cy="23" r="3" />
              <path d="M32 27v8m-4 0 4-4 4 4" />
            </g>
            {/* Traffic signal warning */}
            <g className="s-yellow" transform="translate(120 360) rotate(-4)">
              <path d="M36 0 72 36 36 72 0 36Z" />
              <rect x="30" y="18" width="12" height="36" rx="4" />
              <circle cx="36" cy="26" r="2.5" />
              <circle cx="36" cy="36" r="2.5" />
              <circle cx="36" cy="46" r="2.5" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#road-sign-pattern)" />
      </svg>
    </div>
  );
}

function PolicyDoc({ kind, onBack }: { kind: "privacy" | "terms"; onBack: () => void }) {
  const isPrivacy = kind === "privacy";
  return (
    <main className="screen">
      <AppHeader title={isPrivacy ? "Privacy Policy" : "Terms of Use"} subtitle="Version 1.0" back={onBack} backLabel="Back" />
      <section className="section-block legal">
        {isPrivacy ? (
          <>
            <h2>What we collect</h2>
            <p>Your name, email address, and a securely hashed password. If you attach a driver's licence, we store the licence number, file name, and a small thumbnail preview.</p>
            <h2>How we use it</h2>
            <p>To run your account, save your study progress, quiz results, flashcards, achievements, and reminders, and to personalise the lessons and suggestions Dai shows you.</p>
            <h2>AI tutor</h2>
            <p>Questions you type to Dai are sent to a locally hosted AI model on this server to generate an answer. Do not share sensitive personal information in chat.</p>
            <h2>What we don't do</h2>
            <p>We do not sell your personal data or share it with advertisers.</p>
            <h2>Your rights</h2>
            <p>Under the Philippine Data Privacy Act of 2012 (RA 10173) you may access, correct, or request deletion of your personal data. Removing your driver's licence in Settings clears it from our records.</p>
            <h2>Retention &amp; contact</h2>
            <p>Study data is kept while your account is active. Data protection contact: [to be provided by the operator].</p>
          </>
        ) : (
          <>
            <h2>Using Kamote PH</h2>
            <p>Kamote PH is a study companion for Philippine road rules. It is not an official LTO service and does not issue, verify, or replace a driver's licence.</p>
            <h2>Your account</h2>
            <p>Keep your password private and provide accurate information. You are responsible for activity under your account.</p>
            <h2>Study content</h2>
            <p>Lessons, questions, and AI answers are for practice only and may contain mistakes. Always follow official LTO rules, signs, and the directions of traffic enforcers.</p>
            <h2>Acceptable use</h2>
            <p>Do not misuse the service, attempt to access other users' data, or upload unlawful content.</p>
            <h2>Changes</h2>
            <p>We may update these terms. Continued use after an update means you accept the new version.</p>
            <h2>Contact</h2>
            <p>Operator contact details: [to be provided by the operator].</p>
          </>
        )}
      </section>
    </main>
  );
}

const navItems: { screen: Screen; icon: IconName; label: string }[] = [
  { screen: "home", icon: "home", label: "Home" },
  { screen: "library", icon: "library", label: "Library" },
  { screen: "ai", icon: "dai", label: "Ask Dai" },
  { screen: "set", icon: "study", label: "Study" },
  { screen: "profile", icon: "user", label: "Progress" },
];

// ───────── Account, auth, and settings ─────────

type User = { id?: number; name: string; email: string; guest?: boolean; license?: License; track?: Track; licenseStatus?: LicenseStatus; licenseReviewNote?: string | null; consent?: { privacy: { version: string | null; acceptedAt: string | null }; terms: { version: string | null; acceptedAt: string | null } } };

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "Driver";
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "KP";

/** useState that survives reloads (localStorage). */
function usePersistent<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved === null ? initial : (JSON.parse(saved) as T);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function Field({
  label,
  icon,
  error,
  trailing,
  ...input
}: {
  label: string;
  icon: IconName;
  error?: string;
  trailing?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span className="field-label">{label}</span>
      <span className="field-box">
        <Icon name={icon} size={18} />
        <input {...input} aria-invalid={!!error} />
        {trailing}
      </span>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

// ───────── Driver's license upload ─────────

type License = { number: string; fileName: string; thumb: string | null };

/** LTO license number, e.g. N01-23-456789 */
const licensePattern = /^[A-Z]\d{2}-\d{2}-\d{6}$/;
const hasLicense = (license?: License | null) => !!license && (!!license.fileName || !!license.number);
const licenseStatusCopy: Record<LicenseStatus, { label: string; note: string }> = {
  none: { label: "Not uploaded", note: "Add your licence to switch to refresher lessons." },
  pending: { label: "Under review", note: "An administrator will confirm your licence before you're treated as a licensed driver. Any generated number is not an official licence." },
  verified: { label: "Verified", note: "Your licence is verified. Refresher lessons are active." },
  rejected: { label: "Needs attention", note: "Your upload was rejected. Upload a clearer photo or check the number, then resubmit." },
};

/** Downscale an image file to a small JPEG preview so it fits in local storage. */
async function makeThumb(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    const scale = Math.min(1, 480 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function LicenseUpload({ value, onChange }: { value: License | null; onChange: (license: License | null) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const number = value?.number ?? "";
  const numberError = number && !licensePattern.test(number) ? "Use the format A12-34-567890." : "";

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Upload a photo (JPG or PNG) or a PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("That file is over 10 MB. Try a smaller photo.");
      return;
    }
    setError("");
    setBusy(true);
    const thumb = await makeThumb(file);
    setBusy(false);
    onChange({ number, fileName: file.name, thumb });
  };

  const removeFile = () => onChange(number ? { number, fileName: "", thumb: null } : null);
  const setNumber = (raw: string) => {
    const next = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const fileName = value?.fileName ?? "";
    onChange(next || fileName ? { number: next, fileName, thumb: value?.thumb ?? null } : null);
  };

  return (
    <div className="license">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*,application/pdf"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {value?.fileName ? (
        <div className="license-preview">
          {value.thumb ? (
            <img src={value.thumb} alt="Your uploaded driver's license" />
          ) : (
            <span className="license-file"><Icon name="rules" size={22} /></span>
          )}
          <span className="license-meta">
            <strong>{value.fileName}</strong>
            <small><Icon name="check" size={13} />Saved on this device</small>
          </span>
          <span className="license-actions">
            <button type="button" className="link-button" onClick={() => inputRef.current?.click()}>Replace</button>
            <button type="button" className="link-button danger-link" onClick={removeFile}>Remove</button>
          </span>
        </div>
      ) : (
        <button
          type="button"
          className={`license-drop ${dragging ? "dragging" : ""}`}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files?.[0]); }}
        >
          <span className="license-drop-icon"><Icon name="upload" size={22} /></span>
          <strong>{busy ? "Processing photo…" : "Attach driver's license"}</strong>
          <small>Tap to upload a photo or PDF · up to 10 MB</small>
        </button>
      )}
      {error && <span className="field-error" role="alert">{error}</span>}
      <Field
        label="License number (optional)"
        icon="cards"
        placeholder="A12-34-567890"
        autoComplete="off"
        maxLength={13}
        value={number}
        onChange={(event) => setNumber(event.target.value)}
        error={numberError}
      />
    </div>
  );
}

function AuthScreen({ onAuth, track, onTrack }: { onAuth: (user: User, meta?: { signup: boolean; agree: boolean }) => void; track: Track; onTrack: (track: Track) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [policyView, setPolicyView] = useState<"privacy" | "terms" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [license, setLicense] = useState<License | null>(null);
  const signup = mode === "signup";
  const strength = passwordStrength(password);

  const resetFields = () => {
    setName("");
    setEmail("");
    setPassword("");
    setAgree(false);
    setLicense(null);
    setErrors({});
    setNotice("");
  };
  const switchMode = (next: "signin" | "signup") => {
    if (next !== mode) resetFields();
    setMode(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (signup && name.trim().length < 2) next.name = "Enter your full name.";
    if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address.";
    if (signup ? password.length < 8 : password.length === 0) next.password = signup ? "Use at least 8 characters." : "Enter your password.";
    if (signup && !agree) next.agree = "Please agree to the terms to continue.";
    if (signup && track === "licensed" && license?.number && !licensePattern.test(license.number)) next.license = "Check your license number.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setNotice("");
    try {
      const response = signup
        ? await register(name.trim(), email.trim(), password, track)
        : await login(email.trim(), password);
      const withLicense = signup && track === "licensed" && hasLicense(license) ? { license: license! } : {};
      window.localStorage.setItem("kamote-token", response.token);
      onAuth({ ...response.user, ...withLicense }, { signup, agree });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to connect to the server.");
      setLoading(false);
    }
  };

  if (policyView) {
    return (
      <div className="auth-screen">
        <RoadBackdrop />
        <PolicyDoc kind={policyView} onBack={() => setPolicyView(null)} />
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <RoadBackdrop />
      <main className="auth-wrap">
        <header className="auth-hero">
          <strong className="app-wordmark">Kamote <em>PH</em></strong>
          <h1>{signup ? "Create your account" : "Welcome back"}</h1>
          <p>{signup ? "Learn the rules of the road, for your first license or a quick refresher." : "Sign in to pick up where you left off."}</p>
        </header>

        <div className="auth-stage" aria-hidden="true">
          <img className="auth-mascot" src={kamoteMascot} alt="" />
          <p className="dai-bubble">{signup ? "Tara, sali ka na!" : "Uy, welcome back!"}</p>
        </div>

        <section className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Account">
            <button role="tab" aria-selected={!signup} className={!signup ? "active" : ""} onClick={() => switchMode("signin")}>Sign in</button>
            <button role="tab" aria-selected={signup} className={signup ? "active" : ""} onClick={() => switchMode("signup")}>Sign up</button>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            {signup && (
              <Field label="Full name" icon="user" autoComplete="name" placeholder="Juan Dela Cruz" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            )}
            <Field label="Email" icon="mail" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <Field
              label="Password"
              icon="lock"
              type={showPassword ? "text" : "password"}
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder={signup ? "At least 8 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              trailing={
                <button type="button" className="field-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                </button>
              }
            />

            {signup && password && (
              <div className={`strength s${strength}`} aria-live="polite">
                <span /><span /><span />
                <small>{["Too weak", "Weak", "Good", "Strong"][strength]}</small>
              </div>
            )}

            {signup ? (
              <>
                <div className="auth-track">
                  <span className="field-label">I'm a</span>
                  <TrackSwitch track={track} onChange={onTrack} />
                </div>
                {track === "licensed" && (
                  <fieldset className="auth-license">
                    <legend><Icon name="cards" size={16} />Attach driver's license <span>Optional</span></legend>
                    <p>Licensed na? Attach a photo of your license and Dai will focus on refresher lessons.</p>
                    <LicenseUpload value={license} onChange={setLicense} />
                  </fieldset>
                )}
                <label className={`check ${errors.agree ? "has-error" : ""}`}>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span className="check-box"><Icon name="check" size={13} /></span>
                  <span>I agree to the <a href="#terms" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setPolicyView("terms"); }}>Terms of Use</a> and <a href="#privacy" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setPolicyView("privacy"); }}>Privacy Policy</a>.</span>
                </label>
                {errors.agree && <span className="field-error">{errors.agree}</span>}
              </>
            ) : (
              <div className="auth-row">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setNotice("Password reset is not available yet. Please contact the RoadWise PH team.")}
                >
                  Forgot password?
                </button>
              </div>
            )}
            {notice && <p className="auth-notice" role="status">{notice}</p>}

            <button className="button primary auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" aria-label="Please wait" /> : signup ? "Create account" : "Sign in"}
            </button>
          </form>


          <p className="auth-switch">
            {signup ? "Already have an account?" : "New to Kamote PH?"}{" "}
            <button className="link-button" onClick={() => switchMode(signup ? "signin" : "signup")}>{signup ? "Sign in" : "Create an account"}</button>
          </p>
        </section>
        <p className="auth-foot">A study companion. Always follow official LTO rules and materials.</p>
      </main>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

function SettingsRow({ icon, tone = "blue", label, hint, children, onClick }: { icon: IconName; tone?: string; label: string; hint?: string; children?: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <span className={`settings-icon ${tone}`}><Icon name={icon} size={18} /></span>
      <span className="settings-copy"><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
      {children ?? (onClick && <Icon name="chevron" size={18} />)}
    </>
  );
  return onClick ? <button className="settings-row" onClick={onClick}>{body}</button> : <div className="settings-row">{body}</div>;
}

const goalOptions = [5, 10, 15, 20];

function Settings({
  navigate,
  user,
  onUpdateUser,
  track,
  dailyGoal,
  onDailyGoal,
  onSignOut,
  notificationsOn,
  onNotifications,
  onReminderSettings,
  onLicenseChange,
}: {
  navigate: (screen: Screen) => void;
  user: User;
  onUpdateUser: (user: User) => void;
  track: Track;
  dailyGoal: number;
  onDailyGoal: (goal: number) => void;
  onSignOut: () => void;
  notificationsOn: boolean;
  onNotifications: (on: boolean) => void;
  onReminderSettings: (reminders: boolean, reminderTime: string) => void;
  onLicenseChange: (license: License | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(user.name);
  const [reminders, setReminders] = usePersistent("kamote-reminders", true);
  const [reminderTime, setReminderTime] = usePersistent("kamote-reminder-time", "19:00");
  const [sounds, setSounds] = usePersistent("kamote-sounds", false);
  const [confirmOut, setConfirmOut] = useState(false);

  const saveName = () => {
    if (draftName.trim().length < 2) return;
    onUpdateUser({ ...user, name: draftName.trim() });
    setEditing(false);
  };

  return (
    <main className="screen settings-screen">
      <AppHeader title="Settings" subtitle="Account, learning, and app preferences." back={() => navigate("profile")} backLabel="Progress" />

      <section className="account-card">
        <span className="avatar lg">{initials(user.name)}</span>
        {editing ? (
          <form className="account-edit" onSubmit={(e) => { e.preventDefault(); saveName(); }}>
            <input value={draftName} onChange={(e) => setDraftName(e.target.value)} aria-label="Full name" autoFocus />
            <div>
              <button type="button" className="link-button muted-link" onClick={() => { setDraftName(user.name); setEditing(false); }}>Cancel</button>
              <button type="submit" className="link-button" disabled={draftName.trim().length < 2}>Save</button>
            </div>
          </form>
        ) : (
          <>
            <span className="account-copy">
              <strong>{user.name}</strong>
              <small>{user.guest ? "Guest account · progress stays on this device" : user.email}</small>
            </span>
            {!user.guest && (
              <button className="icon-button round" onClick={() => setEditing(true)} aria-label="Edit name"><Icon name="edit" size={17} /></button>
            )}
          </>
        )}
      </section>
      {user.guest && (
        <button className="guest-upsell" onClick={onSignOut}>
          <Icon name="shield" size={18} />
          <span><strong>Create a free account</strong><small>Keep your progress safe across devices.</small></span>
          <Icon name="chevron" size={18} />
        </button>
      )}

      <h2 className="settings-title">Driver's license</h2>
      <section className="settings-group license-group">
        <p className="license-intro">
          {hasLicense(user.license) ? "Your license is on file. Dai uses it to suggest refresher lessons." : "Already have a license? Add it to get refresher lessons instead of exam prep."}
        </p>
        {user.licenseStatus && user.licenseStatus !== "none" && (
          <p className="license-note"><Icon name={user.licenseStatus === "verified" ? "check" : user.licenseStatus === "rejected" ? "close" : "clock"} size={14} />{licenseStatusCopy[user.licenseStatus].label} — {licenseStatusCopy[user.licenseStatus].note}</p>
        )}
        <LicenseUpload
          value={user.license ?? null}
          onChange={(license) => {
            onUpdateUser({ ...user, license: license ?? undefined });
            onLicenseChange(license);
          }}
        />
        <p className="license-note"><Icon name="lock" size={14} />Uploads are saved on our servers for review; add "{licenseStatusCopy[user.licenseStatus ?? "none"].label}".</p>
      </section>

      <h2 className="settings-title">Learning</h2>
      <section className="settings-group">
        <div className="settings-row stacked">
          <span className="settings-icon yellow"><Icon name="user" size={18} /></span>
          <span className="settings-copy"><strong>Driver status</strong><small>Selected during sign up.</small></span>
          <strong className="track-status">{trackCopy[track].profileRole}</strong>
        </div>
        <div className="settings-row stacked">
          <span className="settings-icon blue"><Icon name="cards" size={18} /></span>
          <span className="settings-copy"><strong>Daily goal</strong><small>Cards to study each day.</small></span>
          <div className="goal-options" role="radiogroup" aria-label="Daily goal">
            {goalOptions.map((goal) => (
              <button key={goal} role="radio" aria-checked={dailyGoal === goal} className={dailyGoal === goal ? "active" : ""} onClick={() => onDailyGoal(goal)}>{goal}</button>
            ))}
          </div>
        </div>
        <SettingsRow icon="clock" tone="red" label="Study reminders" hint={reminders ? `Every day at ${reminderTime}` : "Off"}>
          <Toggle
            on={reminders}
            onChange={(enabled) => {
              setReminders(enabled);
              onReminderSettings(enabled, reminderTime);
            }}
            label="Study reminders"
          />
        </SettingsRow>
        {reminders && (
          <label className="settings-row sub">
            <span className="settings-copy"><strong>Reminder time</strong></span>
            <input
              className="time-input"
              type="time"
              value={reminderTime}
              onChange={(e) => {
                setReminderTime(e.target.value);
                onReminderSettings(reminders, e.target.value);
              }}
            />
          </label>
        )}
      </section>

      <h2 className="settings-title">App</h2>
      <section className="settings-group">
        <SettingsRow icon="bell" label="Notifications" hint="Streaks, new lessons, and tips">
          <Toggle on={notificationsOn} onChange={onNotifications} label="Notifications" />
        </SettingsRow>
        <SettingsRow icon="volume" tone="yellow" label="Sound effects" hint="Play sounds on correct answers">
          <Toggle on={sounds} onChange={setSounds} label="Sound effects" />
        </SettingsRow>
      </section>

      <h2 className="settings-title">Support</h2>
      <section className="settings-group">
        <SettingsRow icon="help" label="Help from Dai" hint="Ask the tutor anything" onClick={() => navigate("ai")} />
        <SettingsRow icon="shield" tone="yellow" label="Privacy policy" onClick={() => navigate("privacy")} />
        <SettingsRow icon="rules" tone="red" label="Terms of use" onClick={() => navigate("terms")} />
        <SettingsRow icon="info" label="About Kamote PH" hint="Version 1.0.0">
          <span className="settings-value">1.0.0</span>
        </SettingsRow>
      </section>

      {confirmOut ? (
        <section className="signout-confirm" role="alertdialog" aria-label="Sign out">
          <strong>{user.guest ? "Leave guest mode?" : "Sign out of Kamote PH?"}</strong>
          <p>{user.guest ? "Your guest progress stays on this device." : "You can sign back in anytime."}</p>
          <div>
            <button className="button secondary" onClick={() => setConfirmOut(false)}>Cancel</button>
            <button className="button danger" onClick={onSignOut}>Sign out</button>
          </div>
        </section>
      ) : (
        <button className="signout-button" onClick={() => setConfirmOut(true)}><Icon name="logout" size={18} />{user.guest ? "Exit guest mode" : "Sign out"}</button>
      )}
    </main>
  );
}

// ───────── Notifications ─────────

type NoticeKind = "streak" | "reminder" | "lesson" | "quiz" | "tip" | "system";
type Notice = { id: string; kind: NoticeKind; title: string; body: string; time: number; read: boolean; target?: Screen };

const noticeMeta: Record<NoticeKind, { icon: IconName; tone: string; label: string }> = {
  streak: { icon: "flame", tone: "yellow", label: "Streak" },
  reminder: { icon: "clock", tone: "blue", label: "Reminder" },
  lesson: { icon: "cards", tone: "blue", label: "New lesson" },
  quiz: { icon: "exam", tone: "red", label: "Quiz" },
  tip: { icon: "dai", tone: "yellow", label: "Tip from Dai" },
  system: { icon: "shield", tone: "blue", label: "Account" },
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function seedNotices(): Notice[] {
  const now = Date.now();
  return [
    { id: "n1", kind: "streak", title: "6-day streak! Keep it going", body: "Study one more card today to reach 7 days in a row.", time: now - 12 * MIN, read: false, target: "flashcards" },
    { id: "n2", kind: "tip", title: "Flashing red means stop", body: "Treat a flashing red light like a stop sign: stop fully, then go when it's clear.", time: now - 2 * HOUR, read: false, target: "ai" },
    { id: "n3", kind: "lesson", title: "New: Refresher for Licensed Drivers", body: "36 cards on rules and signs worth reviewing since you got your license.", time: now - 5 * HOUR, read: false, target: "library" },
    { id: "n4", kind: "reminder", title: "Time for today's review", body: "You're 2 cards away from your daily goal.", time: now - 1 * DAY - 3 * HOUR, read: true, target: "set" },
    { id: "n5", kind: "quiz", title: "Practice quiz: 2 of 3 correct", body: "Review the question you missed on steady red signals.", time: now - 3 * DAY, read: true, target: "quiz" },
    { id: "n6", kind: "system", title: "Welcome to Kamote PH", body: "Set your daily goal and study reminders in Settings.", time: now - 8 * DAY, read: true, target: "settings" },
  ];
}

function timeAgo(time: number) {
  const diff = Date.now() - time;
  if (diff < MIN) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(time).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function noticeGroup(time: number) {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  if (time >= startOfToday) return "Today";
  if (time >= startOfToday - 6 * DAY) return "This week";
  return "Earlier";
}

function devicePermission(): NotificationPermission | "unsupported" {
  return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
}

function Notifications({
  items,
  onChange,
  navigate,
  enabled,
  onEnable,
  onRead,
  onDelete,
  onMarkAllRead,
}: {
  items: Notice[];
  onChange: (items: Notice[]) => void;
  navigate: (screen: Screen) => void;
  enabled: boolean;
  onEnable: () => void;
  onRead?: (id: string, read: boolean) => void;
  onDelete?: (id: string) => void;
  onMarkAllRead?: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [permission, setPermission] = useState(devicePermission);
  const [confirmClear, setConfirmClear] = useState(false);
  const unread = items.filter((item) => !item.read).length;
  const visible = [...items].sort((a, b) => b.time - a.time).filter((item) => filter === "all" || !item.read);
  const groups = ["Today", "This week", "Earlier"]
    .map((label) => ({ label, items: visible.filter((item) => noticeGroup(item.time) === label) }))
    .filter((group) => group.items.length);

  const open = (notice: Notice) => {
    onChange(items.map((item) => (item.id === notice.id ? { ...item, read: true } : item)));
    onRead?.(notice.id, true);
    if (notice.target) navigate(notice.target);
  };
  const dismiss = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
    onDelete?.(id);
  };
  const toggleRead = (id: string) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    onChange(items.map((item) => (item.id === id ? { ...item, read: !item.read } : item)));
    onRead?.(id, !current.read);
  };
  const markAll = () => {
    onChange(items.map((item) => ({ ...item, read: true })));
    onMarkAllRead?.();
  };

  const allowDevice = async () => {
    if (permission === "unsupported") return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") new Notification("Kamote PH", { body: "Reminders are on. See you on the road!" });
    } catch {
      setPermission(devicePermission());
    }
  };

  return (
    <main className="screen notifications-screen">
      <AppHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're all caught up"}
        back={() => navigate("home")}
        backLabel="Home"
        action={
          <button className="icon-button round" onClick={markAll} disabled={!unread} aria-label="Mark all as read">
            <Icon name="check" size={18} />
          </button>
        }
      />

      {!enabled && (
        <section className="notice-banner off">
          <span className="settings-icon yellow"><Icon name="bell" size={18} /></span>
          <span><strong>Notifications are off</strong><small>You won't get streak alerts or study reminders.</small></span>
          <button className="button primary small" onClick={onEnable}>Turn on</button>
        </section>
      )}
      {enabled && permission === "default" && (
        <section className="notice-banner">
          <span className="settings-icon blue"><Icon name="bell" size={18} /></span>
          <span><strong>Get reminders on this device</strong><small>Allow alerts so Dai can nudge you to study.</small></span>
          <button className="button primary small" onClick={allowDevice}>Allow</button>
        </section>
      )}
      {enabled && permission === "denied" && (
        <p className="notice-hint"><Icon name="info" size={14} />Device alerts are blocked. You can turn them on in your browser settings.</p>
      )}

      <div className="notice-filters" role="tablist" aria-label="Filter notifications">
        <button role="tab" aria-selected={filter === "all"} className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
        <button role="tab" aria-selected={filter === "unread"} className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>
          Unread{unread > 0 && <b>{unread}</b>}
        </button>
      </div>

      {groups.length === 0 ? (
        <section className="notice-empty">
          <img src={kamoteMascot} alt="" />
          <strong>{filter === "unread" && items.length ? "No unread notifications" : "You're all caught up"}</strong>
          <p>{filter === "unread" && items.length ? "Everything's been read. Nice work!" : "We'll let you know about streaks, new lessons, and tips from Dai."}</p>
          {filter === "unread" && items.length > 0 && <button className="button secondary small" onClick={() => setFilter("all")}>Show all</button>}
        </section>
      ) : (
        groups.map((group) => (
          <section className="notice-group" key={group.label}>
            <h2 className="settings-title">{group.label}</h2>
            <ul className="notice-list">
              {group.items.map((notice) => {
                const meta = noticeMeta[notice.kind];
                return (
                  <li className={`notice ${notice.read ? "" : "unread"}`} key={notice.id}>
                    <button className="notice-main" onClick={() => open(notice)}>
                      <span className={`settings-icon ${meta.tone}`}><Icon name={meta.icon} size={18} /></span>
                      <span className="notice-copy">
                        <span className="notice-top"><small>{meta.label}</small><time dateTime={new Date(notice.time).toISOString()}>{timeAgo(notice.time)}</time></span>
                        <strong>{notice.title}</strong>
                        <span className="notice-body">{notice.body}</span>
                      </span>
                      {!notice.read && <i className="notice-dot" aria-label="Unread" />}
                    </button>
                    <span className="notice-tools">
                      <button onClick={() => toggleRead(notice.id)}>{notice.read ? "Mark unread" : "Mark read"}</button>
                      <button onClick={() => dismiss(notice.id)} aria-label={`Dismiss ${notice.title}`}><Icon name="close" size={14} /></button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {items.length > 0 && (
        confirmClear ? (
          <div className="notice-clear confirm">
            <span>Clear all notifications?</span>
            <button className="link-button muted-link" onClick={() => setConfirmClear(false)}>Cancel</button>
            <button className="link-button danger-link" onClick={() => { onChange([]); setConfirmClear(false); }}>Clear all</button>
          </div>
        ) : (
          <div className="notice-clear"><button className="link-button muted-link" onClick={() => setConfirmClear(true)}>Clear all notifications</button></div>
        )
      )}
    </main>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <RoadBackdrop />
      <div className="loading-body">
        <img className="loading-mascot" src={kamoteMascot} alt="" />
        <strong className="app-wordmark">Kamote <em>PH</em></strong>
        <div className="loading-signal" aria-hidden="true"><span /><span /><span /></div>
        <p>{message}</p>
      </div>
      <p className="loading-foot">Learn the rules. Drive with confidence.</p>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [screenFocus, setScreenFocus] = useState<string | undefined>();
  const [policyFrom, setPolicyFrom] = useState<Screen>("home");
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null);
  const [quizRun, setQuizRun] = useState(0);
  const [authKey, setAuthKey] = useState(0);
  const [aiSeed, setAiSeed] = useState<string | null>(null);
  const [track, setTrack] = usePersistent<Track>("kamote-track", "new");
  const [user, setUser] = usePersistent<User | null>("kamote-user", null);
  const [dailyGoal, setDailyGoal] = usePersistent("kamote-daily-goal", 10);
  const [notificationsOn, setNotificationsOn] = usePersistent("kamote-notifications", true);
  const [noticeList, setNotices] = usePersistent<Notice[]>("kamote-notices", []);
  const [seeded, setSeeded] = usePersistent("kamote-notices-seeded", false);
  const [goals, setGoals] = useState<ApiGoals | null>(null);
  const [achievements, setAchievements] = useState<ApiAchievement[]>([]);
  const [suggestions, setSuggestions] = useState<ApiSuggestions | null>(null);
  const [consent, setConsent] = useState<ApiConsent | null>(null);
  const token = window.localStorage.getItem("kamote-token");
  useEffect(() => {
    if (!token || user) return;
    getCurrentUser(token)
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        setTrack(currentUser.track);
        setDailyGoal(currentUser.dailyGoal);
        setNotificationsOn(currentUser.notificationsOn);
      })
      .catch(() => {
        window.localStorage.removeItem("kamote-token");
      });
  }, [token, user, setDailyGoal, setNotificationsOn, setTrack, setUser]);
  useEffect(() => {
    if (!token || !user) return;
    Promise.all([getGoals(token), getAchievements(token), getSuggestions(token), getConsent(token)])
      .then(([goalsResult, achievementsResult, suggestionsResult, consentResult]) => {
        setGoals(goalsResult);
        setAchievements(achievementsResult.achievements);
        setSuggestions(suggestionsResult);
        setConsent(consentResult);
      })
      .catch((error) => console.error("Unable to load stats", error));
  }, [token, user]);
  const consentDue = !consent?.privacy?.acceptedAt || !consent?.terms?.acceptedAt || consent?.privacy?.version !== CONSENT_VERSION || consent?.terms?.version !== CONSENT_VERSION;
  const acceptConsent = (type: "privacy" | "terms") => {
    if (!token) return;
    saveConsent(token, type)
      .then(({ user: nextUser }) => {
        const privacy = nextUser.consent?.privacy;
        const terms = nextUser.consent?.terms;
        setConsent((current) => {
          if (current) return { ...current, privacy: privacy ?? current.privacy, terms: terms ?? current.terms };
          return { version: CONSENT_VERSION, privacy: privacy ?? { version: null, acceptedAt: null }, terms: terms ?? { version: null, acceptedAt: null } };
        });
        setUser((current) => (current ? { ...current, consent: nextUser.consent } : current));
      })
      .catch((error) => console.error("Unable to record consent", error));
  };
  useEffect(() => {
    if (!token || !user) return;
    getNotifications(token)
      .then(({ notifications }) => {
        if (notifications.length) {
          setNotices(notifications as Notice[]);
        }
      })
      .catch((error) => console.error("Unable to load notifications", error));
  }, [token, user, setNotices]);
  useEffect(() => {
    if (!seeded) {
      setNotices(seedNotices());
      setSeeded(true);
    }
  }, [seeded, setNotices, setSeeded]);
  const unread = notificationsOn ? noticeList.filter((item) => !item.read).length : 0;
  const [loading, setLoading] = useState<string | null>("Starting your engine…");
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setLoading(null), 1400);
    return () => window.clearTimeout(timer);
  }, [loading]);
  const activeNav = useMemo(() => {
    if (["library"].includes(screen)) return "library";
    if (["set", "flashcards", "quiz", "results"].includes(screen)) return "set";
    if (screen === "settings") return "profile";
    if (screen === "notifications") return "home";
    return screen;
  }, [screen]);
  const navigate = (next: Screen, focus?: string) => {
    if (next === "quiz") setQuizRun((run) => run + 1);
    if (next === "privacy" || next === "terms") setPolicyFrom(screen);
    setScreenFocus(focus);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const signOut = () => {
    window.localStorage.removeItem("kamote-token");
    setUser(null);
    setScreen("home");
    setQuizResult(null);
    setQuizRun((run) => run + 1);
    setAiSeed(null);
    setNotices([]);
    setConsent(null);
    setAuthKey((k) => k + 1);
    window.scrollTo({ top: 0 });
  };
  const syncSettings = (settings: Parameters<typeof updateSettings>[1], localUser: User) => {
    const activeToken = window.localStorage.getItem("kamote-token");
    if (!activeToken) return;
    updateSettings(activeToken, settings)
      .then(({ user: currentUser }) => {
        setUser({ ...localUser, ...currentUser });
        setTrack(currentUser.track);
        setDailyGoal(currentUser.dailyGoal);
        setNotificationsOn(currentUser.notificationsOn);
      })
      .catch((error) => console.error("Unable to sync account settings", error));
  };
  const syncNotificationRead = (id: string, read: boolean) => {
    if (!token || id.startsWith("n")) return;
    markNotificationRead(token, id, read).catch((error) => console.error("Unable to sync notification state", error));
  };
  const syncNotificationDelete = (id: string) => {
    if (!token || id.startsWith("n")) return;
    deleteNotification(token, id).catch((error) => console.error("Unable to delete notification", error));
  };
  const syncAllNotificationsRead = () => {
    if (!token) return;
    markAllNotificationsRead(token).catch((error) => console.error("Unable to mark notifications read", error));
  };
  if (loading) return <LoadingScreen message={loading} />;
  if (!user) {
    return (
      <AuthScreen
        key={authKey}
        track={track}
        onTrack={setTrack}
        onAuth={(next, meta) => {
          setUser(next);
          setScreen("home");
          setLoading(`Preparing your lessons, ${firstName(next.name)}…`);
          if (meta?.signup && meta.agree) {
            const activeToken = window.localStorage.getItem("kamote-token");
            if (activeToken) {
              acceptConsent("privacy");
              acceptConsent("terms");
            }
          }
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }
  const first = firstName(user.name);
  return (
    <div className="app-shell">
      <RoadBackdrop />
      <aside className="desktop-rail">
        <button className="brand" onClick={() => navigate("home")}><strong className="app-wordmark">Kamote <em>PH</em></strong></button>
        <nav>
          {navItems.map((item) => (
            <button className={activeNav === item.screen ? "active" : ""} onClick={() => navigate(item.screen)} key={item.label}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-goal"><span>DAILY GOAL</span><strong>{Math.min(8, dailyGoal)} of {dailyGoal} cards</strong><Progress value={(Math.min(8, dailyGoal) / dailyGoal) * 100} /></div>
      </aside>
      <div className={`mobile-app ${screen === "quiz" ? "focus-mode" : ""}`}>
        <div className="mobile-brand"><button onClick={() => navigate("home")}><strong className="app-wordmark">Kamote <em>PH</em></strong></button></div>
        {screen === "home" && <Home navigate={navigate} token={token} track={track} user={user} dailyGoal={dailyGoal} unread={unread} goals={goals} consentDue={consentDue} onAcceptConsent={acceptConsent} />}
        {screen === "library" && <Library navigate={navigate} token={token} />}
        {screen === "set" && <SetDetail navigate={navigate} focus={screenFocus} token={token} />}
        {screen === "flashcards" && <Flashcards navigate={navigate} token={token} focus={screenFocus} />}
        {screen === "quiz" && <QuizRunner key={quizRun} navigate={navigate} token={token} quizId={Number(screenFocus) || undefined} onResults={setQuizResult} />}
        {screen === "results" && quizResult && <QuizResults navigate={navigate} name={first} result={quizResult} onReview={() => navigate(quizResult.lessonId ? "set" : "home", quizResult.lessonId ? String(quizResult.lessonId) : undefined)} onAskAi={(prompt) => { setAiSeed(prompt); navigate("ai"); }} />}
        {screen === "privacy" && <PolicyDoc kind="privacy" onBack={() => navigate(policyFrom === "home" ? "home" : "settings")} />}
        {screen === "terms" && <PolicyDoc kind="terms" onBack={() => navigate(policyFrom === "home" ? "home" : "settings")} />}
        {screen === "ai" && <AskAI name={first} token={token} initialPrompt={aiSeed ?? undefined} />}
        {screen === "profile" && <Profile track={track} user={user} navigate={navigate} goals={goals} achievements={achievements} suggestions={suggestions} />}
        {screen === "settings" && (
          <Settings
            navigate={navigate}
            user={user}
            onUpdateUser={(nextUser) => { setUser(nextUser); syncSettings({ name: nextUser.name }, nextUser); }}
            track={track}
            dailyGoal={dailyGoal}
            onDailyGoal={(goal) => { setDailyGoal(goal); syncSettings({ dailyGoal: goal }, user); }}
            onSignOut={signOut}
            notificationsOn={notificationsOn}
            onNotifications={(enabled) => { setNotificationsOn(enabled); syncSettings({ notificationsOn: enabled }, user); }}
            onReminderSettings={(reminders, reminderTime) => {
              const activeToken = window.localStorage.getItem("kamote-token");
              if (!activeToken) return;
              updateReminderSettings(activeToken, reminders, reminderTime)
                .catch((error) => console.error("Unable to sync reminder settings", error));
            }}
            onLicenseChange={(license) => {
              const activeToken = window.localStorage.getItem("kamote-token");
              if (!activeToken) return;
              const request = license ? saveLicense(activeToken, license) : deleteLicense(activeToken);
              request
                .then(({ user: nextUser }) => {
                  setUser((current) => (current ? { ...current, ...nextUser } : current));
                  const privacy = nextUser.consent?.privacy;
                  const terms = nextUser.consent?.terms;
                  setConsent((current) => {
                    if (current) return { ...current, privacy: privacy ?? current.privacy, terms: terms ?? current.terms };
                    return { version: CONSENT_VERSION, privacy: privacy ?? { version: null, acceptedAt: null }, terms: terms ?? { version: null, acceptedAt: null } };
                  });
                })
                .catch((error) => console.error("Unable to sync license", error));
            }}
          />
        )}
        {screen === "notifications" && (
          <Notifications
            items={noticeList}
            onChange={setNotices}
            navigate={navigate}
            enabled={notificationsOn}
            onEnable={() => { setNotificationsOn(true); syncSettings({ notificationsOn: true }, user); }}
            onRead={syncNotificationRead}
            onDelete={syncNotificationDelete}
            onMarkAllRead={syncAllNotificationsRead}
          />
        )}
        <nav className="bottom-nav">
          {navItems.map((item) => (
            <button
              className={`${activeNav === item.screen ? "active" : ""} ${item.screen === "ai" ? "center" : ""}`}
              onClick={() => navigate(item.screen)}
              key={item.label}
              aria-current={activeNav === item.screen ? "page" : undefined}
            >
              <Icon name={item.icon} size={22} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
