export interface BowlingOrganization {
  name: string;
  code: string;
  country: string;
}

export interface RulebookSection {
  title: string;
  content: string;
  order: number;
}

export interface Rulebook {
  organization: BowlingOrganization;
  title: string;
  version: string;
  lastUpdated: string;
  sections: RulebookSection[];
}