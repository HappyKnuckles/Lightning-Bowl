export type EventType = 'League' | 'Tournament';

export interface League {
  Name: string;
  Show: boolean;
  Event: EventType;
}

// Type guard to check if a value is a League object
export function isLeagueObject(value: any): value is League {
  return value && typeof value === 'object' && 
         typeof value.Name === 'string' && 
         typeof value.Show === 'boolean' &&
         (value.Event === 'League' || value.Event === 'Tournament');
}

// Helper function to convert legacy string league to League object
export function convertLegacyLeague(name: string): League {
  return {
    Name: name,
    Show: true,
    Event: 'League' // Default to League for legacy entries
  };
}

// Union type for handling both legacy strings and new League objects
export type LeagueData = string | League;