import { BallQueryParams } from 'src/app/core/models/ball.model';
import { BallFilter, CoreType, Market } from 'src/app/core/models/filter.model';
import { BallSortOption } from 'src/app/core/models/sort.model';

export interface BallQueryInput {
  filters: BallFilter;
  defaultFilters: BallFilter;
  search: string;
  sort: BallSortOption;
  /** Ball ids in the user's arsenal, used for the "only arsenal balls" filter. */
  arsenalIds: string[];
  page: number;
  size: number;
}

/**
 * Translates the ball page state into query parameters for `GET balls`.
 *
 * - The weight filter always applies, so the list matches the offline catalog.
 * - Spec ranges are only sent when changed from their defaults, so balls with
 *   missing specs aren't hidden by an untouched slider.
 * - With a search term no sort is sent: the API then orders by relevance.
 */
export function buildBallQueryParams(input: BallQueryInput): BallQueryParams {
  const { filters, defaultFilters } = input;
  const params: BallQueryParams = {
    page: String(input.page),
    size: String(input.size),
  };

  const set = (key: string, value: string | string[] | undefined) => {
    if (value === undefined) return;
    if (Array.isArray(value) && value.length === 0) return;
    params[key] = value;
  };

  set('weight', filters.weight || undefined);
  set('brand', filters.brands);
  set('core', filters.cores);
  set('coverstock', filters.coverstocks);
  set('coverstockType', filters.coverstockTypes);
  set('market', filters.market !== Market.ALL ? filters.market : undefined);
  set('coreType', filters.coreType !== CoreType.ALL ? filters.coreType : undefined);
  set('available', filters.availability ? 'true' : undefined);
  set('releaseDate', filters.releaseDate && filters.releaseDate !== 'all' ? filters.releaseDate : undefined);

  if (filters.minRg !== defaultFilters.minRg) set('minRg', String(filters.minRg));
  if (filters.maxRg !== defaultFilters.maxRg) set('maxRg', String(filters.maxRg));
  if (filters.minDiff !== defaultFilters.minDiff) set('minDiff', String(filters.minDiff));
  if (filters.maxDiff !== defaultFilters.maxDiff) set('maxDiff', String(filters.maxDiff));

  if (filters.inArsenal) {
    // An empty arsenal must match nothing, not everything.
    set('id', input.arsenalIds.length > 0 ? [...new Set(input.arsenalIds)] : ['__none__']);
  }

  const search = input.search.trim();
  if (search) {
    set('search', search);
  } else {
    set('sort', `${input.sort.field},${input.sort.direction}`);
  }

  return params;
}
