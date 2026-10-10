import { CSSProperties, FormEvent, InputHTMLAttributes, ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
  saveQuizAttempt,
  saveStudyProgress,
  updateSettings,
  updateReminderSettings,
} from "./api";

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
  | "notifications";

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

const services: { icon: IconName; label: string; screen: Screen; tone: string }[] = [
  { icon: "cards", label: "Flashcards", screen: "flashcards", tone: "blue" },
  { icon: "exam", label: "Practice", screen: "quiz", tone: "red" },
  { icon: "sign", label: "Road signs", screen: "library", tone: "yellow" },
  { icon: "rules", label: "Road rules", screen: "library", tone: "blue" },
  { icon: "marking", label: "Markings", screen: "library", tone: "red" },
  { icon: "clock", label: "Refresher", screen: "library", tone: "yellow" },
  { icon: "dai", label: "Ask Dai", screen: "ai", tone: "blue" },
  { icon: "user", label: "Progress", screen: "profile", tone: "red" },
];

const studySets = [
  { title: "Traffic Signals and Lights", description: "Steady, flashing, and arrow signals", cards: 24, progress: 40, icon: "signal" as IconName, tag: "Recent" },
  { title: "Philippine Road Signs", description: "Regulatory, warning, and guide signs", cards: 48, progress: 62, icon: "sign" as IconName, tag: "" },
  { title: "Traffic Rules and Regulations", description: "Core rules every Filipino driver should know", cards: 32, progress: 35, icon: "rules" as IconName, tag: "Saved" },
  { title: "Pavement Markings", description: "Lines, lanes, and road surface markings", cards: 24, progress: 0, icon: "marking" as IconName, tag: "Saved" },
  { title: "Right-of-Way Rules", description: "Intersections, crossings, and yielding", cards: 20, progress: 15, icon: "arrow" as IconName, tag: "" },
  { title: "Refresher for Licensed Drivers", description: "Rules and signs worth reviewing since you got your license", cards: 36, progress: 0, icon: "clock" as IconName, tag: "Refresher" },
  { title: "LTO Written Exam Practice", description: "Practice questions based on key LTO topics", cards: 60, progress: 0, icon: "exam" as IconName, tag: "" },
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

const week = [
  { day: "M", date: "June 2, Monday", parts: [52, 38, 30] },
  { day: "T", date: "June 3, Tuesday", parts: [96, 74, 60] },
  { day: "W", date: "June 4, Wednesday", parts: [80, 62, 48] },
  { day: "T", date: "June 5, Thursday", parts: [88, 92, 83] },
  { day: "F", date: "June 6, Friday", parts: [44, 40, 26] },
  { day: "S", date: "June 7, Saturday", parts: [120, 92, 68] },
  { day: "S", date: "June 8, Sunday", parts: [84, 70, 51] },
];
const GOAL = 150;
const MAX = 300;
const dayTotal = (parts: number[]) => parts.reduce((sum, part) => sum + part, 0);

function GoalChart({ selectable = false, onOpen }: { selectable?: boolean; onOpen?: () => void }) {
  const [selected, setSelected] = useState<number | null>(selectable ? 3 : null);
  const average = Math.round(week.reduce((sum, item) => sum + dayTotal(item.parts), 0) / week.length);
  const current = selected === null ? null : week[selected];
  return (
    <section className="week-card">
      <div className="week-head">
        <div>
          <span className="week-title">Weekly goal</span>
          <strong className="week-number">{current ? dayTotal(current.parts) : average}</strong>
          <span className="week-sub">{current ? current.date : "Average questions per day"}</span>
        </div>
        <div className="week-head-side">
          {onOpen && <button className="text-button" onClick={onOpen}>Details</button>}
          <span className="goal-key"><i />Goal</span>
        </div>
      </div>
      <div className="chart">
        <div className="goal-rule" style={{ bottom: `${(GOAL / MAX) * 100}%` }} />
        {week.map((item, index) => {
          const total = dayTotal(item.parts);
          const met = total >= GOAL;
          const isSelected = selected === index;
          const tone = isSelected ? "stack" : selected !== null ? "dim" : met ? "met" : "missed";
          const bar = (
            <div className={`bar ${tone}`} style={{ height: `${(total / MAX) * 100}%` }}>
              {isSelected && item.parts.map((part, partIndex) => (
                <span key={partIndex} className={["red", "yellow", "blue"][partIndex]} style={{ height: `${(part / total) * 100}%` }} />
              ))}
            </div>
          );
          return selectable ? (
            <button className="bar-col" key={index} onClick={() => setSelected(isSelected ? null : index)} aria-label={`${item.date}: ${total} questions`} aria-pressed={isSelected}>{bar}</button>
          ) : (
            <div className="bar-col" key={index}>{bar}</div>
          );
        })}
      </div>
      <div className="chart-days">
        {week.map((item, index) => {
          const met = dayTotal(item.parts) >= GOAL;
          return (
            <div key={index} className={selected === index ? "selected" : ""}>
              <span>{item.day}</span>
              <i className={met ? "met" : "missed"}><Icon name={met ? "check" : "close"} size={10} /></i>
            </div>
          );
        })}
      </div>
      <div className="week-foot"><span>Goal achieved</span><strong>16/21 days</strong></div>
    </section>
  );
}

const statTiles = [
  { tone: "blue", icon: "check" as IconName, value: "48", unit: "cards", label: "Mastered this month" },
  { tone: "yellow", icon: "flame" as IconName, value: "6", unit: "days", label: "Study streak" },
  { tone: "red", icon: "sign" as IconName, value: "9", unit: "signs", label: "Need another review" },
  { tone: "sky", icon: "clock" as IconName, value: "87%", unit: "", label: "Scored on last quiz" },
];

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

function Home({ navigate, track, onTrack, user, dailyGoal, unread }: { navigate: (screen: Screen) => void; track: Track; onTrack: (track: Track) => void; user: User; dailyGoal: number; unread: number }) {
  const copy = trackCopy[track];
  const first = firstName(user.name);
  const done = Math.min(8, dailyGoal);
  return (
    <main className="screen">
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

        <div className="track-row"><span>I'm a</span><TrackSwitch track={track} onChange={onTrack} /></div>
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
            <div><small>{copy.metricLabel}</small><strong>72%</strong></div>
            <div><small>Streak</small><strong>6 days</strong></div>
          </div>
          <div className="id-goal">
            <div><span>Today's goal</span><strong>{done} / {dailyGoal} cards</strong></div>
            <div className="signal-progress light"><span style={{ width: `${(done / dailyGoal) * 100}%` }} /></div>
          </div>
          <button className="id-cta" onClick={() => navigate("set")}>
            <span><small>Up next</small>{copy.next}</span>
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
            <button className="service" key={service.label} onClick={() => navigate(service.screen)}>
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

      <GoalChart onOpen={() => navigate("profile")} />

      <section className="section-block">
        <div className="section-heading row">
          <h2>Continue learning</h2>
          <button className="text-button" onClick={() => navigate("library")}>Library</button>
        </div>
        <button className="continue-card" onClick={() => navigate("flashcards")}>
          <svg className="continue-swirl" viewBox="0 0 200 160" aria-hidden="true">
            <path d="M40 170C70 110 130 90 170 100c40 10 40-50 0-60-40-10-50 30-20 50 30 20 70 10 90-10" />
          </svg>
          <div className="continue-meta">
            <span className="continue-level"><span className="level-icon"><Icon name="sign" size={19} /></span>Beginner</span>
            <span className="time-pill"><Icon name="clock" size={15} />15 min</span>
          </div>
          <h3>Philippine Road Signs</h3>
          <p>Regulatory, warning, and guide signs</p>
          <div className="continue-bottom">
            <span>12 of 48 cards</span>
            <span className="ring-arrow" style={{ "--p": "25%" } as CSSProperties}>
              <span><Icon name="upright" size={18} /></span>
            </span>
          </div>
        </button>
      </section>

    </main>
  );
}

function Library({ navigate }: { navigate: (screen: Screen) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const filtered = studySets.filter((set) => {
    const matchesQuery = `${set.title} ${set.description}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "All" || (filter === "Exam prep" ? /exam/i.test(set.title) : set.tag === filter);
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
        {["All", "Recent", "Saved", "Refresher", "Exam prep"].map((item) => (
          <button className={`chip ${filter === item ? "active" : ""}`} onClick={() => setFilter(item)} aria-pressed={filter === item} key={item}>{item}</button>
        ))}
      </div>
      <section className="section-block library-block">
        <div className="section-heading row"><h2>{filter === "All" ? "Study sets" : filter}</h2><span className="muted">{filtered.length} {filtered.length === 1 ? "set" : "sets"}</span></div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <span className="stat-icon"><Icon name="search" size={18} /></span>
            <strong>No study sets found</strong>
            <p>Try another word, or browse all sets.</p>
            <button className="button secondary" onClick={() => { setQuery(""); setFilter("All"); }}>Show all sets</button>
          </div>
        )}
        <div className="set-list" hidden={filtered.length === 0}>
          {filtered.map((set) => (
            <button className="set-row" key={set.title} onClick={() => navigate("set")}>
              <span className="set-icon"><Icon name={set.icon} size={22} /></span>
              <span className="set-content">
                <span className="set-title-line"><strong>{set.title}</strong>{set.tag && <small>{set.tag}</small>}</span>
                <span className="set-description">{set.description}</span>
                <span className="set-footer"><span>{set.cards} cards</span>{set.progress > 0 && <><span>•</span><span>{set.progress}% learned</span></>}</span>
                {set.progress > 0 && <Progress value={set.progress} />}
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

const lessonUnits = [
  { title: "Steady red, amber, and green", meta: "6 cards · 4 min", status: "done" },
  { title: "Red and amber together", meta: "4 cards · 3 min", status: "done" },
  { title: "Flashing signals", meta: "5 cards · 4 min", status: "current" },
  { title: "Arrow and lane signals", meta: "5 cards · 4 min", status: "next" },
  { title: "When enforcers override signals", meta: "4 cards · 3 min", status: "next" },
];

function SetDetail({ navigate }: { navigate: (screen: Screen) => void }) {
  const [saved, setSaved] = useState(false);
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
            <h2>Traffic Signals and Lights</h2>
            <p>Read every signal with confidence, from steady lights to flashing amber.</p>
          </div>
          <TrafficLight lit={["amber"]} flashing size="lg" />
        </div>
        <div className="lesson-progress">
          <div><span>2 of 5 units</span><strong>40%</strong></div>
          <div className="signal-progress light"><span style={{ width: "40%" }} /></div>
        </div>
      </section>

      <section className="lesson-facts">
        <div><strong>24</strong><span>Flashcards</span></div>
        <div><strong>{questions.length}</strong><span>Questions</span></div>
        <div><strong>84%</strong><span>Accuracy</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading row"><h2>Units</h2><span className="muted">2 done</span></div>
        <ol className="unit-list">
          {lessonUnits.map((unit, index) => (
            <li className={`unit ${unit.status}`} key={unit.title}>
              <span className="unit-marker">{unit.status === "done" ? <Icon name="check" size={14} /> : index + 1}</span>
              <span className="unit-copy"><strong>{unit.title}</strong><small>{unit.meta}</small></span>
              {unit.status === "current" && <span className="unit-tag">In progress</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="section-block">
        <h2 className="mode-title">Ways to study</h2>
        <div className="mode-grid">
          <button className="mode-tile blue" onClick={() => navigate("flashcards")}><span className="stat-icon"><Icon name="cards" size={17} /></span><strong>Flashcards</strong><small>24 cards</small></button>
          <button className="mode-tile yellow" onClick={() => navigate("quiz")}><span className="stat-icon"><Icon name="exam" size={17} /></span><strong>Practice</strong><small>{questions.length} questions</small></button>
          <button className="mode-tile sky" onClick={() => navigate("ai")}><span className="stat-icon"><Icon name="spark" size={17} /></span><strong>AI Tutor</strong><small>Get help</small></button>
        </div>
      </section>

      <button className="button primary lesson-cta" onClick={() => navigate("quiz")}>Continue: Flashing signals<Icon name="arrow" size={18} /></button>
    </main>
  );
}

function Flashcards({ navigate, token }: { navigate: (screen: Screen) => void; token: string | null }) {
  const [flipped, setFlipped] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [card, setCard] = useState(4);
  const next = (direction: number) => {
    const nextCard = Math.min(20, Math.max(1, card + direction));
    setCard(nextCard);
    setFlipped(false);
    if (token) {
      saveStudyProgress(token, "Philippine Road Signs", nextCard, 20)
        .catch((error) => console.error("Unable to save study progress", error));
    }
  };
  return (
    <main className="screen flash-screen">
      <AppHeader title="Philippine Road Signs" back={() => navigate("set")} backLabel="Lesson" />
      <div className="study-progress">
        <span>Card {card} of 20</span><strong>{Math.round((card / 20) * 100)}%</strong>
      </div>
      <Progress value={(card / 20) * 100} />
      <div className="card-tools">
        <button className="tool-button"><Icon name="shuffle" size={18} />Shuffle</button>
        <button className={`icon-button ${bookmarked ? "selected" : ""}`} onClick={() => setBookmarked(!bookmarked)} aria-label="Bookmark card"><Icon name="bookmark" size={19} /></button>
      </div>
      <button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
        <span className="card-side">{flipped ? "ANSWER" : "QUESTION"}</span>
        {!flipped ? (
          <>
            <div className="road-line-visual"><span /><span /></div>
            <h2>What does a solid yellow line indicate?</h2>
          </>
        ) : (
          <>
            <h2>A restriction on crossing or overtaking.</h2>
            <p>A solid yellow line generally means you should not cross or overtake. Always follow the applicable road markings and traffic regulations.</p>
          </>
        )}
        <span className="flip-hint"><Icon name="cards" size={17} />Tap to flip</span>
      </button>
      <div className="card-nav">
        <button className="circle-button" onClick={() => next(-1)} disabled={card === 1} aria-label="Previous card"><Icon name="back" /></button>
        <span><i style={{ width: `${(card / 20) * 100}%` }} /></span>
        <button className="circle-button" onClick={() => next(1)} disabled={card === 20} aria-label="Next card"><Icon name="arrow" /></button>
      </div>
      <button className="ai-entry" onClick={() => navigate("ai")}><Icon name="spark" size={18} /><span><strong>Ask AI about this card</strong><small>Get an example or simpler explanation</small></span><Icon name="chevron" size={18} /></button>
    </main>
  );
}

type Question = {
  topic: string;
  prompt: string;
  lit: Lamp[];
  flashing?: boolean;
  options: string[];
  correct: number;
  explanation: string;
};

const questions: Question[] = [
  {
    topic: "Traffic signals",
    prompt: "The red and amber lights are on at the same time. What does this mean?",
    lit: ["red", "amber"],
    options: ["The traffic lights are broken", "Get ready — a green signal follows", "Stop and switch off your engine", "Proceed slowly through the junction"],
    correct: 1,
    explanation: "Red and amber together mean you should be ready to move, but wait for green. When traffic lights are broken, none of the signals are on, or the amber signal is flashing.",
  },
  {
    topic: "Traffic signals",
    prompt: "What does a green traffic signal allow you to do?",
    lit: ["green"],
    options: ["Proceed if the junction is clear", "Always turn left immediately", "Stop behind the line", "Reverse through the junction"],
    correct: 0,
    explanation: "Green allows you to proceed only when the way is clear. Continue to watch for pedestrians, cyclists, and vehicles still clearing the junction.",
  },
  {
    topic: "Flashing signals",
    prompt: "A traffic light is flashing amber. What should you do?",
    lit: ["amber"],
    flashing: true,
    options: ["Stop completely and wait for green", "Speed up to clear the intersection", "Slow down and proceed with caution", "Ignore it — the light is off duty"],
    correct: 2,
    explanation: "A flashing amber signal is a warning. Slow down, check for pedestrians and cross traffic, and only proceed when it is safe to do so.",
  },
  {
    topic: "Flashing signals",
    prompt: "A flashing red signal should be treated like what?",
    lit: ["red"],
    flashing: true,
    options: ["A give-way sign", "A stop sign", "A green signal", "A lane-change signal"],
    correct: 1,
    explanation: "A flashing red signal requires you to stop. Proceed only after stopping and confirming that it is safe and permitted.",
  },
  {
    topic: "Steady signals",
    prompt: "What must a driver do at a steady red signal?",
    lit: ["red"],
    options: ["Slow down and continue if clear", "Stop behind the stop line and wait", "Sound the horn before crossing", "Stop only if a pedestrian is crossing"],
    correct: 1,
    explanation: "A steady red signal means stop. Wait behind the stop line or pedestrian lane until the signal turns green, unless a sign or traffic enforcer directs otherwise.",
  },
  {
    topic: "Steady signals",
    prompt: "Where should you stop at a steady red signal?",
    lit: ["red"],
    options: ["Past the pedestrian crossing", "Behind the stop line", "In the middle of the junction", "On the shoulder"],
    correct: 1,
    explanation: "Stop behind the stop line. If there is no stop line, stop before the pedestrian crossing or the junction.",
  },
  {
    topic: "Road signs",
    prompt: "What is the main purpose of a regulatory road sign?",
    lit: [],
    options: ["To give orders or restrictions", "To advertise nearby businesses", "To show the weather", "To mark scenic viewpoints only"],
    correct: 0,
    explanation: "Regulatory signs communicate legal requirements, restrictions, or prohibitions that road users must follow.",
  },
  {
    topic: "Road signs",
    prompt: "What should you do when you see a STOP sign?",
    lit: [],
    options: ["Slow down but continue", "Stop completely and proceed when safe", "Sound the horn and pass", "Stop only if traffic is visible"],
    correct: 1,
    explanation: "Stop completely at the appropriate line or before the intersection, then proceed only when the road is clear and safe.",
  },
  {
    topic: "Pavement markings",
    prompt: "What does a solid yellow line generally indicate?",
    lit: [],
    options: ["Crossing or overtaking is restricted", "Parking is required", "The lane is for bicycles only", "The road is ending"],
    correct: 0,
    explanation: "A solid yellow line generally restricts crossing or overtaking. Follow the markings and any signs in the area.",
  },
  {
    topic: "Pavement markings",
    prompt: "What should you do before crossing a broken lane line?",
    lit: [],
    options: ["Check mirrors and blind spots, then signal", "Accelerate without checking", "Turn on hazard lights only", "Stop in the lane"],
    correct: 0,
    explanation: "A broken line may allow a lane change, but you must check mirrors and blind spots, signal, and move only when safe.",
  },
  {
    topic: "Right of way",
    prompt: "At an uncontrolled intersection, who should you yield to?",
    lit: [],
    options: ["Vehicles already in the intersection", "Only vehicles behind you", "The fastest vehicle", "No one"],
    correct: 0,
    explanation: "Slow down and yield to vehicles already in the intersection, pedestrians, and anyone with priority under the applicable signs or markings.",
  },
  {
    topic: "Right of way",
    prompt: "What should you do when a pedestrian is crossing at a marked crossing?",
    lit: [],
    options: ["Yield and allow the pedestrian to cross", "Sound the horn and continue", "Overtake the vehicle that stopped", "Drive around the pedestrian"],
    correct: 0,
    explanation: "Reduce speed and yield to pedestrians using a marked crossing. Do not overtake a vehicle that has stopped for a pedestrian.",
  },
  {
    topic: "Safe overtaking",
    prompt: "When is overtaking unsafe?",
    lit: [],
    options: ["When visibility is limited on a curve or hill", "When the road is clear and markings allow it", "After checking mirrors and blind spots", "When you can return safely"],
    correct: 0,
    explanation: "Avoid overtaking where visibility is limited, such as curves, hills, intersections, crossings, and areas with restrictive markings.",
  },
  {
    topic: "Safe overtaking",
    prompt: "What should you check before changing lanes?",
    lit: [],
    options: ["Mirrors, blind spots, signal, and space", "Only the vehicle speedometer", "Only the road behind you", "Nothing if you are in a hurry"],
    correct: 0,
    explanation: "Use mirrors, check blind spots, signal early, and change lanes only when there is enough safe space.",
  },
  {
    topic: "Driver responsibility",
    prompt: "What is the safest response when a traffic enforcer gives a direction different from a signal?",
    lit: [],
    options: ["Follow the enforcer's direction", "Follow the signal and ignore the enforcer", "Stop permanently", "Ask another driver to decide"],
    correct: 0,
    explanation: "A lawful direction from a traffic enforcer takes priority over the normal signal for that situation. Follow it carefully and safely.",
  },
];

const letter = (index: number) => String.fromCharCode(65 + index);

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createQuizQuestions() {
  return shuffle(questions).map((question) => {
    const options = question.options.map((text, index) => ({ text, correct: index === question.correct }));
    const shuffledOptions = shuffle(options);
    return {
      ...question,
      options: shuffledOptions.map((option) => option.text),
      correct: shuffledOptions.findIndex((option) => option.correct),
    };
  });
}

function Quiz({
  question,
  index,
  total,
  selected,
  onSelect,
  onCheck,
  navigate,
}: {
  question: Question;
  index: number;
  total: number;
  selected: number | null;
  onSelect: (option: number) => void;
  onCheck: () => void;
  navigate: (screen: Screen) => void;
}) {
  return (
    <main className="screen quiz-screen">
      <AppHeader
        title="Practice"
        subtitle={question.topic}
        back={() => navigate("set")} backLabel="Lesson"
        action={<span className="time-pill small"><Icon name="clock" size={14} />0:42</span>}
      />
      <div className="segments" aria-label={`Question ${index + 1} of ${total}`}>
        {Array.from({ length: total }, (_, segment) => <span key={segment} className={segment < index ? "done" : segment === index ? "current" : ""} />)}
      </div>
      <section className="question-card">
        <div className="question-visual"><TrafficLight lit={question.lit} flashing={question.flashing} size="lg" /></div>
        <span className="question-count">Question {index + 1} of {total}</span>
        <h2>{question.prompt}</h2>
      </section>
      <div className="answer-list" role="radiogroup" aria-label="Answer choices">
        {question.options.map((option, optionIndex) => (
          <button
            className={`answer ${selected === optionIndex ? "selected" : ""}`}
            onClick={() => onSelect(optionIndex)}
            role="radio"
            aria-checked={selected === optionIndex}
            key={option}
          >
            <span className="answer-letter">{letter(optionIndex)}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <div className="action-bar">
        <p className="action-hint" aria-live="polite">{selected === null ? "Choose an answer to continue" : `Answer ${letter(selected)} selected`}</p>
        <button className="button primary quiz-action" disabled={selected === null} onClick={onCheck}>
          Check answer<Icon name="arrow" size={18} />
        </button>
      </div>
    </main>
  );
}

function Feedback({
  question,
  index,
  total,
  selected,
  onNext,
  navigate,
}: {
  question: Question;
  index: number;
  total: number;
  selected: number;
  onNext: () => void;
  navigate: (screen: Screen) => void;
}) {
  const isCorrect = selected === question.correct;
  const last = index === total - 1;
  return (
    <main className="screen quiz-screen">
      <AppHeader
        title={isCorrect ? "Nice work" : "Not quite"}
        subtitle={`Question ${index + 1} of ${total}`}
        back={() => navigate("set")} backLabel="Lesson"
      />
      <section className={`verdict ${isCorrect ? "good" : "bad"}`}>
        <span className="verdict-icon"><Icon name={isCorrect ? "check" : "close"} size={18} /></span>
        <div><strong>{isCorrect ? "You got it right" : "Let's review this one"}</strong><p>{question.prompt}</p></div>
      </section>
      <div className="answer-head">
        <span>Your answer</span>
        <span className="correct-badge">Correct answer <b>{letter(question.correct)}</b></span>
      </div>
      <div className="answer-list">
        {!isCorrect && (
          <div className="answer wrong">
            <span className="answer-mark"><Icon name="close" size={16} /></span>
            <span><b>{letter(selected)}:</b> {question.options[selected]}</span>
          </div>
        )}
        <div className="answer correct">
          <span className="answer-mark"><Icon name="check" size={16} /></span>
          <span><b>{letter(question.correct)}:</b> {question.options[question.correct]}</span>
        </div>
      </div>
      <section className="comment-card">
        <h3>Comment</h3>
        <div>
          <TrafficLight lit={question.lit} flashing={question.flashing} size="md" />
          <p>{question.explanation}</p>
        </div>
      </section>
      <button className="ai-entry" onClick={() => navigate("ai")}><Icon name="spark" size={18} /><span><strong>Ask AI Tutor to explain</strong><small>Get a real-world example of this rule</small></span><Icon name="chevron" size={18} /></button>
      <div className="action-bar">
        <button className="button primary quiz-action" onClick={onNext}>{last ? "See results" : "Next question"}<Icon name="arrow" size={18} /></button>
      </div>
    </main>
  );
}

function Results({ navigate, score, total, name }: { navigate: (screen: Screen) => void; score: number; total: number; name: string }) {
  const strong = score / total >= 0.67;
  return (
    <main className="screen results-screen">
      <AppHeader title="Quiz results" back={() => navigate("set")} backLabel="Lesson" />
      <section className="results-hero">
        <div className="score-ring" style={{ "--score": `${(score / total) * 100}%` } as CSSProperties}><span><strong>{score}</strong><small>/{total}</small></span></div>
        <h2>{strong ? `Good work, ${name}!` : `Keep going, ${name}`}</h2>
        <p>{strong ? "You read the signals well. Review the one you missed and you are ready for the next unit." : "Signals take practice. Review the explanations and try the drill again."}</p>
      </section>
      <div className="score-breakdown">
        <div><span className="status-dot correct-dot"><Icon name="check" size={17} /></span><span><strong>{score}</strong><small>Correct</small></span></div>
        <div><span className="status-dot wrong-dot"><Icon name="close" size={17} /></span><span><strong>{total - score}</strong><small>To review</small></span></div>
      </div>
      <div className="action-stack">
        <button className="button primary" onClick={() => navigate("quiz")}>Review mistakes</button>
        <button className="button secondary" onClick={() => navigate("quiz")}>Try again</button>
      </div>
      <button className="ai-entry" onClick={() => navigate("ai")}><Icon name="spark" size={18} /><span><strong>Ask AI to explain my mistakes</strong><small>Understand the rules you missed</small></span><Icon name="chevron" size={18} /></button>
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
  { label: "Explain red and amber together", tone: "red", icon: "signal" as IconName },
  { label: "Who has the right of way?", tone: "yellow", icon: "arrow" as IconName },
  { label: "When can I overtake?", tone: "blue", icon: "marking" as IconName },
  { label: "Quiz me on signals", tone: "sky", icon: "exam" as IconName },
];

function AskAI({ name, token }: { name: string; token: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const send = async (message: string) => {
    const text = message.trim();
    if (!text || typing) return;
    const nextMessages = [...messages, { role: "user" as const, text }];
    setMessages(nextMessages);
    setDraft("");
    setTyping(true);
    if (token) {
      try {
        const response = await askLocalAi(token, nextMessages.map((item) => ({
          role: item.role === "ai" ? "assistant" : "user",
          content: item.text,
        })));
        setMessages((current) => [...current, { role: "ai", text: response.text }]);
        setTyping(false);
        return;
      } catch (error) {
        console.error("Local AI unavailable, using tutor fallback", error);
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
        <div><h1>AI Tutor</h1><p>Online · Philippine traffic rules</p></div>
        <button className="icon-button round" onClick={() => setMessages([])} aria-label="New conversation"><Icon name="plus" size={18} /></button>
      </header>
      <div className="context-chip"><Icon name="signal" size={15} />Studying <b>Traffic Signals and Lights</b></div>

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
            {tutorPrompts.map((prompt) => (
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

const topicStats = [
  { label: "Road signs", tone: "red", total: 128, accuracy: 83 },
  { label: "Traffic signals", tone: "yellow", total: 68, accuracy: 84 },
  { label: "Road rules", tone: "blue", total: 45, accuracy: 74 },
];

function Profile({ track, user, navigate }: { track: Track; user: User; navigate: (screen: Screen) => void }) {
  const copy = trackCopy[track];
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

      <GoalChart selectable />
      <section className="week-card">
        <span className="week-title">Question distribution</span>
        <p className="week-sub tap-hint">Tap a bar above to see that day by topic.</p>
        <div className="dist-table">
          <div className="dist-head"><span>Topic</span><span>Total</span><span>Accuracy</span></div>
          {topicStats.map((topic) => (
            <div className="dist-row" key={topic.label}>
              <span><i className={topic.tone} />{topic.label}</span>
              <span>{topic.total}</span>
              <span>{topic.accuracy}%</span>
            </div>
          ))}
        </div>
      </section>
      <section className="week-card readiness">
        <div className="donut"><span><strong>72%</strong><small>{copy.ringLabel}</small></span></div>
        <div className="readiness-copy">
          <span className="week-title">{copy.ringTitle}</span>
          <ul>
            <li><i className="blue" />Mastered<b>104</b></li>
            <li><i className="yellow" />Learning<b>52</b></li>
            <li><i className="red" />Needs review<b>44</b></li>
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

const navItems: { screen: Screen; icon: IconName; label: string }[] = [
  { screen: "home", icon: "home", label: "Home" },
  { screen: "library", icon: "library", label: "Library" },
  { screen: "ai", icon: "dai", label: "Ask Dai" },
  { screen: "set", icon: "study", label: "Study" },
  { screen: "profile", icon: "user", label: "Progress" },
];

// ───────── Account, auth, and settings ─────────

type User = { id?: number; name: string; email: string; guest?: boolean; license?: License; track?: Track };

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

function AuthScreen({ onAuth, track, onTrack }: { onAuth: (user: User) => void; track: Track; onTrack: (track: Track) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setErrors({});
    setNotice("");
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
      onAuth({ ...response.user, ...withLicense });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to connect to the server.");
      setLoading(false);
    }
  };

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
                  <span>I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Use</a> and <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.</span>
                </label>
                {errors.agree && <span className="field-error">{errors.agree}</span>}
              </>
            ) : (
              <div className="auth-row">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setNotice(emailPattern.test(email.trim()) ? `If ${email.trim()} has an account, a reset link is on its way.` : "Enter your email above, then tap Forgot password again.")}
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
  onTrack,
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
  onTrack: (track: Track) => void;
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
        <LicenseUpload
          value={user.license ?? null}
          onChange={(license) => {
            onUpdateUser({ ...user, license: license ?? undefined });
            onLicenseChange(license);
            if (license) onTrack("licensed");
          }}
        />
        <p className="license-note"><Icon name="lock" size={14} />Stored only on this device.</p>
      </section>

      <h2 className="settings-title">Learning</h2>
      <section className="settings-group">
        <div className="settings-row stacked">
          <span className="settings-icon yellow"><Icon name="user" size={18} /></span>
          <span className="settings-copy"><strong>I'm a</strong><small>Changes your goals and suggestions.</small></span>
          <TrackSwitch track={track} onChange={onTrack} />
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
        <SettingsRow icon="shield" tone="yellow" label="Privacy policy" onClick={() => {}} />
        <SettingsRow icon="rules" tone="red" label="Terms of use" onClick={() => {}} />
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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(() => createQuizQuestions());
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [track, setTrack] = usePersistent<Track>("kamote-track", "new");
  const [user, setUser] = usePersistent<User | null>("kamote-user", null);
  const [dailyGoal, setDailyGoal] = usePersistent("kamote-daily-goal", 10);
  const [notificationsOn, setNotificationsOn] = usePersistent("kamote-notifications", true);
  const [noticeList, setNotices] = usePersistent<Notice[]>("kamote-notices", []);
  const [seeded, setSeeded] = usePersistent("kamote-notices-seeded", false);
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
  const pushNotice = (notice: Omit<Notice, "id" | "time" | "read">) => {
    if (!notificationsOn) return;
    setNotices([{ ...notice, id: `n${Date.now()}`, time: Date.now(), read: false }, ...noticeList]);
  };
  const [loading, setLoading] = useState<string | null>("Starting your engine…");
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setLoading(null), 1400);
    return () => window.clearTimeout(timer);
  }, [loading]);
  const activeNav = useMemo(() => {
    if (["library"].includes(screen)) return "library";
    if (["set", "flashcards", "quiz", "feedback", "results"].includes(screen)) return "set";
    if (screen === "settings") return "profile";
    if (screen === "notifications") return "home";
    return screen;
  }, [screen]);
  const navigate = (next: Screen) => {
    if (next === "quiz" && screen !== "feedback") {
      setQuestionIndex(0);
      setQuizQuestions(createQuizQuestions());
      setAnswer(null);
      setScore(0);
      scoreRef.current = 0;
    }
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const nextQuestion = () => {
    if (questionIndex < quizQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setAnswer(null);
      setScreen("quiz");
    } else {
      setScreen("results");
      const activeToken = window.localStorage.getItem("kamote-token");
      if (activeToken) {
        saveQuizAttempt(activeToken, scoreRef.current, quizQuestions.length).catch((error) => {
          console.error("Unable to save quiz progress", error);
        });
      }
      pushNotice({
        kind: "quiz",
        title: `Practice quiz: ${scoreRef.current} of ${quizQuestions.length} correct`,
        body: scoreRef.current === quizQuestions.length ? "Perfect score! Try the next unit." : "Review the questions you missed to lock in the rules.",
        target: "results",
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const question = quizQuestions[questionIndex];
  const signOut = () => {
    window.localStorage.removeItem("kamote-token");
    setUser(null);
    setScreen("home");
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
        track={track}
        onTrack={setTrack}
        onAuth={(next) => {
          setUser(next);
          setScreen("home");
          setLoading(`Preparing your lessons, ${firstName(next.name)}…`);
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
      <div className={`mobile-app ${["quiz", "feedback"].includes(screen) ? "focus-mode" : ""}`}>
        <div className="mobile-brand"><button onClick={() => navigate("home")}><strong className="app-wordmark">Kamote <em>PH</em></strong></button></div>
        {screen === "home" && <Home navigate={navigate} track={track} onTrack={setTrack} user={user} dailyGoal={dailyGoal} unread={unread} />}
        {screen === "library" && <Library navigate={navigate} />}
        {screen === "set" && <SetDetail navigate={navigate} />}
        {screen === "flashcards" && <Flashcards navigate={navigate} token={token} />}
        {screen === "quiz" && (
          <Quiz
            question={question}
            index={questionIndex}
            total={quizQuestions.length}
            selected={answer}
            onSelect={setAnswer}
            onCheck={() => {
              if (answer === question.correct) {
                scoreRef.current += 1;
                setScore(scoreRef.current);
              }
              navigate("feedback");
            }}
            navigate={navigate}
          />
        )}
        {screen === "feedback" && answer !== null && (
          <Feedback question={question} index={questionIndex} total={quizQuestions.length} selected={answer} onNext={nextQuestion} navigate={navigate} />
        )}
        {screen === "results" && <Results navigate={navigate} score={score} total={quizQuestions.length} name={first} />}
        {screen === "ai" && <AskAI name={first} token={token} />}
        {screen === "profile" && <Profile track={track} user={user} navigate={navigate} />}
        {screen === "settings" && (
          <Settings
            navigate={navigate}
            user={user}
            onUpdateUser={(nextUser) => { setUser(nextUser); syncSettings({ name: nextUser.name }, nextUser); }}
            track={track}
            onTrack={(nextTrack) => { setTrack(nextTrack); syncSettings({ track: nextTrack }, user); }}
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
              request.catch((error) => console.error("Unable to sync license", error));
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
