import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';
import { LocationCategory } from './location-category.entity';
import { LocationCoupon } from './location-coupon.entity';
import { LocationHoliday } from './location-holiday.entity';
import { LocationHour } from './location-hour.entity';
import { LocationPromotion } from './location-promotion.entity';
import { LocationRating } from './location-rating.entity';
import { Organization } from './organization.entity';
import { Product } from './product.entity';
import { State } from './state.entity';
import { LocationDeliveryHour } from './location-delivery-hour.entity';
import { LocationDeal } from './location-deal.entity';

export interface LocConfig {
  roomId: number;
}

@Entity()
export class Location {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  /**
   * The product identifier from the Point-of-Sale (POS) system.
   */
  @ApiModelProperty()
  @Column({ nullable: true })
  public posId: number;

  @ApiModelProperty()
  @Column('text')
  public name: string;

  @ApiModelPropertyOptional()
  @Column('jsonb', { nullable: true })
  public posConfig: LocConfig;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public thumbnail: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'site_photo', nullable: true })
  public sitePhoto: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public description: string;

  @ApiModelPropertyOptional()
  @Column('point', { nullable: true })
  public longLat: any;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'timezone', nullable: true })
  public timezone: string;

  @ApiModelPropertyOptional()
  @ManyToOne(type => Organization, { eager: true, nullable: true })
  @JoinColumn({ name: 'organization_id' })
  public organization: Organization;

  @ApiModelPropertyOptional()
  @ManyToOne(type => LocationCategory, { eager: true, nullable: true })
  @JoinColumn({ name: 'location_category_id' })
  public locationCategory: LocationCategory;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'address_line_1', nullable: true })
  public addressLine1: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'address_line_2', nullable: true })
  public addressLine2: string;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public city: string;

  @ApiModelPropertyOptional()
  @ManyToOne(type => State, { eager: true, nullable: true })
  @JoinColumn({ name: 'state_id' })
  public state: State;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'postal_code', nullable: true })
  public postalCode: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'phone_number', nullable: true })
  public phoneNumber: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'url', nullable: true })
  public url: string;

  @ApiModelProperty()
  @Column({ default: 2 })
  public priority: number;

  @ApiModelProperty()
  @Column({ default: false })
  public allowOffHours: boolean;

  @ApiModelProperty()
  @Column({ name: 'is_delivery_available', default: false })
  public isDeliveryAvailable: boolean;

  @ApiModelPropertyOptional()
  @Column({ name: 'delivery_mile_radius', nullable: true })
  public deliveryMileRadius: number;

  @ApiModelPropertyOptional()
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public deliveryFee: number;

  @ApiModelPropertyOptional()
  @Column('numeric', {
    precision: 2,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public deliveryFeePatientPercentage: number;

  /**
   * When an order is submitted a notification is sent to this number
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public notificationMobileNumber: string;

  /**
   * When a "delivery" order is submitted a notification is sent to this number
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public notificationDeliveryMobileNumber: string;

  @OneToMany(
    type => LocationRating,
    rating => rating.location,
  )
  public ratings: LocationRating[];

  @OneToMany(
    type => LocationPromotion,
    promotion => promotion.location,
  )
  public promotions: LocationPromotion[];

  @OneToMany(
    type => LocationHour,
    hour => hour.location,
  )
  public hours: LocationHour[];

  @OneToMany(
    type => LocationDeliveryHour,
    deliveryHour => deliveryHour.location,
  )
  public deliveryHours: LocationDeliveryHour[];

  @OneToMany(
    type => LocationHoliday,
    holiday => holiday.location,
  )
  public holidays: LocationHoliday[];

  @OneToMany(
    type => Product,
    product => product.location,
  )
  public products: Product[];

  @ApiModelPropertyOptional()
  @OneToMany(
    type => LocationCoupon,
    couponLocation => couponLocation.location,
  )
  public coupons: LocationCoupon[];

  @ApiModelPropertyOptional()
  @OneToMany(
    type => LocationDeal,
    dealLocation => dealLocation.location,
  )
  public deals: LocationDeal[];

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;

  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;

  @ApiModelProperty()
  @Column('int', { name: 'flower_limit', nullable: true })
  public flowerLimit: number;

  @ApiModelProperty()
  @Column('text', { name: 'message', nullable: true })
  public message: string;
}
