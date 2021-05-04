import { SearchFilter } from './search-count.dto';
import { OrderByCondition } from 'typeorm';

/**
 * Shared arguments wrapper for service findWithFilter() and search() methods
 * Use this to reduce the arguments used for such service methods and avoid having to add
 * "null" for optional params just to add a value to the end of the arguments lists
 */
export interface SearchParams {
  // Queries
  search?: string;
  limit?: number;
  page?: number; // aka offset, starts from 0
  order?: string; // name of property to order by
  paginated?: boolean; // exclusive for web search

  // Ids
  locationId?: number;
  organizationId?: number;
  assignedUserId?: number; // get locations assigned to admin
  couponId?: number;
  brandId?: number;
  dealId?: number;
  productGroupId?: number;

  // Ranges (pairs)
  minLat?: number;
  minLong?: number;
  maxLat?: number;
  maxLong?: number;
  startFromLat?: number;
  startFromLong?: number;
  startDate?: number;
  endDate?: number;
  publishDate?: number;
  unpublishDate?: number;

  // Special-purpose filters (add jsdoc on how-to use)
  allowNonOwner?: boolean; // allow non-owner to retrieve, should still check in API if admin
  includeDeleted?: boolean; // include deleted users from GET /users
  includeExpired?: boolean;
  includeAllStock?: boolean; // include all products
  includeHidden?: boolean;
  includeUnassigned?: boolean; // used to includes deals with no assigned locations. DONT use in WEB
  includeInactiveDeals?: boolean; // used to includes inactive deals. DONT use in WEB
  includeLocations?: boolean; // optional and server-use only
  unassigned?: boolean; // used to return only unassigned items. DONT use in WEB (Used: [Deals-unassigned brand])
  excludeEnded?: boolean; // exclude ended records (If true, startDate and endDate args will not work)
  deliveryAvailableOnly?: boolean; // filter delivery-able locations

  // Others
  category?: string | number;
  shuffleBaseValue?: number;
  mileRadius?: number;
}

export const DEFAULT_PARAMS: SearchParams = {
  search: '',
  page: 0,
  limit: 100,
};
