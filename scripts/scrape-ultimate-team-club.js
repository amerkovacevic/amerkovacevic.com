#!/usr/bin/env node
/**
 * Experimental scraper for EA FC Ultimate Team Web App club data.
 *
 * Usage:
 *   FUT_COOKIE="<copy from browser>" \
 *   FUT_X_UT_SID="<value from network call headers>" \
 *   FUT_PHISHING_TOKEN="<value from network call headers>" \
 *   node scripts/scrape-ultimate-team-club.js --persona 123456 --route=utas --locale=en-GB --output src/data/ultimate-team/club.json
 *
 * Required tooling:
 *   - Node.js 18+ (for global fetch)
 *
 * Notes:
 *   - The script does not automate login. You must authenticate in the
 *     browser and copy the required headers/cookies from any authenticated
 *     request made by the EA FC Web App (e.g. `https://utas.mob.v1...`).
 *   - `--route` should match the value you see in the `X-UT-Route` header
 *     (common examples: `utas`, `utas-m`).
 *   - The EA endpoints are unofficial and may change without notice.
 *   - Keep your credentials secure. Never commit the resulting JSON file if
 *     it contains personal data.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FUT_BASE_URL = process.env.FUT_BASE_URL?.replace(/\/$/, "") ?? "https://utas.mob.v1.fut.ea.com/ut/game/fc24";
const FUT_COOKIE = process.env.FUT_COOKIE;
const FUT_X_UT_SID = process.env.FUT_X_UT_SID;
const FUT_PHISHING_TOKEN = process.env.FUT_PHISHING_TOKEN;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, value = "true"] = arg.slice(2).split("=");
      out[key] = value;
    }
  }
  return out;
}

function assertEnv() {
  const missing = [];
  if (!FUT_COOKIE) missing.push("FUT_COOKIE");
  if (!FUT_X_UT_SID) missing.push("FUT_X_UT_SID");
  if (!FUT_PHISHING_TOKEN) missing.push("FUT_PHISHING_TOKEN");
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

function buildHeaders({ route }) {
  return {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36", // mimic browser
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-UT-SID": FUT_X_UT_SID,
    "X-UT-PHISHING-TOKEN": FUT_PHISHING_TOKEN,
    "X-UT-Embed-Error": "true",
    "X-UT-Route": route,
    Cookie: FUT_COOKIE,
    Referer: "https://www.ea.com/en-gb/ea-sports-fc/ultimate-team/web-app/",
    Origin: "https://www.ea.com",
  };
}

async function fetchJson(pathname, { route }) {
  const url = `${FUT_BASE_URL}${pathname}`;
  const res = await fetch(url, {
    headers: buildHeaders({ route }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed for ${url}: HTTP ${res.status} ${res.statusText}\n${text}`);
  }
  return res.json();
}

async function fetchClubData({ persona, route, localeCode }) {
  if (!persona) {
    throw new Error("--persona is required (EA Nucleus Persona ID).");
  }

  const [club, squads, pile, locale] = await Promise.all([
    fetchJson(`/club?personaId=${persona}`, { route }),
    fetchJson(`/club/squad?personaId=${persona}`, { route }).catch((err) => {
      console.warn("[warn] squad endpoint failed:", err.message);
      return null;
    }),
    fetchJson(`/club/pile?pile=club&personaId=${persona}`, { route }),
    localeCode ? fetchJson(`/locale/${localeCode}`, { route }).catch(() => null) : null,
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    baseUrl: FUT_BASE_URL,
    persona,
    route,
    localeCode,
    club,
    squads,
    pile,
    locale,
  };
}

async function main() {
  assertEnv();
  const args = parseArgs();
  const persona = args.persona;
  const route = args.route ?? "utas";
  const localeCode = args.locale ?? "en-GB";
  const output = args.output
    ? path.resolve(process.cwd(), args.output)
    : path.resolve(__dirname, "..", "src", "data", "ultimate-team", "club.json");

  const data = await fetchClubData({ persona, route, localeCode });
  await fs.promises.mkdir(path.dirname(output), { recursive: true });
  await fs.promises.writeFile(output, JSON.stringify(data, null, 2));
  console.log(`Saved club data to ${output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
