import { PageHero, PageSection } from "../../shared/components/page";

type LinkItem = {
  title: string;
  url: string;
  icon: {
    light: string;
    dark: string;
  };
  subtle?: boolean;
};

export default function Links() {
  const links: LinkItem[] = [
    {
      title: "Instagram",
      url: "https://instagram.com/am.zzy",
      icon: {
        light: "/icons/instagram-light.svg",
        dark: "/icons/instagram-dark.svg",
      },
    },
    {
      title: "GitHub",
      url: "https://github.com/amerkovacevic",
      icon: {
        light: "/icons/github-light.svg",
        dark: "/icons/github-dark.svg",
      },
    },
    {
      title: "LinkedIn",
      url: "https://linkedin.com/in/amerkovacevic",
      icon: {
        light: "/icons/linkedin-light.svg",
        dark: "/icons/linkedin-dark.svg",
      },
    },
    {
      title: "Email me",
      url: "mailto:amer@amerkovacevic.com",
      icon: {
        light: "/icons/email-light.svg",
        dark: "/icons/email-dark.svg",
      },
      subtle: true,
    },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHero title="Amer Kovacevic" />

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
              <span aria-hidden className="relative flex h-7 w-7 items-center justify-center">
                <img src={l.icon.light} alt="" className="h-7 w-7 dark:hidden" />
                <img src={l.icon.dark} alt="" className="hidden h-7 w-7 dark:block" />
              </span>
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
