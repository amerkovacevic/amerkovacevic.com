import { lazy, type LazyExoticComponent } from "react";

export type GameId =
  | "emoji-riddle"
  | "synonym-match"
  | "twenty-four"
  | "codebreaker";

export type GameMeta = {
  id: GameId;
  name: string;
  emoji: string;
  summary: string;
  highlight: string;
  estTime: string;
  players: string;
  tags: string[];
};

export type GameComponent = () => JSX.Element | null;

export const GAME_LIBRARY: GameMeta[] = [
  {
    id: "emoji-riddle",
    name: "Emoji Riddle",
    emoji: "🧠",
    summary: "Decode the hidden word or phrase using nothing but emojis.",
    highlight: "Quick-hit visual wordplay great for warm-ups and icebreakers.",
    estTime: "2 min",
    players: "Solo or group",
    tags: ["word", "party", "family"],
  },
  {
    id: "synonym-match",
    name: "Synonym Match",
    emoji: "🔤",
    summary: "Pick the true synonym from four deceptively close options.",
    highlight: "Build vocabulary depth with rapid-fire multiple choice rounds.",
    estTime: "3 min",
    players: "Solo or pair",
    tags: ["vocabulary", "brain", "classroom"],
  },
  {
    id: "twenty-four",
    name: "24 Game",
    emoji: "24️⃣",
    summary: "Combine all four digits with math operations to land exactly on 24.",
    highlight: "Test arithmetic creativity with tactile drag-and-drop style play.",
    estTime: "4 min",
    players: "Solo or head-to-head",
    tags: ["math", "logic", "speed"],
  },
  {
    id: "codebreaker",
    name: "Codebreaker",
    emoji: "🕵️",
    summary: "Crack the secret 4-digit code before your attempts run out.",
    highlight: "Mastermind-inspired deduction with instant feedback on every guess.",
    estTime: "5 min",
    players: "Solo or team",
    tags: ["logic", "deduction", "strategy"],
  },
];

const emojiRiddle = lazy(() => import("./emoji-riddle-game").then((m) => ({ default: m.EmojiRiddleGame })));
const synonymMatch = lazy(() => import("./synonym-match-game").then((m) => ({ default: m.SynonymMatchGame })));
const twentyFour = lazy(() => import("./twenty-four-game").then((m) => ({ default: m.TwentyFourGame })));
const codebreaker = lazy(() => import("./codebreaker-game").then((m) => ({ default: m.CodebreakerGame })));

export const GAME_COMPONENTS: Record<GameId, LazyExoticComponent<GameComponent>> = {
  "emoji-riddle": emojiRiddle,
  "synonym-match": synonymMatch,
  "twenty-four": twentyFour,
  codebreaker,
};

export function getGameMeta(id: string | undefined): GameMeta | undefined {
  return GAME_LIBRARY.find((game) => game.id === id);
}
