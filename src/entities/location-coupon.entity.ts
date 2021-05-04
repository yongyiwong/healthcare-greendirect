import { Coupon } from './coupon.entity';
import { Location } from './location.entity';
import { ApiModelProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Entity,
  RelationId,
} from 'typeorm';

@Entity()
export class LocationCoupon {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Coupon)
  @JoinColumn({ name: 'couponId' })
  public coupon: Coupon;

  @ManyToOne(type => Location)
  @JoinColumn({ name: 'locationId' })
  public location: Location;

  @RelationId((lc: LocationCoupon) => lc.location)
  locationId: number;

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
