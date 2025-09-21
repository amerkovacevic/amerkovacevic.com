export type UltimateTeamClubPileItem =
  | ({
      itemType: "player";
      id: number;
      definitionId: number;
      firstName: string;
      lastName: string;
      commonName: string | null;
      rating: number;
      position: string;
      club: string;
      league: string;
      nation: string;
      tradeState: string;
    } & Record<string, unknown>)
  | ({
      itemType: "stadium" | "badge" | "ball" | "kit" | "contract" | "consumable";
      id: number;
      definitionId: number;
      name: string;
    } & Record<string, unknown>);

export interface UltimateTeamClubData {
  fetchedAt: string;
  baseUrl: string;
  persona: string;
  route: string;
  localeCode?: string;
  club: {
    established?: number;
    lastAccess?: string;
    name?: string;
    record?: {
      wins?: number;
      draws?: number;
      losses?: number;
    };
    stadium?: string;
    badgeId?: number;
  };
  squads: {
    activeSquadId?: number;
    items?: Array<{
      id: number;
      name: string;
      type: string;
      rating?: number;
      chemistry?: number;
    }>;
  } | null;
  pile: {
    count?: number;
    items?: UltimateTeamClubPileItem[];
  };
  locale: {
    info?: {
      code?: string;
      label?: string;
      direction?: "ltr" | "rtl" | string;
    };
    strings?: Record<string, string>;
  } | null;
}
