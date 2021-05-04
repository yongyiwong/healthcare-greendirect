import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

import { Delivery, DeliveryStatus } from './delivery.entity';
import { User } from './user.entity';

@Entity()
export class DeliveryLog {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelPropertyOptional()
  @ManyToOne(type => Delivery, { nullable: false })
  @JoinColumn()
  public delivery: Delivery;

  @ApiModelPropertyOptional()
  @ManyToOne(type => User, { nullable: true })
  @JoinColumn({ name: 'driver_user_id' })
  public driverUser: User;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public deliveryStatus: DeliveryStatus;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @Column({ nullable: false })
  public createdBy: number;
}
