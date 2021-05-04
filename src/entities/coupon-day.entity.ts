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

@Entity()
export class CouponDay {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Coupon)
  @JoinColumn({ name: 'couponId' })
  public coupon: Coupon;

  @ApiModelProperty()
  @Column('smallint', { name: 'day_of_week' })
  public dayOfWeek: number;

  @ApiModelPropertyOptional()
  @Column('time', { name: 'start_time', nullable: true })
  public startTime: string;

  @ApiModelPropertyOptional()
  @Column('time', { name: 'end_time', nullable: true })
  public endTime: string;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelProperty()
  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelProperty()
  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
