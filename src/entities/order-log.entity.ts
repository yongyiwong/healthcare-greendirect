import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';
import { Order } from './order.entity';

@Entity()
export class OrderLog {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @ManyToOne(type => Order, { nullable: false })
  @JoinColumn()
  public order: Order;

  @ApiModelProperty()
  @Column({ default: false })
  public deliveryVerified: boolean;

  @ApiModelPropertyOptional()
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public receivedAmount: number;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public note: string;

  @ApiModelPropertyOptional()
  @Column({ nullable: true })
  public paymentCompletedDate: Date;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @Column({ nullable: false })
  public createdBy: number;
}
