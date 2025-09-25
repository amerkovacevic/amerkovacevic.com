import { Link } from "react-router-dom";

import { PageHero, PageSection } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { cn } from "../../shared/lib/classnames";
import { GAME_LIBRARY } from "./game-library";

export default function GamesLandingPage() {
  const games = [...GAME_LIBRARY];
  const featuredGame = games[0];

  return (
    <div className="space-y-10">
      <PageHero
        icon="🎮"
        title="Build your own party night"
        description="Mix and match quick-thinking challenges, deduction puzzles, and vocabulary showdowns. Each mini game loads instantly so you can keep the momentum going."
        stats={
          <>
            <span>{games.length} games live</span>
            <span>New drops weekly</span>
            <span>Optimized for instant play</span>
          </>
        }
        actions={
          featuredGame ? (
            <Link
              to={`/tools/games/${featuredGame.id}`}
              className={buttonStyles({ variant: "secondary" })}
            >
              Jump into {featuredGame.name}
            </Link>
          ) : null
        }
      />

      <PageSection
        title="Featured launch set"
        description="Jump into a curated starter pack designed for quick rotation. Each game takes just a few minutes, making it perfect for warm-ups, classroom brain breaks, or remote team icebreakers."
        contentClassName="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </PageSection>
    </div>
  );
}

function GameCard({ game }: { game: (typeof GAME_LIBRARY)[number] }) {
  return (
    <Link
      to={`/tools/games/${game.id}`}
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-brand-xl border border-border-light/70 bg-surface p-6 text-left text-brand-strong shadow-brand-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand",
        "dark:border-border-dark/80 dark:bg-surface-muted dark:text-brand-foreground"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-brand-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-[1.4rem] bg-white/90 text-3xl shadow-brand-sm ring-1 ring-border-light transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 dark:bg-white/10 dark:text-brand-foreground">
          {game.emoji}
        </span>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{game.name}</h3>
          <p className="text-sm text-brand-muted dark:text-brand-subtle">{game.summary}</p>
        </div>
      </div>
      <div className="relative mt-auto flex flex-wrap gap-2 text-xs text-brand-muted dark:text-brand-subtle">
        <span className="rounded-full bg-white/70 px-3 py-1 font-medium uppercase tracking-wide text-brand-strong shadow-sm dark:bg-white/5 dark:text-brand-foreground">
          {game.estTime}
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 font-medium uppercase tracking-wide text-brand-strong shadow-sm dark:bg-white/5 dark:text-brand-foreground">
          {game.players}
        </span>
        {game.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border-light/80 bg-white/70 px-3 py-1 font-medium uppercase tracking-wide text-brand-muted dark:border-border-dark/80 dark:bg-surface-muted/70 dark:text-brand-subtle"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
