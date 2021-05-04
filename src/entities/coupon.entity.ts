import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { ColumnDateHoursRoundingTransformer } from '../common/transformers/column-date-hours-rounding.transformer';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';
import { CouponDay } from './coupon-day.entity';
import { LocationCoupon } from './location-coupon.entity';
import { CouponLimit } from './coupon-limit.entity';

export enum DiscountType {
  Percent = 'PERCENT',
  Fixed = 'FIXED',
}

export enum DiscountApplication {
  SingleLineItem = 'SINGLE_LINE_ITEM',
  Subtotal = 'SUBTOTAL',
}

@Entity()
export class Coupon {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('text')
  public name: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public description: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'image_url', nullable: true })
  public imageUrl: string;

  @OneToMany(
    type => LocationCoupon,
    couponLocation => couponLocation.coupon,
  )
  public couponLocations: LocationCoupon[];

  @ApiModelProperty()
  @Column('timestamp', {
    nullable: true,
    transformer: new ColumnDateHoursRoundingTransformer(),
  })
  public effectiveDate: Date;

  @ApiModelProperty()
  @Column('timestamp', {
    nullable: true,
    transformer: new ColumnDateHoursRoundingTransformer(false),
  })
  public expirationDate: Date;

  @ApiModelProperty()
  @Column('text')
  public discountType: DiscountType;

  @ApiModelProperty()
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: false,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  public discountAmount: number;

  @ApiModelProperty()
  @Column('text')
  public discountApplication: DiscountApplication;

  @ApiModelProperty()
  @Column({ nullable: true })
  public applicableItemCount: number;

  @OneToMany(
    type => CouponDay,
    couponDay => couponDay.coupon,
  )
  public couponDays: CouponDay[];

  @ApiModelProperty()
  @Column({ default: true })
  public applyWithOther: boolean;

  @ApiModelProperty()
  @Column({ default: false })
  public isOneTimeUse: boolean;

  @ApiModelProperty()
  @Column({ default: true })
  public isAutoApply: boolean;

  @ApiModelProperty()
  @Column({ default: true })
  public isForDelivery: boolean;

  @ApiModelProperty()
  @Column({ default: true })
  public isForPickup: boolean;

  @ApiModelProperty()
  @Column({ default: false })
  public isVoidDeliveryFee: boolean;

  @ApiModelProperty()
  @Column({ default: true })
  public isVisible: boolean;

  @ApiModelProperty()
  @Column('text')
  public couponSku: string;

  @OneToOne(
    type => CouponLimit,
    couponLimit => couponLimit.coupon,
    {
      eager: true,
    },
  )
  public limit: CouponLimit;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
