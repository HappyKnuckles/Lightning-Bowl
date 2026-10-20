import { Ball } from 'src/app/core/models/ball.model';
import { makeBall } from 'src/testing/fixtures';
import { toStoredBall } from './stored-ball.utils';

describe('toStoredBall', () => {
  it('turns legacy string specs into numbers or null', () => {
    const legacy = { ...makeBall(), core_rg: '2.50', core_diff: '0,052', core_int_diff: 'n/a' } as unknown as Ball;
    const ball = toStoredBall(legacy);
    expect(ball.core_rg).toBe(2.5);
    expect(ball.core_diff).toBe(0.052);
    expect(ball.core_int_diff).toBeNull();
  });

  it('treats empty and missing specs as unknown', () => {
    const legacy = { ...makeBall(), core_rg: '', core_diff: undefined } as unknown as Ball;
    const ball = toStoredBall(legacy);
    expect(ball.core_rg).toBeNull();
    expect(ball.core_diff).toBeNull();
  });

  it('returns current balls unchanged', () => {
    const ball = makeBall({ core_rg: 2.5, core_diff: null });
    expect(toStoredBall(ball)).toBe(ball);
  });
});
