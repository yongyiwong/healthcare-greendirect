import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';
import { OrderProduct } from './order-product.entity';
import { Location } from './location.entity';
import { OrderHistory } from './order-history.entity';
import { OrderTax } from './order-tax.entity';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';
import { OrderCoupon } from './order-coupon.entity';
import { State } from './state.entity';
import { Delivery } from './delivery.entity';
import { OrderStatus } from '../order/order-status.enum';

@Entity()
export class Order {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  /**
   * The order identifier from the Point-of-Sale (POS) system.
   */
  @ApiModelProperty()
  @Column({ nullable: true })
  public posId: number;

  /**
   * Name of the order; auto-generated or from Point-of-Sale (POS) system.
   */
  @Column('text', { nullable: true })
  public name: string;

  /**
   * Indicates whether it is a sales or refund order.
   */
  @Column('text')
  public orderType: string;

  @ManyToOne(type => User)
  @JoinColumn({ name: 'userId' })
  public user: User;

  @ManyToOne(type => Location)
  @JoinColumn({ name: 'locationId' })
  public location: Location;

  /**
   * Designates the origination of the order from Point-of-Sale (POS) system.
   */
  @Column('text')
  public orderSource: string;

  /**
   * In the case of online orders, a flag designated whether the order has been submitted for processing.
   */
  @Column({ default: false })
  public isSubmitted: boolean;

  /**
   * Date the order was submitted by the user.
   */
  @Column('timestamp', { nullable: true })
  public submittedDate: Date;

  /**
   * Indicates how the order will be fulfilled
   */
  @Column('text', { nullable: true })
  public fullfillmentMethod: string;

  /**
   * The total on the order, accounting for taxes and coupons.
   */
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public orderTotal: number;

  /**
   * The amount on the order that has not yet been paid.
   */
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public balanceDue: number;

  @ApiModelPropertyOptional()
  @OneToOne(type => OrderTax, { eager: true, nullable: true })
  @JoinColumn()
  public orderTax?: OrderTax;

  /**
   * The total of all taxes on the order.
   */
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public taxTotal: number;

  /**
   * The total of any discounts or coupons applied to the order.
   */
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public couponTotal: number;

  /**
   * The delivery fee charged to the patient (only applies to delivery orders)
   */
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public deliveryPatientFee: number;

  /**
   * The delivery fee charged to the dispensary (only applies to delivery orders)
   */
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public deliveryDispensaryFee: number;

  /**
   * The current overall status of the order. Options are open, completed and cancelled.
   */
  @Column('text', { nullable: true })
  public orderStatus: OrderStatus;

  /**
   * A flag indicating whether the payment on the order has been fully received. This value should become true when the
   * balance becomes 0.
   */
  @Column({ default: false })
  public isPaymentComplete: boolean;

  @ApiModelPropertyOptional()
  @Column({ nullable: true })
  public paymentCompletedDate: Date;

  @OneToMany(
    type => OrderProduct,
    orderProduct => orderProduct.order,
    {
      eager: true,
    },
  )
  public products: OrderProduct[];

  @OneToMany(
    type => OrderHistory,
    orderHistory => orderHistory.order,
  )
  public history: OrderHistory[];

  @OneToMany(
    type => OrderCoupon,
    orderCoupon => orderCoupon.order,
    {
      eager: true,
    },
  )
  public coupons: OrderCoupon[];

  /// Delivery info

  /**
   * A flag indicating whether the order is a delivery order
   */
  @Column({ default: false })
  public isDelivery: boolean;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public deliveryNickname: string;

  @ApiModelPropertyOptional()
  @Column({ nullable: true })
  public deliveryAddressReferenceId: number;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'delivery_address_line_1', nullable: true })
  public deliveryAddressLine1: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'delivery_address_line_2', nullable: true })
  public deliveryAddressLine2: string;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public deliveryCity: string;

  @ApiModelPropertyOptional()
  @ManyToOne(type => State, { eager: true, nullable: true })
  @JoinColumn({ name: 'delivery_state_id' })
  public deliveryState: State;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public deliveryPostalCode: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public deliveryInstruction: string; // snapshot from user address instruction

  @ApiModelPropertyOptional()
  @ManyToOne(type => Delivery)
  @JoinColumn()
  public delivery: Delivery;

  @ApiModelPropertyOptional()
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
  @Column('text', { nullable: true })
  public userNotes: string;

  /// Metadata

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;

  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;

  @Column({ name: 'order_ready', nullable: true })
  public orderReady: string;

  @Column({ name: 'delivery_time_slot', nullable: true })
  public deliveryTimeSlot: string;

  @Column({ name: 'assigned_to_user_id', nullable: true })
  public assignedTo: number;

  @Column({ name: 'driver_name', nullable: true })
  public driverName: string;

  @Column({ name: 'pos_order_id', nullable: true })
  public posOrderId: string;
}
