import type { Alley } from '../../../src/app/core/models/alley.model';

/**
 * The town the mocked geocoder knows. Searching for it finds ALLEYS; any other
 * term geocodes to nothing, so the picker falls through to its "Use …" entry.
 */
export const ALLEY_TOWN = { name: 'Springfield', lat: 39.7817, lon: -89.6501 };

/**
 * A small, deterministic set of alleys the mocked Overpass API returns around
 * ALLEY_TOWN. Names are distinct from the seeded games' alleys so a pick is
 * always a visible change.
 */
export const ALLEYS: Alley[] = [
  { id: 'node/1001', name: 'Sunset Bowl', lat: 39.79, lon: -89.64, address: 'Main Street 12, 62701 Springfield', source: 'osm' },
  { id: 'node/1002', name: 'Lucky Strike Lanes', lat: 39.76, lon: -89.67, address: 'Lake Road 3, 62703 Springfield', source: 'osm' },
];
