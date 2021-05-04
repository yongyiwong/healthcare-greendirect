import { FreewayUser } from '../../entities/freeway-user.entity';

export interface FreewayUserDto extends Partial<FreewayUser> {
  // Add additional DTO properties here that are not part of freeway-user.entity
}

export enum UserIdentificationType {
  MED = 'med',
}

/**
 * Used to hold user-owned rewards points retrieved from freeway-user.entity
 * Avoid including personal information in this DTO.
 */
export interface UserRewardsPointsDto {
  /** Freeway organization not GD organization */
  orgPosId: number;
  orgName: string;
  totalPoints: number;
}

/**
 * Preferably this should be queried from a DB but we need to 'copy' from
 * MJ Freeway's synced table, as a key value pair.
 */
export enum OrganizationPOSId {
  BFriends = 207,
  ClinicaVerde = 1042,
}

export const OrganizationPOSDetail: {
  [id in OrganizationPOSId]: { name: string };
} = Object.freeze({
  [OrganizationPOSId.BFriends]: { name: 'BFriends' },
  [OrganizationPOSId.ClinicaVerde]: { name: 'Clinica Verde' },
});
