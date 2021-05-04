export enum SearchFilter {
  PRODUCTS = 'products',
  SHOPS = 'shops',
  BRANDS = 'brands',
  DEALS = 'deals',
  DOCTORS = 'doctors',
}

/** count object with optional breakdown of categories count.
 * Record is the same as ` { [category: string]: number; };` syntax.
 */
export interface SearchCountMapping {
  count: number;
  categories?: Record<string, number>[];
}

/**
 * @example {
 *  "products": {
 *    count: 20,
 *    categories: [
 *      { "Vapes": 1 },
 *      { "Edibles": 19}
 *    ]
 *  },
 *  "doctors": {
 *    count: 100
 *   }
 * }
 */
export type SearchCountDto = Record<SearchFilter, SearchCountMapping>;

export const NO_CATEGORY = '';
export const OTHER_CATEGORY = 'Other';
