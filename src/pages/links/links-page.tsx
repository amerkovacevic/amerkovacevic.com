import { useState } from "react";

import { PageHero, PageSection } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";

type LinkItem = { title: string; url: string; emoji?: string; subtle?: boolean };

export default function Links() {
  const links: LinkItem[] = [
    { title: "Instagram", url: "https://instagram.com/am.zzy", emoji: "📸" },
    { title: "GitHub", url: "https://github.com/amerkovacevic", emoji: "💻" },
    { title: "LinkedIn", url: "https://linkedin.com/in/amerkovacevic", emoji: "💼" },
    { title: "Email me", url: "mailto:amer@amerkovacevic.com", emoji: "✉️" },
    { title: "Pickup Soccer", url: "/pickup", emoji: "⚽", subtle: true },
  ];

  const email = "amer@amerkovacevic.com";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHero
        icon="🌐"
        title="Amer Kovacevic"
        actions={
          <a
            href={`mailto:${email}`}
            className={buttonStyles({ size: "sm" })}
          >
            Say hi →
          </a>
        }
      />

      <PageSection contentClassName="flex flex-col items-center gap-4 text-center">
        <Avatar />
        <p className="max-w-xl text-sm text-brand-muted dark:text-brand-subtle">
          Each experiment below is a living document of things I’m learning—whether it’s community tools for pickup soccer or tiny utilities for friends.
        </p>
      </PageSection>

      <PageSection title="Links" description="Favorite places on the internet right now." contentClassName="grid gap-3">
        {links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target={l.url.startsWith("/") ? "_self" : "_blank"}
            rel={l.url.startsWith("/") ? undefined : "noreferrer"}
            className={[
              "flex items-center justify-between rounded-brand-lg px-4 py-3 transition",
              l.subtle
                ? "border border-border-light bg-surface text-brand-strong hover:border-brand/40 hover:bg-surface/90 dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground"
                : "bg-brand text-brand-foreground shadow-brand hover:bg-brand-strong",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-lg">
              <span aria-hidden>{l.emoji ?? "🔗"}</span>
              <span>{l.title}</span>
            </span>
            <span className={l.subtle ? "text-brand-muted dark:text-brand-subtle" : "text-brand-foreground/80"}>→</span>
          </a>
        ))}
      </PageSection>

      <p className="text-center text-xs text-brand-muted dark:text-brand-subtle">
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
