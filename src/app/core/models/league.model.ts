export type EventType = 'League' | 'Tournament';

export interface League {
  name: string;
  show: boolean;
  event: EventType;
  isActive: boolean;
  isSanctioned: boolean;
  startDate?: string;
  endDate?: string;
  note?: string;
}

// Type guard to check if a value is a League object
export function isLeagueObject(value: unknown): value is League {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return typeof obj['name'] === 'string' && typeof obj['show'] === 'boolean' && (obj['event'] === 'League' || obj['event'] === 'Tournament');
}

// Helper function to convert legacy string league to League object
export function convertLegacyLeague(name: string): League {
  return {
    name: name,
    show: true,
    event: 'League',
    isActive: false,
    isSanctioned: true,
    startDate: undefined,
    endDate: undefined,
    note: undefined,
  };
}

// Union type for handling both legacy strings and new League objects
export type LeagueData = string | League;
