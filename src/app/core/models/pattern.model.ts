export interface ForwardsData {
  number: string;
  // start is the starting board 1L first left board, 1R first right board, 39 total boards; x axis
  start: string;
  stop: string;
  load: string;
  mics: string;
  speed: string;
  buf: string;
  tank: string;
  total_oil: string;
  // this is the y-axis, start from foul line and end 60ft total
  distance_start: string;
  distance_end: string;
}

export interface ReverseData {
  number: string;
  start: string;
  stop: string;
  load: string;
  mics: string;
  speed: string;
  buf: string;
  tank: string;
  total_oil: string;
  distance_start: string;
  distance_end: string;
}

export interface Pattern {
  url: string;
  title: string;
  category: string;
  distance: string;
  ratio?: string;
  volume: string;
  forward: string;
  reverse: string;
  pump: string;
  tanks?: string;
  forwards_data: ForwardsData[];
  reverse_data: ReverseData[];
}
