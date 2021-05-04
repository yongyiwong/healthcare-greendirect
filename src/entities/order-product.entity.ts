import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { ProductPricingWeight } from './product-pricing-weight.entity';
import { Order } from './order.entity';
import { Product } from './product.entity';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';

@Entity()
export class OrderProduct {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('text')
  public name: string;

  @ManyToOne(type => Order)
  @JoinColumn({ name: 'order_id' })
  public order: Order;

  @ManyToOne(type => Product)
  @JoinColumn({ name: 'product_id' })
  public product: Product;

  @ManyToOne(type => ProductPricingWeight)
  @JoinColumn({ name: 'product_pricing_weight_id' })
  public productPricingWeight: ProductPricingWeight;

  @Column('int')
  public quantity: number;

  @Column('numeric', { precision: 7, scale: 2, nullable: true })
  public soldWeight: number;

  @Column('text', { nullable: true })
  public soldWeightUnit: string;

  /**
   * Actual price at the time of purchase
   */
  @Column('numeric', {
    precision: 7,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  public price: number;

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
}
