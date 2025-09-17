import { ReactNode } from "react";

import { PageHero } from "../../shared/components/page";
import { cn } from "../../shared/lib/classnames";

type LinkItem = {
  title: string;
  url: string;
  icon: ReactNode;
  iconWrapperClassName?: string;
  textClassName?: string;
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2.162c-3.2 0-3.585.012-4.85.07-1.17.054-1.805.249-2.227.415-.56.217-.96.477-1.38.896-.42.42-.68.82-.896 1.38-.166.422-.361 1.057-.415 2.227-.058 1.265-.07 1.65-.07 4.85s.012 3.585.07 4.85c.054 1.17.249 1.805.415 2.227.217.56.477.96.896 1.38.42.42.82.68 1.38.896.422.166 1.057.361 2.227.415 1.265.058 1.65.07 4.85.07s3.585-.012 4.85-.07c1.17-.054 1.805-.249 2.227-.415.56-.217.96-.477 1.38-.896.42-.42.68-.82.896-1.38.166-.422.361-1.057.415-2.227.058-1.265.07-1.65.07-4.85s-.012-3.585-.07-4.85c-.054-1.17-.249-1.805-.415-2.227a3.758 3.758 0 0 0-.896-1.38 3.758 3.758 0 0 0-1.38-.896c-.422-.166-1.057-.361-2.227-.415-1.265-.058-1.65-.07-4.85-.07zm0-2.162c3.27 0 3.675.012 4.965.072 1.28.058 2.152.265 2.963.568a5.92 5.92 0 0 1 2.14 1.39 5.92 5.92 0 0 1 1.39 2.14c.303.811.51 1.683.568 2.963.06 1.29.072 1.695.072 4.965s-.012 3.675-.072 4.965c-.058 1.28-.265 2.152-.568 2.963a5.92 5.92 0 0 1-1.39 2.14 5.92 5.92 0 0 1-2.14 1.39c-.811.303-1.683.51-2.963.568-1.29.06-1.695.072-4.965.072s-3.675-.012-4.965-.072c-1.28-.058-2.152-.265-2.963-.568a5.92 5.92 0 0 1-2.14-1.39 5.92 5.92 0 0 1-1.39-2.14c-.303-.811-.51-1.683-.568-2.963C.012 15.675 0 15.27 0 12s.012-3.675.072-4.965c.058-1.28.265-2.152.568-2.963a5.92 5.92 0 0 1 1.39-2.14A5.92 5.92 0 0 1 4.17.64c.811-.303 1.683-.51 2.963-.568C8.422.012 8.827 0 12 0z" />
      <path d="M12 5.851a6.149 6.149 0 1 1 0 12.298 6.149 6.149 0 0 1 0-12.298zm0 10.137a3.988 3.988 0 1 0 0-7.976 3.988 3.988 0 0 0 0 7.976z" />
      <circle cx="18.406" cy="5.595" r="1.436" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .296c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.011-1.04-.016-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.388-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.237 1.838 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.776.419-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404 11.52 11.52 0 0 1 3.003.404c2.291-1.552 3.297-1.23 3.297-1.23.655 1.653.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.22 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222 0 1.605-.014 2.896-.014 3.286 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.296c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003zM7.119 20.452H3.805V9h3.314v11.452zM5.462 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM20.452 20.452h-3.554V14.89c0-1.327-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.66H9.896V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.372-1.852 3.605 0 4.27 2.372 4.27 5.456v6.287z" />
    </svg>
  );
}

export default function Links() {
  const links: LinkItem[] = [
    {
      title: "GitHub",
      url: "https://github.com/amerkovacevic",
      icon: <GithubIcon className="h-6 w-6 fill-white" />,
      iconWrapperClassName: "bg-[#181717]",
    },
    {
      title: "LinkedIn",
      url: "https://linkedin.com/in/amerkovacevic",
      icon: <LinkedinIcon className="h-6 w-6 fill-white" />,
      iconWrapperClassName: "bg-[#0A66C2]",
    },
    {
      title: "Instagram",
      url: "https://instagram.com/am.zzy",
      icon: <InstagramIcon className="h-6 w-6 fill-white" />,
      iconWrapperClassName: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4]",
    },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <PageHero
        title={
          <span className="flex flex-col gap-3">
            <span className="text-balance bg-gradient-to-r from-brand via-brand-accent to-emerald-400 bg-clip-text text-transparent">
              Amer Kovacevic
            </span>
          </span>
        }
        // description="Curated portals to say hello, follow my work, or drop a quick message."
        // className="shadow-brand"
      />

      <section className="space-y-4">
        <div className="grid gap-3">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target={link.url.startsWith("/") ? "_self" : "_blank"}
              rel={link.url.startsWith("/") ? undefined : "noreferrer"}
              className="group relative flex items-center justify-between overflow-hidden rounded-[1.75rem] border border-border-light/70 bg-surface/90 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-brand dark:border-border-dark/70 dark:bg-surface-overlayDark/85"
            >
              <span className="flex items-center gap-4">
                <span
                  aria-hidden
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-full text-white shadow-brand-sm transition-transform duration-300 group-hover:scale-105",
                    link.iconWrapperClassName
                  )}
                >
                  {link.icon}
                </span>
                <span className={cn("text-lg font-semibold text-brand-strong dark:text-brand-foreground", link.textClassName)}>
                  {link.title}
                </span>
              </span>
              <span className="text-brand-muted transition-transform duration-300 group-hover:translate-x-1 dark:text-brand-subtle">
                →
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
