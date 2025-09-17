// Run: node scripts/build-leagues-from-wikipedia.js
// Writes: src/data/clubs.json
// Requires: npm i -D cheerio p-limit
// Node 18+ (global fetch)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import pLimit from "p-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Edit URLs below for each season as needed.
 * This list matches your spec:
 * England (4), France (3), Germany (3), Italy (2), Spain (2),
 * Portugal (2), + single top leagues for Turkey, Belgium, Austria, Croatia, Serbia, Scotland
 */
const LEAGUES = [
  // England — top 4
  { nation: "England", league: "Premier League", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Premier_League" },
  { nation: "England", league: "EFL Championship", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_EFL_Championship" },
  { nation: "England", league: "EFL League One", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_EFL_League_One" },
  { nation: "England", league: "EFL League Two", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_EFL_League_Two" },

  // France — top 3
  { nation: "France", league: "Ligue 1", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Ligue_1" },
  { nation: "France", league: "Ligue 2", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Ligue_2" },
  { nation: "France", league: "Championnat National", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Championnat_National" },

  // Germany — top 3
  { nation: "Germany", league: "Bundesliga", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Bundesliga" },
  { nation: "Germany", league: "2. Bundesliga", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_2._Bundesliga" },
  { nation: "Germany", league: "3. Liga", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_3._Liga" },

  // Italy — top 2
  { nation: "Italy", league: "Serie A", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Serie_A" },
  { nation: "Italy", league: "Serie B", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Serie_B" },

  // Spain — top 2
  { nation: "Spain", league: "LaLiga", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_La_Liga" },
  { nation: "Spain", league: "Segunda División", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Segunda_Divisi%C3%B3n" },

  // Portugal — top 2
  { nation: "Portugal", league: "Primeira Liga", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Primeira_Liga" },
  { nation: "Portugal", league: "Liga Portugal 2", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Liga_Portugal_2" },

  // Single top leagues
  { nation: "Turkey", league: "Süper Lig", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_S%C3%BCper_Lig" },
  { nation: "Belgium", league: "Belgian Pro League", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Belgian_Pro_League" },
  { nation: "Austria", league: "Austrian Bundesliga", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Austrian_Football_Bundesliga" },
  { nation: "Croatia", league: "HNL", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Croatian_Football_League" },
  { nation: "Serbia", league: "Serbian SuperLiga", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Serbian_SuperLiga" },
  { nation: "Scotland", league: "Scottish Premiership", url: "https://en.wikipedia.org/wiki/2024%E2%80%9325_Scottish_Premiership" },
];

const OUT_PATH = path.join(__dirname, "..", "src", "data", "clubs.json");

// polite knobs
const CONCURRENCY = 3;
const DELAY_MS = 250;
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s ? s.replace(/\s+/g, " ").trim() : "");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

async function fetchHTML(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "amerkv-wiki-leagues/1.0 (personal)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    if (attempt < MAX_RETRIES) {
      await sleep(400 * attempt);
      return fetchHTML(url, attempt + 1);
    }
    throw e;
  }
}

/**
 * Extract only club names from the "League table" section.
 * Strategy:
 *  1) Find heading whose id/text contains "League table" (case-insensitive)
 *  2) Take the first wikitable after that heading; parse each row's first link (team name)
 *  3) Fallback: any wikitable that has a Team/Club column
 *  4) Defensive fallback: grab first link text per row
 */
function extractTeamsFromLeagueTable(html) {
  const $ = cheerio.load(html);
  const teams = new Set();

  const heading = $(
    'h2:has(span[id*="League_table"]), h3:has(span[id*="League_table"]), h2:contains("League table"), h3:contains("League table")'
  ).first();

  let table;
  if (heading.length) {
    // find the first table after the heading within the same section
    table = heading.nextAll("table.wikitable").first();
  }

  const tryParseTable = (tbl) => {
    if (!tbl || !tbl.length) return 0;
    const headers = tbl
      .find("th")
      .map((_, th) => norm($(th).text()).toLowerCase())
      .get();

    // Identify likely team column (common: "Team", "Club", sometimes the 2nd column)
    let teamColIndex = headers.findIndex((h) => /(team|club)/.test(h));
    if (teamColIndex === -1) {
      // If unknown, assume second column (col 1 is position)
      teamColIndex = headers.length > 1 ? 1 : 0;
    }

    let count = 0;
    tbl.find("tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (!tds.length) return;

      const td = tds.eq(teamColIndex);
      const linkText =
        norm(td.find("a").first().text()) ||
        norm(td.text());
      if (linkText && /[A-Za-z]/.test(linkText)) {
        teams.add(linkText);
        count++;
      }
    });
    return count;
  };

  // 1) Try the league-table-adjacent wikitable
  let found = 0;
  if (table && table.length) {
    found = tryParseTable(table);
  }

  // 2) Fallback: any wikitable that has a Team/Club column
  if (found === 0) {
    $("table.wikitable").each((_, tbl) => {
      if (found > 0) return;
      const t = $(tbl);
      const headers = t
        .find("th")
        .map((_, th) => norm($(th).text()).toLowerCase())
        .get();
      const hasTeam = headers.some((h) => /(team|club)/.test(h));
      if (hasTeam) {
        found = tryParseTable(t);
      }
    });
  }

  // 3) Defensive: take the first link in each row of the first wikitable on page
  if (found === 0) {
    const first = $("table.wikitable").first();
    first.find("tr").each((_, tr) => {
      const link = $(tr).find("a").first();
      const txt = norm(link.text());
      if (txt && /[A-Za-z]/.test(txt)) teams.add(txt);
    });
  }

  return [...teams];
}

async function build() {
  const limit = pLimit(CONCURRENCY);
  const all = [];

  await Promise.all(
    LEAGUES.map((entry) =>
      limit(async () => {
        try {
          await sleep(DELAY_MS);
          const html = await fetchHTML(entry.url);
          const names = extractTeamsFromLeagueTable(html);
          if (names.length === 0) {
            console.warn(`No league-table teams detected for ${entry.league} — check URL/selectors`);
          }
          names.forEach((name) => {
            all.push({
              id: slug(name),
              name,
              nation: entry.nation,
              league: entry.league,
              rep: undefined,
              source: entry.url,
            });
          });
          console.log(`${entry.league}: ${names.length} teams`);
        } catch (e) {
          console.warn(`Failed ${entry.league}: ${e.message}`);
        }
      })
    )
  );

  // de-duplicate by (league, id)
  const key = (c) => `${c.league}|${c.id}`;
  const dedup = new Map();
  for (const c of all) {
    const k = key(c);
    if (!dedup.has(k)) dedup.set(k, c);
  }
  const clubs = [...dedup.values()].sort((a, b) => a.name.localeCompare(b.name));

  const payload = {
    meta: {
      scrapedAt: new Date().toISOString(),
      source: "Wikipedia (League table sections)",
      leagues: LEAGUES.map(({ nation, league, url }) => ({ nation, league, url })),
      total: clubs.length,
    },
    clubs,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${clubs.length} clubs → ${OUT_PATH}`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
