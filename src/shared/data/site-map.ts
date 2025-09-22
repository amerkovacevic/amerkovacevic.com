export type SiteLink = {
  id: string;
  name: string;
  to: string;
  blurb: string;
  emoji: string;
};

export const TOOL_LINKS: SiteLink[] = [
  {
    id: "pickup",
    name: "Pickup Soccer",
    to: "/tools/pickup",
    blurb: "Post games, RSVP in one click, see spots left.",
    emoji: "⚽️",
  },
  {
    id: "santa",
    name: "Secret Santa",
    to: "/tools/santa",
    blurb: "Create a group, invite by code, auto-assign matches.",
    emoji: "🎅",
  },
  {
    id: "fm",
    name: "FM Team Draw",
    to: "/tools/fm",
    blurb: "Randomly assign Football Manager teams to your group.",
    emoji: "🎮",
  },
  {
    id: "ultimate-team",
    name: "Ultimate Team Utility",
    to: "/tools/ultimate-team",
    blurb: "Build squads, solve SBCs, and optimize evolutions.",
    emoji: "⭐️",
  },
  {
    id: "bracket",
    name: "Bracket Generator",
    to: "/tools/bracket",
    blurb: "Create and manage tournament brackets.",
    emoji: "🏆",
  },
];

export const PROFESSIONAL_LINKS: SiteLink[] = [
  {
    id: "portfolio",
    name: "Web Portfolio",
    to: "/professional/portfolio",
    blurb: "See bespoke marketing sites and product storytelling work.",
    emoji: "🖥️",
  },
  {
    id: "links",
    name: "Contact",
    to: "/professional/links",
    blurb: "Reach me anywhere from one tidy home for every profile.",
    emoji: "🔗",
  },
  {
    id: "start-a-project",
    name: "Start a Project",
    to: "/professional/start-a-project",
    blurb: "Kick off a build with discovery, scoping, and a tailored plan.",
    emoji: "🚀",
  },
];

export const ALL_LINKS: SiteLink[] = [...TOOL_LINKS, ...PROFESSIONAL_LINKS];
