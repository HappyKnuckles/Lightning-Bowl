import { FilterDisplayConfig } from './generic-filter-active.component';

export const BALL_FILTER_CONFIG: FilterDisplayConfig[] = [
  {
    key: 'weight',
    label: 'Weight',
    type: 'string',
    unit: 'lbs'
  },
  {
    key: 'coreType',
    label: 'Core Type',
    type: 'string'
  },
  {
    key: 'availability',
    label: 'Availability',
    type: 'boolean',
    trueBooleanText: 'Available',
    falseBooleanText: 'Discontinued'
  },
  {
    key: 'market',
    label: 'Market',
    type: 'string'
  },
  {
    key: 'inArsenal',
    label: 'Arsenal only',
    type: 'boolean',
    trueBooleanText: 'Arsenal only'
  },
  {
    key: 'brands',
    label: 'Brands',
    type: 'array'
  },
  {
    key: 'coverstocks',
    label: 'Coverstocks',
    type: 'array'
  },
  {
    key: 'coverstockTypes',
    label: 'Coverstock Types',
    type: 'array'
  },
  {
    key: 'cores',
    label: 'Cores',
    type: 'array'
  },
  {
    key: 'minRg', // This will match both minRg and maxRg
    label: 'RG',
    type: 'range'
  },
  {
    key: 'minDiff', // This will match both minDiff and maxDiff  
    label: 'Diff',
    type: 'range'
  }
];

export const GAME_FILTER_CONFIG: FilterDisplayConfig[] = [
  {
    key: 'excludePractice',
    label: 'Exclude Practice Games',
    type: 'boolean',
    trueBooleanText: 'Exclude Practice Games'
  },
  {
    key: 'minScore',
    label: 'Score',
    type: 'range'
  },
  {
    key: 'isClean',
    label: 'Only Clean Games',
    type: 'boolean',
    trueBooleanText: 'Only Clean Games'
  },
  {
    key: 'isPerfect',
    label: 'Only Perfect Games',
    type: 'boolean',
    trueBooleanText: 'Only Perfect Games'
  },
  {
    key: 'leagues',
    label: 'Leagues',
    type: 'array'
  },
  {
    key: 'balls',
    label: 'Balls',
    type: 'array'
  },
  {
    key: 'patterns',
    label: 'Patterns',
    type: 'array'
  },
  {
    key: 'dateRange',
    label: 'Time Range',
    type: 'date-range'
  }
];