import { BowlingScoreDisplayPipe } from './bowling-score-display.pipe';

describe('BowlingScoreDisplayPipe', () => {
  it('create an instance', () => {
    const pipe = new BowlingScoreDisplayPipe();
    expect(pipe).toBeTruthy();
  });
});
