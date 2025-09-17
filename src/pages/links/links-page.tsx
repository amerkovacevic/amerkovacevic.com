import { useState } from "react";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";

type LinkItem = { title: string; url: string; emoji?: string; subtle?: boolean };

export default function Links() {
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHero
        icon="🌐"
        eyebrow="Connect"
        title="Amer Kovacevic"
        description="Builder of small, useful tools. Based online—shipping from St. Louis energy."
        stats={
          <>
            <StatPill>Product & design</StatPill>
            <StatPill>Side-project lab</StatPill>
            <StatPill>Always exploring</StatPill>
          </>
        }
        actions={
          <div className="flex flex-col items-stretch gap-2">
            <button
              onClick={copyEmail}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {copied ? "Copied ✅" : "Copy email"}
            </button>
            <a
              href={`mailto:${email}`}
              className={buttonStyles({ size: "sm" })}
            >
              Say hi →
            </a>
          </div>
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
                ? "border border-border-light bg-surface text-brand-strong hover:border-brand/40 hover:bg-surface/80 dark:bg-surface-overlayDark"
                : "bg-brand text-white shadow-brand hover:bg-brand-strong",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-lg">
              <span aria-hidden>{l.emoji ?? "🔗"}</span>
              <span>{l.title}</span>
            </span>
            <span className={l.subtle ? "text-brand-muted" : "text-white/80"}>→</span>
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
