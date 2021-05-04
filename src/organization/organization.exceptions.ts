import { HttpStatus } from '@nestjs/common';

import { isEmpty } from 'lodash';

import { ExpectedExceptionMap } from '../app.interface';
import { Organization } from '../entities/organization.entity';
import { Location } from '../entities/location.entity';

export const OrganizationExceptions: ExpectedExceptionMap = {
  organizationOffHoursDisabled: {
    message: 'Error: Your company does not allow off-hours ordering.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: ({
      location,
      organization,
    }: {
      location: Location;
      organization: Organization;
    }) => location.allowOffHours && !organization.allowOffHours,
  },
  siteAdminNotAssignedToOrg: {
    message: 'Error: You are not assigned to this company.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (args: {
      organizationId: number;
      organizationAssigned: Organization;
    }) =>
      !args.organizationAssigned ||
      args.organizationId !== args.organizationAssigned.id,
  },
  siteAdminAssignmentRestricted: {
    message: 'There are no location/s for site admins to administer.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: organizationLocations => isEmpty(organizationLocations),
  },
  dealsLimitIsLessThanDealsCount: {
    message:
      'Error: Max active deals cannot be less than currently active deals',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: ({
      maxActiveDeals,
      activeDealsCount,
    }: {
      maxActiveDeals: number;
      activeDealsCount: number;
    }) => maxActiveDeals < activeDealsCount,
  },
};
