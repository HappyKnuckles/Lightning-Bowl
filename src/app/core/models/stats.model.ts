type StatValue = number | number[] | string;

export interface Stats {
  totalGames: number;
  totalPins: number;
  perfectGameCount: number;
  cleanGameCount: number;
  cleanGamePercentage: number;
  totalStrikes: number;
  totalSpares: number;
  totalSparesMissed: number;
  totalSparesConverted: number;
  pinCounts: number[];
  missedCounts: number[];
  averageStrikesPerGame: number;
  averageSparesPerGame: number;
  averageOpensPerGame: number;
  strikePercentage: number;
  sparePercentage: number;
  openPercentage: number;
  spareConversionPercentage: number;
  averageFirstCount: number;
  averageScore: number;
  highGame: number;
  spareRates: number[];
  overallSpareRate: number;
  overallMissedRate: number;
  longesStrikeStreak?: number;
  longestOpenStreak?: number;
  dutch200Count?: number;
  varipapa300Count?: number;
  averageGamesPerSession?: number;
  averageSessionsPerWeek?: number;
  averageSessionsPerMonth?: number;
  strikeoutCount?: number;
  strikeToStrikePercentage?: number;
  turkeyCount?: number;
  bagger4Count?: number;
  bagger5Count?: number;
  bagger6Count?: number;
  bagger7Count?: number;
  bagger8Count?: number;
  bagger9Count?: number;
  bagger10Count?: number;
  bagger11Count?: number;
  allSparesGameCount?: number;
  averageGamesPerMonth?: number;
  averageGamesPerWeek?: number;
  average3SeriesScore?: number;
  high3Series?: number;
  average4SeriesScore?: number;
  high4Series?: number;
  average5SeriesScore?: number;
  high5Series?: number;
  average6SeriesScore?: number;
  high6Series?: number;
  [key: string]: StatValue | undefined;
}
export interface SessionStats extends Stats {
  lowGame: number;
}
// TODO think of what these need
export interface SeriesStats extends Stats {
  seriesTotal: number;
  seriesDate: string;
}

export interface OverallSeriesStats {
  seriesCount: number;
  averageSeriesScore: number;
  averageSrtrikesPerSeries: number;
  averageSparesPerSeries: number;
  averageOpensPerSeries: number;
  highSeries: number;
  lowSeries: number;
}
export interface PrevStats {
  cleanGamePercentage: number;
  strikePercentage: number;
  sparePercentage: number;
  openPercentage: number;
  averageStrikesPerGame: number;
  averageSparesPerGame: number;
  averageOpensPerGame: number;
  averageFirstCount: number;
  cleanGameCount: number;
  perfectGameCount: number;
  averageScore: number;
  overallSpareRate: number;
  overallMissedRate: number;
  spareRates: number[];
  average3SeriesScore?: number;
  high3Series?: number;
  average4SeriesScore?: number;
  high4Series?: number;
  average5SeriesScore?: number;
  [key: string]: StatValue | undefined;
}

export type GameStats = Stats | SessionStats | SeriesStats | PrevStats;
