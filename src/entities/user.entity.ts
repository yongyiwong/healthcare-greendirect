import { Entity, Column, OneToMany } from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsMobilePhone } from 'class-validator';
import { ReplaceRelationType } from '@sierralabs/nest-utils';
import { User as BaseUser } from '@sierralabs/nest-identity';

import { Role } from './role.entity';
import { SignInLink } from './sign-in-link.entity';
import { UserLocation } from './user-location.entity';
import { UserIdentification } from './user-identification.entity';
import { UserDeal } from './user-deal.entity';

@Entity()
export class User extends BaseUser {
  /**
   * The user identifier from the Point-of-Sale (POS) system
   */
  @ApiModelProperty()
  @Column({ nullable: true })
  public posId: number;

  /**
   * Mobile number of the user for sending text message notifications.
   */
  @ApiModelProperty()
  @Column('text', { name: 'mobile_number', nullable: true })
  @IsMobilePhone('en-US')
  public mobileNumber: string;

  /**
   * When true, the user is subscribed to get text message marketing.
   * When false, the user is unsubscribed to text message marketing.
   */
  @ApiModelPropertyOptional()
  @Column({ nullable: true, default: true })
  public isSubscribedToMarketing: boolean;

  /**
   * Mobile number verification Code sent via SMS
   */
  @Column('text', { name: 'verification_code', nullable: true })
  public verificationCode: string;

  /**
   * Timestamp of verification code creation
   */
  @Column('timestamp', { name: 'verification_created', nullable: true })
  public verificationCreated: Date;

  /**
   * Patient medical ID number.
   */
  @ApiModelProperty()
  @Column('text', { name: 'patient_number', nullable: true })
  public patientNumber: string;

  /**
   * Need to redeclare roles relationship from base class
   */
  @ReplaceRelationType(type => Role)
  public roles: Role[];

  /**
   * @deprecated
   */
  @ApiModelProperty()
  @OneToMany(
    type => UserLocation,
    userLocation => userLocation.user,
  )
  public assignments: UserLocation[];

  @ApiModelProperty()
  @OneToMany(
    type => UserLocation,
    userLocation => userLocation.user,
    {
      eager: true,
    },
  )
  public locations: UserLocation[];

  @OneToMany(
    type => UserIdentification,
    userIdentification => userIdentification.user,
  )
  public identifications: UserIdentification[];

  /**
   * User-preferred locale for setting language and formats (currencies, dates).
   */
  @Column('citext', { nullable: false, default: 'en-US' })
  public locale: string;

  /**
   * User's claimed deals from different locations.
   */
  @ApiModelProperty()
  @OneToMany(
    type => UserDeal,
    userDeal => userDeal.user,
  )
  public deals: UserDeal[];

  /**
   * Sign in links for new MJ/Biotrack user
   */
  @OneToMany(
    type => SignInLink,
    signInLink => signInLink.user,
  )
  public signInLinks: SignInLink[];
}
