import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ApiModelProperty } from '@nestjs/swagger';

import { FreewayUserAddress } from './freeway-user-address.entity';
import { FreewayUserIdentification } from './freeway-user-identification.entity';
import { FreewayUserPhone } from './freeway-user-phone.entity';

@Entity()
export class FreewayUser {
  @ApiModelProperty()
  @PrimaryColumn()
  public posId: number;

  /** refers to the Freeway organization POS ID, not GD organization.id */
  @Column({ name: 'org_id', nullable: true })
  public orgId: number;

  @Column('text', { name: 'first_name', nullable: true })
  public firstName: string;

  @Column('text', { name: 'middle_name', nullable: true })
  public middleName: string;

  @Column('text', { name: 'last_name', nullable: true })
  public lastName: string;

  @Column('text', { nullable: true })
  public email: string;

  @Column('text', { nullable: true })
  public gender: string;

  @Column('date', { name: 'birthday', nullable: true })
  public birthday: string;

  @Column({ nullable: true })
  public active: boolean;

  @Column({ default: false })
  public unsubscribed: boolean;

  @Column({ default: false })
  public hasBwell: boolean;

  @Column({ name: 'primary_facility_id', nullable: true })
  public primaryFacility: number;

  @Column('text', { name: 'physician_name', nullable: true })
  public physicianName: string;

  @Column('text', { name: 'physician_license', nullable: true })
  public physicianLicense: string;

  @Column('text', { name: 'physician_address', nullable: true })
  public physicianAddress: string;

  @Column('text', { nullable: true })
  public diagnosis: string;

  @Column('text', { nullable: true })
  public type: string;

  @Column('text', { name: 'preferred_contact', nullable: true })
  public preferredContact: string;

  @Column({ name: 'tax_exempt', nullable: true })
  public taxExempt: boolean;

  @Column({ name: 'order_count_week', nullable: true })
  public orderCountWeek: number;

  @Column({ name: 'order_count_month', nullable: true })
  public orderCountMonth: number;

  @Column({ name: 'order_count_90_days', nullable: true })
  public orderCountNinety: number;

  @Column({ name: 'total_points', nullable: true })
  public totalPoints: number;

  @Column({ name: 'total_orders', nullable: true })
  public totalOrders: number;

  @Column('text', { name: 'total_spent', nullable: true })
  public totalSpent: string;

  @Column('text', { name: 'favorite_flower_item_name', nullable: true })
  public favoriteFlower: string;

  @Column('text', { name: 'favorite_edible_item_name', nullable: true })
  public favoriteEdible: string;

  @Column('text', { name: 'favorite_concentrate_item_name', nullable: true })
  public favoriteConcentrate: string;

  @Column('text', { name: 'favorite_topical_item_name', nullable: true })
  public favoriteTopical: string;

  @Column({ name: 'favorite_flower_item_id', nullable: true })
  public favoriteFlowerId: number;

  @Column({ name: 'favorite_edible_item_id', nullable: true })
  public favoriteEdibleId: number;

  @Column({ name: 'favorite_concentrate_item_id', nullable: true })
  public favoriteConcentrateId: number;

  @Column({ name: 'favorite_topical_item_id', nullable: true })
  public favoriteTopicalId: number;

  @Column({ nullable: true })
  public created: Date;

  @Column({ nullable: true })
  public modified: Date;

  @OneToMany(
    type => FreewayUserAddress,
    freewayUserAddress => freewayUserAddress.freewayUser,
  )
  public addresses: FreewayUserAddress[];

  @OneToMany(
    type => FreewayUserIdentification,
    freewayUserIdentification => freewayUserIdentification.freewayUser,
  )
  public ids: FreewayUserIdentification[];

  @OneToMany(
    type => FreewayUserPhone,
    freewayUserPhone => freewayUserPhone.freewayUser,
  )
  public phoneNumbers: FreewayUserPhone[];
}
