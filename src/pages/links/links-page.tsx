import { useState } from "react";

type LinkItem = { title: string; url: string; emoji?: string; subtle?: boolean };

export default function Links() {
  // 🔧 Update these with your real profiles
  const links: LinkItem[] = [
    { title: "Twitter / X", url: "https://twitter.com/yourhandle", emoji: "🐦" },
    { title: "LinkedIn", url: "https://linkedin.com/in/yourhandle", emoji: "💼" },
    { title: "GitHub", url: "https://github.com/yourhandle", emoji: "💻" },
    { title: "Email me", url: "mailto:amer@amerkovacevic.com", emoji: "✉️" },
    { title: "Pickup Soccer", url: "/pickup", emoji: "⚽", subtle: true },
  ];

  const [copied, setCopied] = useState(false);
  const email = "amer@amerkovacevic.com";
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header card */}
      <section className="rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-8 text-white text-center">
          <Avatar />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Amer Kovacevic</h1>
          <p className="mt-2 text-gray-300">
            Builder of small, useful tools. Based online—shipping from St. Louis energy.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={copyEmail}
              className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
              title="Copy email"
            >
              {copied ? "Copied ✅" : "Copy email"}
            </button>
            <a
              href="mailto:amer@amerkovacevic.com"
              className="rounded-xl bg-brand text-white px-3 py-1.5 text-sm font-medium hover:bg-brand-light dark:hover:bg-brand-dark"
            >
              Email
            </a>
          </div>
        </div>
      </section>

      {/* Link buttons */}
      <section className="mt-6 grid gap-3">
        {links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target={l.url.startsWith("/") ? "_self" : "_blank"}
            rel={l.url.startsWith("/") ? undefined : "noreferrer"}
            className={[
              "flex items-center justify-between rounded-2xl px-4 py-3 border",
              l.subtle
                ? "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
                : "bg-brand text-white border-brand hover:bg-brand-light dark:hover:bg-brand-dark",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-lg">
              <span>{l.emoji ?? "🔗"}</span>
              <span>{l.title}</span>
            </span>
            <span className={l.subtle ? "text-gray-400" : "text-white/70"}>→</span>
          </a>
        ))}
      </section>

      <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} AmerKovacevic.com
      </p>
    </div>
  );
}

function Avatar() {
  // If /public/amer.jpg exists, show it; else show initials
  const [errored, setErrored] = useState(false);
  if (!errored) {
    return (
      <img
        src="/amer.jpg"
        alt="Amer Kovacevic"
        onError={() => setErrored(true)}
        className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-white/20"
      />
    );
  }
  return (
    <div className="mx-auto h-24 w-24 rounded-full bg-white/10 ring-2 ring-white/20 grid place-items-center text-3xl font-semibold">
      AK
    </div>
  );
}
