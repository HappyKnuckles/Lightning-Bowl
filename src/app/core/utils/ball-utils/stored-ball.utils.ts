import { Ball } from 'src/app/core/models/ball.model';

/** Spec fields that used to be stored as strings (bowwwl.com's format). */
const SPEC_FIELDS = ['core_rg', 'core_diff', 'core_int_diff'] as const;

function toSpec(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Brings a ball saved on the device (arsenal, favorites, ball cache) to the
 * current shape. Balls saved before the ball API have their specs as strings
 * ("2.50", "n/a"); the API returns numbers or null.
 */
export function toStoredBall(ball: Ball): Ball {
  if (SPEC_FIELDS.every((field) => typeof ball[field] === 'number' || ball[field] === null)) return ball;
  const normalized = { ...ball };
  for (const field of SPEC_FIELDS) normalized[field] = toSpec(ball[field]);
  return normalized;
}
