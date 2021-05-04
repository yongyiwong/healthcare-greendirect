import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApiModelProperty } from '@nestjs/swagger';

import { Order } from './order.entity';
import { User } from './user.entity';

export enum IssueType {
  CustomerNotHome = 'CUSTOMER_NOT_HOME',
  CannotFindLocation = 'CANNOT_FIND_LOCATION',
  NoPayment = 'NO_PAYMENT',
  CustomerDidNotWantOrder = 'CUSTOMER_DID_NOT_WANT_ORDER',
  Other = 'OTHER',
}

@Entity()
export class OrderIssue {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @ManyToOne(type => Order, { nullable: false })
  @JoinColumn()
  public order: Order;

  @ApiModelProperty()
  @ManyToOne(type => User, { nullable: false })
  @JoinColumn()
  public user: User;

  @ApiModelProperty()
  @Column()
  public issueType: IssueType;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public comment: string;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;
}
