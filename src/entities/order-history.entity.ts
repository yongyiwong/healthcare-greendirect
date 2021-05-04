import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Order } from './order.entity';

@Entity()
export class OrderHistory {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @ManyToOne(type => Order)
  @JoinColumn({ name: 'orderId' })
  public order: Order;

  @ApiModelProperty()
  @Column('text')
  public orderStatus: string;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelProperty()
  @Column()
  public createdBy: number;
}
