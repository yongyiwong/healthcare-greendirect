import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

import { CouponLimitCategory } from './coupon-limit-category.entity';
import { Coupon } from './coupon.entity';

@Entity()
export class CouponLimit {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(
    type => Coupon,
    coupon => coupon.limit,
    { nullable: false },
  )
  @JoinColumn({ name: 'coupon_id' })
  public coupon: Coupon;

  @OneToMany(
    type => CouponLimitCategory,
    category => category.couponLimit,
    {
      eager: true,
    },
  )
  public categories: CouponLimitCategory[];

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
