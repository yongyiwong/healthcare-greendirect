import { Organization } from '../entities/organization.entity';

export interface OrganizationDto extends Organization {
  activeDealsCount?: number;
}
