export interface League {
  Name: string;
  Show: boolean;
  Event: League | Tourney;
}

export interface Tourney {
  Name: string;
  Show: boolean;
  Event?: League | Tourney;
}

// Type guard to check if a value is a League object
export function isLeagueObject(value: any): value is League {
  return value && typeof value === 'object' && 
         typeof value.Name === 'string' && 
         typeof value.Show === 'boolean';
}

// Helper function to convert legacy string league to League object
export function convertLegacyLeague(name: string): League {
  return {
    Name: name,
    Show: true,
    Event: null as any // Will be set to appropriate type later
  };
}

// Union type for handling both legacy strings and new League objects
export type LeagueData = string | League;