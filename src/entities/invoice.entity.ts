import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

import { Message } from './message.entity';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';
import { User } from './user.entity';

/**
 * See complete desc in:
 * https://stripe.com/docs/billing/invoices/workflow#invoice-status-transition-endpoints-and-webhooks
 */
export enum StripeInvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public description: string;

  @OneToOne(type => Message)
  @ApiModelProperty()
  @JoinColumn()
  public message: Message;

  @ApiModelProperty()
  @Column({ default: StripeInvoiceStatus.DRAFT })
  public status: StripeInvoiceStatus;

  @ApiModelProperty()
  @Column('numeric', {
    precision: 7,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  public totalAmount: number;

  /** References to  Stripe Invoice Id */
  @ApiModelPropertyOptional()
  @Column({ nullable: true })
  public stripeInvoiceId: string;

  /** References to actual Stripe capture a.k.a. commit charge */
  @ApiModelPropertyOptional()
  @Column({ nullable: true })
  public stripeChargeId: string;

  /** References to when a charge_id is refunded. Paper trail purpose only.
   * Probably done manually.
   */
  @ApiModelPropertyOptional()
  @Column({ nullable: true })
  public stripeRefundId: string;

  /** Aside from GD system purpose, also reused whenever invoice is deleted in Stripe. */
  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @ManyToOne(type => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  public createdBy: User;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;
}
