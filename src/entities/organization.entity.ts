import { Entity, Column, OneToMany } from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { State } from './state.entity';
import { Organization as BaseOrganization } from '@sierralabs/nest-identity';
import { ReplaceRelationType } from '@sierralabs/nest-utils';
import { Location } from './location.entity';

export enum OrganizationPos {
  Mjfreeway = 'mjfreeway',
  Biotrack = 'biotrack',
}

export interface PosConfig {
  apiKey: string;
  userId: number;
  url: string;
  isEmailNotification: boolean;
  enableOrderSync: boolean;
}

@Entity()
export class Organization extends BaseOrganization {
  /**
   * The product identifier from the Point-of-Sale (POS) system.
   */
  @ApiModelPropertyOptional()
  @Column({ nullable: true })
  public posId: number;

  /**
   * The code name for the POS system used for synchronization (i.e. mjfreeway).
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public pos: OrganizationPos;

  /**
   * The secure token key for API access to the POS API
   */
  @ApiModelPropertyOptional()
  @Column('jsonb', { nullable: true })
  public posConfig: PosConfig;

  /**
   * Name of the contact at the organization.
   */
  @ApiModelPropertyOptional()
  @Column('text', { name: 'contact_name', nullable: true })
  public contactName: string;

  /**
   * Email address of the contact at the organization.
   */
  @ApiModelPropertyOptional()
  @Column('citext', { name: 'contact_email', nullable: true })
  @IsEmail()
  public contactEmail: string;

  /**
   * Phone number of the contact at the organization.
   */
  @ApiModelPropertyOptional()
  @Column('text', { name: 'contact_phone', nullable: true })
  public contactPhone: string;

  @ApiModelProperty()
  @ReplaceRelationType(type => State)
  public state: State;

  @ApiModelProperty()
  @Column({ default: false })
  public allowOffHours: boolean;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelProperty()
  @OneToMany(
    type => Location,
    location => location.organization,
  )
  public locations: Location[];

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public textTopicArn: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public stripeCustomerId?: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public stripeReceiptEmail?: string;

  @ApiModelProperty()
  @Column('smallint', { default: 50 })
  public maxActiveDeals: number;
}
