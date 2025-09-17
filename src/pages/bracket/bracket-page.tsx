import { useMemo, useState } from "react";
// replace your lucide-react import with this:
import { Shuffle, Users, Trophy, Plus, X, Sparkles, RotateCcw, Medal, Share2 } from "lucide-react";


import { motion, AnimatePresence } from "framer-motion";

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
    const prev = bracket.rounds[r - 1]!;
    const roundR = bracket.rounds[r]!;
    for (let i = 0; i < roundR.matches.length; i++) {
      const sourceA = prev.matches[i * 2];
      const sourceB = prev.matches[i * 2 + 1];
      const m = roundR.matches[i];
      if (!m) continue;
      const oldP1 = m.p1;
      const oldP2 = m.p2;
      m.p1 = sourceA?.winner ?? null;
      m.p2 = sourceB?.winner ?? null;
      if (m.p1 !== oldP1 || m.p2 !== oldP2) {
        m.s1 = null; m.s2 = null;
        m.winner = (sourceA?.winner && !sourceB?.winner)
          ? sourceA!.winner!
          : (!sourceA?.winner && sourceB?.winner)
            ? sourceB!.winner!
            : null;
      }
    }
  }

  if (bracket.thirdPlace) {
    const semi = bracket.rounds.find(r => r.name.toLowerCase().includes("semi")) || null;
    if (semi) {
      const losers: (string | null)[] = [];
      for (const m of semi.matches) {
        if (m.s1 !== null && m.s2 !== null && m.p1 && m.p2) losers.push(m.s1 > m.s2 ? m.p2 : m.p1);
        else losers.push(null);
      }
      bracket.thirdPlace.p1 = losers[0] ?? null;
      bracket.thirdPlace.p2 = losers[1] ?? null;
      bracket.thirdPlace.s1 = null;
      bracket.thirdPlace.s2 = null;
      bracket.thirdPlace.winner = null;
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
  fourth: string | null;
  semifinalLosers: string[];
} {
  if (!b || b.rounds.length === 0) return { first: null, second: null, third: null, fourth: null, semifinalLosers: [] };
  const final = b.rounds[b.rounds.length - 1]?.matches?.[0];
  const first = final?.winner ?? null;
  let second: string | null = null;
  if (final && final.p1 && final.p2 && final.s1 !== null && final.s2 !== null) {
    second = first === final.p1 ? final.p2 : final.p1;
  }
  let third: string | null = null;
  let fourth: string | null = null;
  let semifinalLosers: string[] = [];
  const semi = b.rounds.find(r => r.name.toLowerCase().includes("semi")) || null;
  if (b.thirdPlace) {
    const tp = b.thirdPlace;
    if (tp && tp.p1 && tp.p2 && tp.s1 !== null && tp.s2 !== null) {
      third = tp.winner;
      fourth = third === tp.p1 ? tp.p2 : tp.p1;
    } else if (semi) {
      for (const m of semi.matches) {
        if (m.p1 && m.p2 && m.s1 !== null && m.s2 !== null) {
          semifinalLosers.push(m.s1 > m.s2 ? m.p2 : m.p1);
        }
      }
    }
  } else if (semi) {
    for (const m of semi.matches) {
      if (m.p1 && m.p2 && m.s1 !== null && m.s2 !== null) {
        semifinalLosers.push(m.s1 > m.s2 ? m.p2 : m.p1);
      }
    }
  }
  return { first, second, third, fourth, semifinalLosers };
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

  function setScore(rIdx: number, mIdx: number, s1: number | null, s2: number | null) {
    if (!bracket) return;
    const b = structuredClone(bracket) as Bracket;
    const match = b.rounds[rIdx]?.matches[mIdx];
    if (!match) return;
    const prevWinner = match.winner;
    match.s1 = s1; match.s2 = s2;
    if (s1 !== null && s2 !== null && match.p1 && match.p2) {
      match.winner = s1 === s2 ? prevWinner : (s1 > s2 ? match.p1 : match.p2);
    } else {
      match.winner = prevWinner;
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

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-5 md:space-y-6">
      <header className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-brand-dark via-brand to-brand-light text-white">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">FIFA Tournament Bracket</h1>
      <p className="mt-1 text-white/80">Quick single-elim tournaments for game night.</p>
    </div>

    <div className="shrink-0 flex flex-wrap items-center gap-2">
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={randomize}
        className="px-3 py-2 rounded-xl border border-white/20 hover:bg-white/10 inline-flex items-center gap-2 text-white/90"
        title="Shuffle players"
      >
        <Shuffle className="h-4 w-4" />
        Shuffle
      </motion.button>

      {/* Generate now matches the outline/glass style */}
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={buildBracket}
        className="px-3 py-2 rounded-xl border border-white/20 hover:bg-white/10 inline-flex items-center gap-2 text-white/90"
        title="Generate bracket"
      >
        <Sparkles className="h-4 w-4" />
        Generate
      </motion.button>

      {bracket && (
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={clearBracket}
          className="px-3 py-2 rounded-xl border border-white/20 hover:bg-white/10 inline-flex items-center gap-2 text-white/90"
          title="Clear bracket"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </motion.button>
      )}

      {/* High-contrast 3rd place toggle */}
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setWithThirdPlace(v => !v)}
        className={
          "px-3 py-2 rounded-xl inline-flex items-center gap-2 " +
          (withThirdPlace
            ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-1 ring-emerald-400/40 shadow-sm shadow-emerald-600/20"
            : "border border-white/20 hover:bg-white/10 text-white/90")
        }
        title="Toggle 3rd place match"
      >
        <Medal className="h-4 w-4" />
        3rd place match
      </motion.button>
    </div>
  </div>
</header>



      {/* Champion banner + share */}
      {(() => {
        const champ = getFinalWinner(bracket);
        if (!champ) return null;
        return (
          <div className="mb-4 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div className="text-sm"><span className="font-semibold">Champion:</span> {champ}</div>
            </div>
            <button
              onClick={async () => { if (bracket) { try { await navigator.clipboard.writeText(buildSummary(bracket)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} } }}
              className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {copied ? "Copied!" : (<span className="inline-flex items-center gap-2"><Share2 className="h-4 w-4" /> Share results</span>)}
            </button>
          </div>
        );
      })()}

      {/* Player entry + Standings */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4 md:p-5">
          <h2 className="mb-3 flex items-center gap-2 font-medium"><Users className="h-5 w-5" /> Players</h2>
          <PlayerList players={cleanPlayers} onAdd={addPlayer} onRemove={removePlayer} onPaste={pasteList} />
        </div>

        <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4 md:p-5">
          <StandingsPanel bracket={bracket} placements={placements} hasThird={withThirdPlace} />
        </div>
      </section>

      <section className="mt-6">
        {bracket ? (<BracketVertical bracket={bracket} setScore={setScore} resetScores={resetScores} />) : null}
      </section>
    </div>
  );
}

function StandingsPanel({ bracket, placements, hasThird }:{ bracket: Bracket | null; placements: ReturnType<typeof computePlacings>; hasThird: boolean; }) {
  if (!bracket) {
    return <div className="text-sm text-muted-foreground">Add players and click <span className="font-medium">Generate</span> to create a bracket.</div>;
  }
  const { first, second, third, fourth, semifinalLosers } = placements;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Standings (live)</h3>
      <ul className="text-sm space-y-1">
        <li>🥇 <span className="font-medium">1st:</span> {first ?? "—"}</li>
        <li>🥈 <span className="font-medium">2nd:</span> {second ?? "—"}</li>
        <li>🥉 <span className="font-medium">3rd:</span> {hasThird ? (third ?? "TBD") : (semifinalLosers.length ? "TBD" : "—")}</li>
        <li>🎗️ <span className="font-medium">4th:</span> {hasThird ? (fourth ?? "TBD") : (semifinalLosers.length ? "TBD" : "—")}</li>
      </ul>
      {!hasThird && semifinalLosers.length > 0 && (
        <div className="text-xs text-muted-foreground">Semifinalists: {semifinalLosers.join(", ")}</div>
      )}
    </div>
  );
}

function PlayerList({ players, onAdd, onRemove, onPaste }: { players: string[]; onAdd: (name: string) => void; onRemove: (idx: number) => void; onPaste: (raw: string) => void; }) {
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onAdd(name); setName(""); } }} className="flex-1 rounded-lg border px-3 py-2 text-sm bg-transparent" placeholder="Add player (e.g., Amer)" />
        <button onClick={() => { onAdd(name); setName(""); }} className="inline-flex items-center gap-2 rounded-lg bg-brand text-white px-3 py-2 text-sm hover:bg-brand/90"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <textarea placeholder="Or paste a list (comma or new lines)" className="rounded-lg border p-2 text-sm bg-transparent" rows={3} onPaste={(e) => { const txt = e.clipboardData.getData("text"); if (txt?.trim()) { e.preventDefault(); onPaste(txt); } }} />
      <motion.ul layout className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {players.map((p, i) => (
          <motion.li key={i} layout className="flex items-center justify-between rounded-lg border px-3 py-2" transition={{ type: "spring", stiffness: 500, damping: 40 }}>
            <span className="truncate">{p}</span>
            <button className="p-1 rounded-md hover:bg-muted" onClick={() => onRemove(i)} title="Remove"><X className="h-4 w-4" /></button>
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
        <div key={rIdx} className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4 md:p-5">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{round.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {round.matches.map((m, mIdx) => (
              <MatchCard key={m.id} match={m} onScore={(s1, s2) => setScore(rIdx, mIdx, s1, s2)} onReset={() => resetScores(rIdx, mIdx)} />
            ))}
          </div>
        </div>
      ))}

      {typeof bracket.thirdPlace !== "undefined" && (
        <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4 md:p-5">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">3rd Place</h3>
          {bracket.thirdPlace ? (
            <MatchCard match={bracket.thirdPlace} onScore={() => {}} onReset={() => {}} readOnly={!bracket.thirdPlace.p1 || !bracket.thirdPlace.p2} />
          ) : (
            <div className="text-sm text-muted-foreground">Decide semifinals to populate 3rd place.</div>
          )}
        </div>
      )}
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
    <div className={"relative rounded-2xl border p-3 md:p-4 shadow-sm hover:shadow-md transition " + (match.winner ? "ring-1 ring-brand" : "")}>
      {match.winner && (
        <AnimatePresence>
          <motion.div key={match.winner} initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0 rounded-2xl bg-brand pointer-events-none" />
        </AnimatePresence>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Match {match.id}</span>
        <button className="text-xs underline-offset-2 hover:underline" onClick={onReset} disabled={readOnly}>Clear</button>
      </div>
      <div className="grid grid-cols-[1fr,48px] items-center gap-2">
        <motion.div layout initial={false} className={"rounded-lg px-2 py-1 " + (match.winner === p1 ? "bg-brand/10 dark:bg-brand/20" : "bg-muted/50")}>
          <AnimatePresence mode="popLayout">
            <motion.div key={p1 || "empty1"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="truncate text-sm">{p1}</motion.div>
          </AnimatePresence>
        </motion.div>
        <input inputMode="numeric" pattern="[0-9]*" value={s1} onChange={(e) => setS1(e.target.value.replace(/\D+/g, ""))} onBlur={() => onScore(s1 === "" ? null : +s1, s2 === "" ? null : +s2)} className="w-12 rounded-md border px-2 py-1 text-sm text-center bg-transparent disabled:opacity-60" disabled={readOnly || !match.p1} placeholder="-" />
        <motion.div layout initial={false} className={"rounded-lg px-2 py-1 " + (match.winner === p2 ? "bg-brand/10 dark:bg-brand/20" : "bg-muted/50")}>
          <AnimatePresence mode="popLayout">
            <motion.div key={p2 || "empty2"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="truncate text-sm">{p2}</motion.div>
          </AnimatePresence>
        </motion.div>
        <input inputMode="numeric" pattern="[0-9]*" value={s2} onChange={(e) => setS2(e.target.value.replace(/\D+/g, ""))} onBlur={() => onScore(s1 === "" ? null : +s1, s2 === "" ? null : +s2)} className="w-12 rounded-md border px-2 py-1 text-sm text-center bg-transparent disabled:opacity-60" disabled={readOnly || !match.p2} placeholder="-" />
      </div>
    </div>
  );
}
