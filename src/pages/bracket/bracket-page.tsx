import { useMemo, useState } from "react";
import { Shuffle, Users, Trophy, Plus, X, Sparkles, RotateCcw, Medal, Share2 } from "lucide-react";


import { motion, AnimatePresence } from "framer-motion";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

type Match = {
  id: string;
  p1: string | null;
  p2: string | null;
  s1: number | null;
  s2: number | null;
  winner: string | null;
};

type Round = { name: string; matches: Match[] };
type Bracket = { rounds: Round[]; thirdPlace?: Match | null };

const STORAGE_KEY = "fifa-bracket";

function load(): { players: string[]; thirdPlace: boolean; bracket: Bracket | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { players: [], thirdPlace: false, bracket: null };
    return JSON.parse(raw);
  } catch {
    return { players: [], thirdPlace: false, bracket: null };
  }
}

function save(state: { players: string[]; thirdPlace: boolean; bracket: Bracket | null }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextPowerOfTwo(n: number) {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(1, n))));
}

function seedToRounds(seeds: string[], withThirdPlace: boolean): Bracket {
  const totalSlots = nextPowerOfTwo(seeds.length);
  const byes = totalSlots - seeds.length;
  const seeded: Array<string | null> = [...seeds];
  for (let i = 0; i < byes; i++) seeded.push(null);

  const pairings: Array<[string | null, string | null]> = [];
  for (let i = 0; i < totalSlots / 2; i++) pairings.push([seeded[i] ?? null, seeded[totalSlots - 1 - i] ?? null]);

  const roundNames: Record<number, string> = { 2: "Final", 4: "Semifinals", 8: "Quarterfinals", 16: "Round of 16", 32: "Round of 32" };

  const rounds: Round[] = [];
  rounds.push({
    name: roundNames[totalSlots] ?? `Round of ${totalSlots}`,
    matches: pairings.map((p, idx) => ({ id: `R1M${idx + 1}`, p1: p[0], p2: p[1], s1: null, s2: null, winner: p[0] === null ? p[1] : p[1] === null ? p[0] : null })),
  });

  let size = totalSlots / 2;
  let roundIndex = 2;
  while (size >= 2) {
    const prev = rounds[rounds.length - 1]!;
    const matches: Match[] = [];
    for (let i = 0; i < size / 2; i++) {
      const a = prev.matches[i * 2]?.winner ?? null;
      const b = prev.matches[i * 2 + 1]?.winner ?? null;
      matches.push({ id: `R${roundIndex}M${i + 1}`, p1: a, p2: b, s1: null, s2: null, winner: a && !b ? a : b && !a ? b : null });
    }
    rounds.push({ name: roundNames[size] ?? (size === 1 ? "Final" : `Round of ${size}`), matches });
    size = size / 2;
    roundIndex++;
  }

  const thirdPlace: Match | null = withThirdPlace ? { id: "ThirdPlace", p1: null, p2: null, s1: null, s2: null, winner: null } : null;
  return { rounds, thirdPlace };
}

