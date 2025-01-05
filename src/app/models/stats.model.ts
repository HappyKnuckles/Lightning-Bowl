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
  average3SeriesScore?: number;
  high3Series?: number;
  average4SeriesScore?: number;
  high4Series?: number;
  average5SeriesScore?: number;
  high5Series?: number;
  [key: string]: any;
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
  average3SeriesScore?: number;
  average4SeriesScore?: number;
  average5SeriesScore?: number;
  averageFirstCount: number;
  cleanGameCount: number;
  perfectGameCount: number;
  averageScore: number;
  overallSpareRate: number;
  overallMissedRate: number;
  spareRates: number[];
  [key: string]: any;
}
