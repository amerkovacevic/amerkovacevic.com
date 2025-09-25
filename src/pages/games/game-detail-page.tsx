import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHero, PageSection } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { cn } from "../../shared/lib/classnames";
import { GAME_COMPONENTS, GAME_LIBRARY, getGameMeta } from "./game-library";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const meta = getGameMeta(gameId);

  if (!meta) {
    return (
      <div className="space-y-6">
        <PageHero
          icon="😕"
          title="We couldn’t find that game"
          description="The game you tried to open doesn’t exist yet. Head back to the library to explore the growing collection."
          actions={
            <Link to="/tools/games" className={buttonStyles({ variant: "secondary" })}>
              Browse game library
            </Link>
          }
        />
      </div>
    );
  }

  const GameComponent = GAME_COMPONENTS[meta.id];
  const otherGames = GAME_LIBRARY.filter((game) => game.id !== meta.id);

  return (
    <div className="space-y-10">
      <PageHero
        icon={meta.emoji}
        title={meta.name}
        description={meta.highlight}
        stats={
          <>
            <span>{meta.estTime} avg</span>
            <span>{meta.players}</span>
            <span>{meta.tags.join(" • ")}</span>
          </>
        }
        actions={
          <div className="flex gap-3">
            <Link to="/tools/games" className={buttonStyles({ variant: "secondary" })}>
              Back to library
            </Link>
            {otherGames[0] ? (
              <Link to={`/tools/games/${otherGames[0].id}`} className={buttonStyles({ variant: "ghost" })}>
                Next up: {otherGames[0].name}
              </Link>
            ) : null}
          </div>
        }
      />

      <PageSection title="Play now" description={meta.summary}>
        <Suspense fallback={<GameLoadingState name={meta.name} />}>
          <GameComponent key={meta.id} />
        </Suspense>
      </PageSection>

      {otherGames.length ? (
        <PageSection
          title="More quick challenges"
          description="Rotate to a different game to keep the energy high and give everyone a new skill test."
          contentClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {otherGames.map((game) => (
            <Link
              key={game.id}
              to={`/tools/games/${game.id}`}
              className={cn(
                "group relative flex h-full flex-col gap-3 rounded-brand-lg border border-border-light/70 bg-surface p-5 text-left text-brand-strong shadow-brand-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand",
                "dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground"
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-brand-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              <div className="relative flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-[1.25rem] bg-white/90 text-2xl shadow-brand-sm ring-1 ring-border-light transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 dark:bg-white/10 dark:text-brand-foreground">
                  {game.emoji}
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">{game.name}</h3>
                  <p className="text-sm text-brand-muted dark:text-brand-subtle">{game.summary}</p>
                </div>
              </div>
              <div className="relative mt-auto flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-brand-muted dark:text-brand-subtle">
                <span>{game.estTime}</span>
                <span>{game.players}</span>
              </div>
            </Link>
          ))}
        </PageSection>
      ) : null}
    </div>
  );
}

function GameLoadingState({ name }: { name: string }) {
  return (
    <div className="grid place-items-center rounded-brand-lg border border-dashed border-border-light/80 bg-surface/60 px-6 py-16 text-brand-muted dark:border-border-dark/70 dark:bg-surface-muted/70 dark:text-brand-subtle">
      Loading {name}…
    </div>
  );
}