function updateAdvancement(bracket: Bracket) {
  for (let r = 1; r < bracket.rounds.length; r++) {
    const prevRound = bracket.rounds[r - 1];
    const round = bracket.rounds[r];
    if (!prevRound || !round) continue;
    for (let i = 0; i < round.matches.length; i++) {
      const match = round.matches[i];
      if (!match) continue;
      const sourceA = prevRound.matches[i * 2] ?? null;
      const sourceB = prevRound.matches[i * 2 + 1] ?? null;
      const nextP1 = sourceA?.winner ?? null;
      const nextP2 = sourceB?.winner ?? null;
      const changed = match.p1 !== nextP1 || match.p2 !== nextP2;
      match.p1 = nextP1;
      match.p2 = nextP2;
      if (changed) {
        match.s1 = null;
        match.s2 = null;
      }
      if (match.p1 && !match.p2) {
        match.winner = match.p1;
      } else if (!match.p1 && match.p2) {
        match.winner = match.p2;
      } else if (match.p1 && match.p2 && match.s1 !== null && match.s2 !== null && match.s1 !== match.s2) {
        match.winner = match.s1 > match.s2 ? match.p1 : match.p2;
      } else if (!match.p1 && !match.p2) {
        match.winner = null;
      } else if (changed) {
        match.winner = null;
      }
    }
  }

  if (bracket.thirdPlace) {
    const semiRound = bracket.rounds.length >= 2 ? bracket.rounds[bracket.rounds.length - 2] ?? null : null;
    const losers: (string | null)[] = [];
    if (semiRound) {
      for (const match of semiRound.matches) {
        if (match.p1 && match.p2 && match.winner) {
          losers.push(match.winner === match.p1 ? match.p2! : match.p1!);
        } else if (match.p1 && match.p2 && match.s1 !== null && match.s2 !== null && match.s1 !== match.s2) {
          losers.push(match.s1 > match.s2 ? match.p2! : match.p1!);
        } else {
          losers.push(null);
        }
      }
    }

    const tp = bracket.thirdPlace;
    const nextP1 = losers[0] ?? null;
    const nextP2 = losers[1] ?? null;
    const participantsChanged = tp.p1 !== nextP1 || tp.p2 !== nextP2;
    tp.p1 = nextP1;
    tp.p2 = nextP2;
    if (participantsChanged) {
      tp.s1 = null;
      tp.s2 = null;
      tp.winner = null;
    } else if (tp.p1 && tp.p2 && tp.s1 !== null && tp.s2 !== null && tp.s1 !== tp.s2) {
      tp.winner = tp.s1 > tp.s2 ? tp.p1 : tp.p2;
    } else if (!tp.p1 || !tp.p2) {
      tp.winner = null;
    }
  }
}

function getFinalWinner(b: Bracket | null): string | null {
  if (!b || b.rounds.length === 0) return null;
  const finalMatch = b.rounds[b.rounds.length - 1]?.matches?.[0];
  return finalMatch?.winner ?? null;
}

function buildSummary(b: Bracket): string {
  const lines: string[] = [];
  for (let r = 0; r < b.rounds.length; r++) {
    const round = b.rounds[r];
    if (!round) continue;
    lines.push(`# ${round.name}`);
    for (const m of round.matches) {
      const p1 = m.p1 ?? "—";
      const p2 = m.p2 ?? "—";
      const s1 = m.s1 ?? "-";
      const s2 = m.s2 ?? "-";
      const res = (m.s1 !== null && m.s2 !== null && m.p1 && m.p2) ? ` → ${m.winner}` : "";
      lines.push(`${p1} ${s1} – ${s2} ${p2}${res}`);
    }
    lines.push("");
  }
  const champion = getFinalWinner(b);
  if (champion) lines.push(`🏆 Champion: ${champion}`);
  return lines.join("\n");
}

function computePlacings(b: Bracket | null): {
  first: string | null;
  second: string | null;
  third: string | null;
  semifinalLosers: string[];
} {
  if (!b || b.rounds.length === 0) {
    return { first: null, second: null, third: null, semifinalLosers: [] };
  }

  const final = b.rounds[b.rounds.length - 1]?.matches?.[0];
  const first = final?.winner ?? null;

  let second: string | null = null;
  if (final && final.p1 && final.p2) {
    if (final.s1 !== null && final.s2 !== null && final.s1 !== final.s2) {
      second = final.s1 > final.s2 ? final.p2 : final.p1;
    } else if (final.winner) {
      second = final.winner === final.p1 ? final.p2 : final.p1;
    }
  }

  const semiRound = b.rounds.length >= 2 ? b.rounds[b.rounds.length - 2] ?? null : null;
  const semifinalLosers: string[] = [];
  if (semiRound) {
    for (const match of semiRound.matches) {
      if (match.p1 && match.p2 && match.winner) {
        semifinalLosers.push(match.winner === match.p1 ? match.p2! : match.p1!);
      } else if (match.p1 && match.p2 && match.s1 !== null && match.s2 !== null && match.s1 !== match.s2) {
        semifinalLosers.push(match.s1 > match.s2 ? match.p2! : match.p1!);
      }
    }
  }

  let third: string | null = null;
  if (b.thirdPlace) {
    const tp = b.thirdPlace;
    if (tp && tp.p1 && tp.p2 && tp.s1 !== null && tp.s2 !== null && tp.s1 !== tp.s2) {
      third = tp.s1 > tp.s2 ? tp.p1 : tp.p2;
    }
  }

  return { first, second, third, semifinalLosers };
}

