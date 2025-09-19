export type Attribute = "nation" | "league" | "club" | "quality" | "position";

export type Player = {
  id: string;
  name: string;
  rating: number;
  nation: string;
  league: string;
  club: string;
  quality?: string;
  positions: string[];
};

export type Requirement = {
  id: string;
  attribute: Attribute;
  value: string;
  minCount: number;
};

export type SquadConfig = {
  squadSize: number;
  minTeamRating: number;
  minChemistry: number;
  searchLimit?: number;
};
