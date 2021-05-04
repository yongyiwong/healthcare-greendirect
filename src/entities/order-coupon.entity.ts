import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { Order } from './order.entity';

@Entity()
export class OrderCoupon {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Order)
  @JoinColumn({ name: 'orderId' })
  public order: Order;

  @ManyToOne(type => Coupon, { eager: true })
  @JoinColumn({ name: 'couponId' })
  public coupon: Coupon;

  @ApiModelProperty()
  @Column({ default: true })
  public applied: boolean = true;

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