export default function Bracket() {
  const snapshot = load();
  const [players, setPlayers] = useState<string[]>(snapshot.players ?? []);
  const [withThirdPlace, setWithThirdPlace] = useState<boolean>(snapshot.thirdPlace ?? false);
  const [bracket, setBracket] = useState<Bracket | null>(snapshot.bracket);
  /* layout removed */
  const [copied, setCopied] = useState(false);

  function persist(next: Partial<{ players: string[]; thirdPlace: boolean; bracket: Bracket | null }>) {
    const s = { players, thirdPlace: withThirdPlace, bracket, ...next };
    save(s as any);
  }

  const cleanPlayers = useMemo(() => players.map(p => p.trim()).filter(Boolean), [players]);

  function addPlayer(name: string) {
    if (!name.trim()) return;
    const next = [...cleanPlayers, name.trim()];
    setPlayers(next); persist({ players: next });
  }
  function removePlayer(idx: number) {
    const next = cleanPlayers.filter((_, i) => i !== idx);
    setPlayers(next); persist({ players: next });
  }
  function randomize() {
    const arr = [...cleanPlayers];
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = arr[i]!; arr[i] = arr[j]!; arr[j] = tmp; }
    setPlayers(arr); persist({ players: arr });
  }
  function buildBracket() {
    if (cleanPlayers.length < 2) return;
    const b = seedToRounds(cleanPlayers, withThirdPlace);
    setBracket(b); persist({ bracket: b, thirdPlace: withThirdPlace });
  }
  function clearBracket() { setBracket(null); persist({ bracket: null }); }

  function toggleThirdPlace() {
    const next = !withThirdPlace;
    setWithThirdPlace(next);
    let updated: Bracket | null = bracket;
    if (bracket) {
      const clone = structuredClone(bracket) as Bracket;
      clone.thirdPlace = next
        ? clone.thirdPlace ?? { id: "ThirdPlace", p1: null, p2: null, s1: null, s2: null, winner: null }
        : null;
      if (next) {
        updateAdvancement(clone);
      }
      updated = clone;
      setBracket(clone);
    }
    persist({ thirdPlace: next, bracket: updated });
  }

  function setScore(rIdx: number, mIdx: number, s1: number | null, s2: number | null) {
    if (!bracket) return;
    const b = structuredClone(bracket) as Bracket;
    const match = b.rounds[rIdx]?.matches[mIdx];
    if (!match) return;
    match.s1 = s1; match.s2 = s2;
    if (match.p1 && !match.p2) {
      match.winner = match.p1;
    } else if (!match.p1 && match.p2) {
      match.winner = match.p2;
    } else if (match.p1 && match.p2 && s1 !== null && s2 !== null) {
      match.winner = s1 === s2 ? null : s1 > s2 ? match.p1 : match.p2;
    } else if (!match.p1 || !match.p2) {
      match.winner = null;
    }
    updateAdvancement(b);
    setBracket(b); persist({ bracket: b });
  }
  function resetScores(rIdx: number, mIdx: number) {
    if (!bracket) return;
    const b = structuredClone(bracket) as Bracket;
    const match = b.rounds[rIdx]?.matches[mIdx];
    if (!match) return;
    match.s1 = null; match.s2 = null; match.winner = null;
    updateAdvancement(b);
    setBracket(b); persist({ bracket: b });
  }
  function pasteList(raw: string) {
    const tokens = raw.split(/[\n,]+/g).map(s => s.trim()).filter(Boolean);
    const deduped = Array.from(new Set([...cleanPlayers, ...tokens]));
    setPlayers(deduped); persist({ players: deduped });
  }

  const placements = computePlacings(bracket);

  const playerCount = cleanPlayers.length;
  const roundsCount = bracket?.rounds.length ?? 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6">
      <PageHero
        icon="🏆"
        title="Tournament Bracket Generator"
        description="Quick single-elimination brackets for friends, roommates, and weekend tournaments."
        stats={
          <>
            <StatPill>Players · {playerCount}</StatPill>
            <StatPill>Rounds · {roundsCount || "—"}</StatPill>
            <StatPill>{withThirdPlace ? "3rd place on" : "Winner takes all"}</StatPill>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={randomize}
              type="button"
              className={cn(buttonStyles({ variant: "secondary", size: "sm" }), "rounded-brand-full")}
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={buildBracket}
              type="button"
              className={cn(buttonStyles({ variant: "secondary", size: "sm" }), "rounded-brand-full")}
            >
              <Sparkles className="h-4 w-4" /> Generate
            </motion.button>
            {bracket ? (
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={clearBracket}
                type="button"
                className={cn(buttonStyles({ variant: "secondary", size: "sm" }), "rounded-brand-full")}
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </motion.button>
            ) : null}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleThirdPlace}
              type="button"
              className={cn(
                buttonStyles({ variant: "secondary", size: "sm" }),
                "rounded-brand-full",
                withThirdPlace ? "ring-2 ring-emerald-400/70" : undefined
              )}
            >
              <Medal className="h-4 w-4" /> {withThirdPlace ? "3rd place on" : "Enable 3rd place"}
            </motion.button>
          </div>
        }
      />

      {/* Champion banner + share */}
      {(() => {
        const champ = getFinalWinner(bracket);
        if (!champ) return null;
        return (
          <Card padding="lg" className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-xl">🏆</span>
              <div>
                <span className="font-semibold">Champion:</span> {champ}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (bracket) {
                  try {
                    await navigator.clipboard.writeText(buildSummary(bracket));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {}
                }
              }}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {copied ? "Copied!" : (
                <span className="inline-flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Share results
                </span>
              )}
            </button>
          </Card>
        );
      })()}

      {/* Player entry + Standings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PageSection
          title={
            <span className="inline-flex items-center gap-2">
              <Users className="h-5 w-5" /> Players
            </span>
          }
          description="Add entrants manually or paste a list to seed the bracket."
        >
          <PlayerList players={cleanPlayers} onAdd={addPlayer} onRemove={removePlayer} onPaste={pasteList} />
        </PageSection>

        <PageSection
          title="Standings"
          description="Placements update automatically as you enter results."
        >
          <StandingsPanel bracket={bracket} placements={placements} hasThird={withThirdPlace} />
        </PageSection>
      </div>

      {bracket ? (
        <PageSection
          title="Bracket"
          description="Update scores and watch winners flow through each round."
          contentClassName="p-0"
        >
          <div className="p-4">
            <BracketVertical bracket={bracket} setScore={setScore} resetScores={resetScores} />
          </div>
        </PageSection>
      ) : null}
    </div>
  );
}

function StandingsPanel({ bracket, placements, hasThird }:{ bracket: Bracket | null; placements: ReturnType<typeof computePlacings>; hasThird: boolean; }) {
  if (!bracket) {
    return (
      <p className="text-sm text-brand-muted dark:text-brand-subtle">
        Add players and click <span className="font-medium text-brand-strong">Generate</span> to create a bracket.
      </p>
    );
  }
  const { first, second, third, semifinalLosers } = placements;
  const awaitingThird = hasThird && !third && semifinalLosers.length >= 2;
  const thirdLabel = hasThird
    ? third ?? (awaitingThird ? `${semifinalLosers[0]} vs ${semifinalLosers[1]}` : "TBD")
    : semifinalLosers.length
      ? semifinalLosers.join(" & ")
      : "—";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-brand-muted dark:text-brand-subtle">Standings (live)</h3>
      <ul className="space-y-2 text-sm text-brand-strong dark:text-white">
        <li className="flex items-center justify-between rounded-brand-full border border-border-light/60 bg-white/80 px-3 py-2 shadow-brand-sm backdrop-blur-sm dark:border-border-dark/60 dark:bg-white/10">
          <span className="inline-flex items-center gap-2 font-medium"><span>🥇</span> Champion</span>
          <span>{first ?? "—"}</span>
        </li>
        <li className="flex items-center justify-between rounded-brand-full border border-border-light/60 bg-white/80 px-3 py-2 shadow-brand-sm backdrop-blur-sm dark:border-border-dark/60 dark:bg-white/10">
          <span className="inline-flex items-center gap-2 font-medium"><span>🥈</span> 2nd Place</span>
          <span>{second ?? "—"}</span>
        </li>
        <li className="flex items-center justify-between rounded-brand-full border border-border-light/60 bg-white/80 px-3 py-2 shadow-brand-sm backdrop-blur-sm dark:border-border-dark/60 dark:bg-white/10">
          <span className="inline-flex items-center gap-2 font-medium"><span>🥉</span> 3rd Place</span>
          <span>{thirdLabel}</span>
        </li>
      </ul>
      {semifinalLosers.length > 0 && (
        <div className="rounded-brand border border-dashed border-brand/30 bg-brand/5 px-3 py-2 text-xs uppercase tracking-[0.28em] text-brand-muted dark:border-white/20 dark:bg-white/5">
          Semifinalists: {semifinalLosers.join(" · ")}
        </div>
      )}
    </div>
  );
}

function PlayerList({ players, onAdd, onRemove, onPaste }: { players: string[]; onAdd: (name: string) => void; onRemove: (idx: number) => void; onPaste: (raw: string) => void; }) {
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAdd(name);
              setName("");
            }
          }}
          className="flex-1 rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-subtle/80 dark:bg-surface-overlayDark dark:text-brand-foreground dark:placeholder:text-brand-subtle"
          placeholder="Add player (e.g., Amer)"
        />
        <button
          type="button"
          onClick={() => {
            onAdd(name);
            setName("");
          }}
          className={buttonStyles({ size: "sm" })}
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <textarea
        placeholder="Or paste a list (comma or new lines)"
        className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-subtle/80 dark:bg-surface-overlayDark dark:text-brand-foreground dark:placeholder:text-brand-subtle"
        rows={3}
        onPaste={(e) => {
          const txt = e.clipboardData.getData("text");
          if (txt?.trim()) {
            e.preventDefault();
            onPaste(txt);
          }
        }}
      />
      <motion.ul layout className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {players.map((p, i) => (
          <motion.li
            key={i}
            layout
            className="flex items-center justify-between rounded-brand border border-border-light bg-surface px-3 py-2 text-sm shadow-brand-sm dark:bg-surface-overlayDark"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          >
            <span className="truncate text-brand-strong dark:text-white">{p}</span>
            <button
              type="button"
              className="rounded-brand-full p-1 text-brand-muted transition hover:bg-brand/10 hover:text-brand dark:text-brand-subtle dark:hover:text-brand-foreground"
              onClick={() => onRemove(i)}
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
/** Vertical layout (stacked rounds, simple grid) */
function BracketVertical({ bracket, setScore, resetScores }: { bracket: Bracket; setScore: (rIdx: number, mIdx: number, s1: number | null, s2: number | null) => void; resetScores: (rIdx: number, mIdx: number) => void; }) {
  return (
    <div className="space-y-6">
      {bracket.rounds.map((round, rIdx) => (
        <div
          key={rIdx}
          className="relative overflow-hidden rounded-[1.75rem] border border-border-light/60 bg-white/90 p-4 shadow-brand-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-border-dark/60 dark:bg-white/5 md:p-5"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
            style={{
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.12), transparent 45%), radial-gradient(circle at 90% 10%, rgba(14,165,233,0.18), transparent 60%)",
            }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-muted dark:text-white/60">
              {round.name}
            </h3>
            <span className="rounded-brand-full border border-brand/10 bg-brand/5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.32em] text-brand-muted dark:border-white/10 dark:bg-white/5">
              Round {rIdx + 1}
            </span>
          </div>
          <div className="relative mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {round.matches.map((m, mIdx) => (
              <MatchCard key={m.id} match={m} onScore={(s1, s2) => setScore(rIdx, mIdx, s1, s2)} onReset={() => resetScores(rIdx, mIdx)} />
            ))}
          </div>
        </div>
      ))}

      {bracket.thirdPlace ? (
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border-light/60 bg-white/90 p-4 shadow-brand-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-border-dark/60 dark:bg-white/5 md:p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
            style={{
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.14), transparent 45%), radial-gradient(circle at 10% 10%, rgba(56,189,248,0.16), transparent 60%)",
            }}
          />
          <h3 className="relative mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-brand-muted dark:text-white/60">
            3rd Place Match
          </h3>
          {bracket.thirdPlace.p1 && bracket.thirdPlace.p2 ? (
            <MatchCard match={bracket.thirdPlace} onScore={() => {}} onReset={() => {}} readOnly={!bracket.thirdPlace.p1 || !bracket.thirdPlace.p2} />
          ) : (
            <div className="text-sm text-brand-muted dark:text-brand-subtle">Decide semifinals to populate 3rd place.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MatchCard({ match, onScore, onReset, readOnly }: { match: Match; onScore: (s1: number | null, s2: number | null) => void; onReset: () => void; readOnly?: boolean; }) {
  const [s1, setS1] = useState<string>(match.s1?.toString() ?? "");
  const [s2, setS2] = useState<string>(match.s2?.toString() ?? "");

  const snapshot = JSON.stringify([match.s1, match.s2, match.p1, match.p2, match.winner]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _ = useMemo(() => { setS1(match.s1?.toString() ?? ""); setS2(match.s2?.toString() ?? ""); return null; }, [snapshot]);

  const p1 = match.p1 ?? "—";
  const p2 = match.p2 ?? "—";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-border-light/60 bg-white/85 p-3 text-sm shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-border-dark/60 dark:bg-white/10 md:p-4",
        match.winner ? "ring-1 ring-brand/60" : null
      )}
    >
      {match.winner && (
        <AnimatePresence>
          <motion.div
            key={match.winner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.16 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-brand"
          />
        </AnimatePresence>
      )}
      <div className="relative mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-white/60">
          Match {match.id}
        </span>
        <button
          className="text-xs font-medium text-brand-muted underline-offset-2 transition hover:text-brand hover:underline disabled:opacity-40 dark:text-brand-subtle dark:hover:text-brand-foreground"
          onClick={onReset}
          disabled={readOnly}
        >
          Clear
        </button>
      </div>
      <div className="relative grid grid-cols-[1fr,3.25rem] items-center gap-2">
        <motion.div
          layout
          initial={false}
          className={cn(
            "rounded-brand-lg border px-3 py-2 text-left shadow-brand-sm",
            match.winner === p1
              ? "border-brand/40 bg-brand/10 text-brand-strong dark:border-brand/60 dark:bg-brand/25 dark:text-white"
              : "border-border-light/60 bg-white/70 text-brand-strong dark:border-border-dark/60 dark:bg-white/5 dark:text-white"
          )}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={p1 || "empty1"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="truncate"
            >
              {p1}
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={s1}
          onChange={(e) => setS1(e.target.value.replace(/\D+/g, ""))}
          onBlur={() => onScore(s1 === "" ? null : +s1, s2 === "" ? null : +s2)}
          className="h-11 rounded-brand-lg border border-border-light/70 bg-white/90 px-3 text-center text-base font-semibold text-brand-strong shadow-brand-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-50 dark:border-border-dark/60 dark:bg-white/10 dark:text-white"
          disabled={readOnly || !match.p1}
          placeholder="-"
        />
        <motion.div
          layout
          initial={false}
          className={cn(
            "rounded-brand-lg border px-3 py-2 text-left shadow-brand-sm",
            match.winner === p2
              ? "border-brand/40 bg-brand/10 text-brand-strong dark:border-brand/60 dark:bg-brand/25 dark:text-white"
              : "border-border-light/60 bg-white/70 text-brand-strong dark:border-border-dark/60 dark:bg-white/5 dark:text-white"
          )}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={p2 || "empty2"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="truncate"
            >
              {p2}
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={s2}
          onChange={(e) => setS2(e.target.value.replace(/\D+/g, ""))}
          onBlur={() => onScore(s1 === "" ? null : +s1, s2 === "" ? null : +s2)}
          className="h-11 rounded-brand-lg border border-border-light/70 bg-white/90 px-3 text-center text-base font-semibold text-brand-strong shadow-brand-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-50 dark:border-border-dark/60 dark:bg-white/10 dark:text-white"
          disabled={readOnly || !match.p2}
          placeholder="-"
        />
      </div>
      {match.winner ? (
        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.32em] text-brand-muted dark:text-white/60">
          Winner: {match.winner}
        </div>
      ) : null}
    </div>
  );
}
