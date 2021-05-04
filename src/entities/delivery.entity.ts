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

import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

import { Location } from './location.entity';
import { Order } from './order.entity';
import { User } from './user.entity';

export enum DeliveryStatus {
  OPEN = 'open', // delivery created in CMS
  IN_PROGRESS = 'in_progress', // driver clicks “Start Delivery” button on Delivery Checklist screen
  CANCELLED = 'cancelled', // admin cancels delivery in CMS
  DELIVERED = 'delivered', // driver clicks “End Delivery” or “Navigate to Dispensary” buttons on Delivery Complete screen
}

@Entity()
export class Delivery {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelPropertyOptional()
  @ManyToOne(type => User, { nullable: true })
  @JoinColumn({ name: 'driver_user_id' })
  public driverUser: User;

  @ApiModelPropertyOptional()
  @ManyToOne(type => Location, { nullable: false })
  @JoinColumn()
  public location: Location;

  @ApiModelProperty()
  @Column('text', { nullable: false, default: DeliveryStatus.OPEN })
  public deliveryStatus: DeliveryStatus;

  @OneToMany(
    type => Order,
    order => order.delivery,
  )
  public orders: Order[];

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @Column({ nullable: false })
  public createdBy: number;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelPropertyOptional()
  @Column({ nullable: false })
  public modifiedBy: number;
}
