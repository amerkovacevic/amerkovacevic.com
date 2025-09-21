import type { UltimateTeamClubData, UltimateTeamClubPileItem } from "./types";
import sampleClub from "./sample-club.json";
import clubRaw from "./club.json";

export type { UltimateTeamClubData, UltimateTeamClubPileItem } from "./types";

export const SAMPLE_CLUB_DATA: UltimateTeamClubData = sampleClub as UltimateTeamClubData;

export const CLUB_DATA: UltimateTeamClubData | null =
  clubRaw && clubRaw !== null ? (clubRaw as UltimateTeamClubData) : null;

export function getActiveClubData(): UltimateTeamClubData {
  return CLUB_DATA ?? SAMPLE_CLUB_DATA;
}
