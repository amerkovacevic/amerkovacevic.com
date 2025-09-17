import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const APPS = [
  { id: "pickup", name: "Pickup Soccer", to: "/pickup", emoji: "⚽", blurb: "Post games, RSVP in one click, see spots left." },
  { id: "santa",  name: "Secret Santa",  to: "/santa",  emoji: "🎁", blurb: "Create a group, invite by code, auto-assign matches." },
  { id: "fm",  name: "Fm Team Draw",  to: "/fm",  emoji: "🎮", blurb: "Randomly assign Football Manager teams to your group." },
] as const;

export default function Home() {
  const [q, setQ] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => { try { const raw = localStorage.getItem("pinnedApps"); if (raw) setPinned(JSON.parse(raw)); } catch {} }, []);
  const togglePin = (id: string) => setPinned(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    localStorage.setItem("pinnedApps", JSON.stringify(next));
    return next;
  });

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return APPS
      .filter(a => (a.name + " " + a.blurb).toLowerCase().includes(ql))
      .sort((a,b) => (pinned.includes(a.id) === pinned.includes(b.id))
        ? a.name.localeCompare(b.name)
        : pinned.includes(a.id) ? -1 : 1);
  }, [q, pinned]);

  return (
    <div className="relative">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-gray-200 to-transparent dark:from-brand/20 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-gray-200 to-transparent dark:from-purple-600/20 dark:to-transparent blur-3xl" />
      </div>

      {/* header row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-semibold">Apps</h1>
        <div className="relative w-full sm:w-80">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps…"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur px-3 py-2 pl-9 outline-none focus:ring-2 focus:ring-brand/30"
          />
          <span className="absolute left-3 top-2.5 text-gray-500">🔎</span>
        </div>
      </div>

      {/* app grid */}
      <section className="grid gap-6 md:grid-cols-2">
        {filtered.map(app => (
          <AppCard key={app.id} app={app} pinned={pinned.includes(app.id)} onPin={() => togglePin(app.id)} />
        ))}
      </section>

      <footer className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} AmerKovacevic.com
      </footer>
    </div>
  );
}

function AppCard({
  app, pinned, onPin,
}: {
  app: { id: string; name: string; to: string; emoji: string; blurb: string };
  pinned: boolean; onPin: () => void;
}) {
  return (
    <div className="group h-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="text-2xl">{app.emoji}</div>
          <button onClick={onPin} className="rounded-lg px-2 py-1 text-[11px] border border-transparent hover:border-gray-300 dark:hover:border-gray-700" title={pinned ? "Unpin" : "Pin"}>
            {pinned ? "★" : "☆"}
          </button>
        </div>
        <h3 className="mt-2 text-lg font-semibold">{app.name}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{app.blurb}</p>
        <div className="mt-4 flex items-center justify-between">
          <Link to={app.to} className="inline-flex items-center gap-1 rounded-lg px-3 py-1 bg-gray-900 text-white dark:bg-gray-800 text-sm transition group-hover:bg-gray-700">
            Open <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            {app.id}
          </span>
        </div>
      </div>
    </div>
  );
}
