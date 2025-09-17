import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="rounded-2xl p-8 md:p-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Amer Kovacevic
          </h1>
          <p className="mt-4 text-gray-300 text-lg">
            Builder. Problem-solver. Small tools that make real life easier.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/pickup"
              className="inline-flex items-center rounded-xl px-4 py-2 bg-brand-light text-white font-medium hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand"
            >
              ⚽ Pickup Soccer
            </Link>
            <a
              href="mailto:amer@amerkovacevic.com"
              className="inline-flex items-center rounded-xl px-4 py-2 border border-brand text-brand hover:bg-brand/10 dark:text-brand-light dark:border-brand-light"
            >
              ✉️ Contact
            </a>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <ToolCard
          title="Pickup Soccer"
          emoji="⚽"
          description="Post games, RSVP in one click, see spots left."
          to="/pickup"
          cta="Open"
        />
        <ToolCard
          title="Secret Santa"
          emoji="🎁"
          description="Create a group, invite by code, auto-assign matches."
          to="/santa"
          cta="Open"
        />
        <ToolCard
          title="Links & Resume"
          emoji="🔗"
          description="Social links plus a clean resume page."
          to="/resume"
          cta="Open"
        />
      </section>

      <div className="mt-10 text-xs text-gray-500">
        © {new Date().getFullYear()} AmerKovacevic.com
      </div>
    </div>
  );
}

function ToolCard({
  title,
  emoji,
  description,
  to,
  cta = "Open",
}: {
  title: string;
  emoji: string;
  description: string;
  to: string;
  cta?: string;
}) {
  return (
    <Link to={to}>
      <div className="h-full rounded-2xl border p-5 hover:shadow-sm transition bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="text-2xl">{emoji}</div>
        <h3 className="mt-2 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        <div className="mt-4">
          <span className="inline-flex items-center rounded-lg px-3 py-1 bg-brand-light text-white border border-transparent text-sm dark:bg-brand-dark">
            {cta}
          </span>
        </div>
      </div>
    </Link>
  );
}
