import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ApiModelProperty } from '@nestjs/swagger';
import { ProductPricing } from './product-pricing.entity';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';

@Entity()
export class ProductPricingWeight {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  /**
   * The pricing_weight_id identifier from the Point-of-Sale (POS) system.
   */
  @ApiModelProperty()
  @Column({ nullable: true })
  public posId: number;

  /**
   * Name of the predefined pricing weight
   */
  @Column('text')
  public name: string;

  /**
   * Price of the product by weight
   */
  @Column('numeric', {
    precision: 7,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  public price: number;

  @ApiModelProperty({ type: ProductPricing, isArray: true })
  @ManyToOne(type => ProductPricing)
  @JoinColumn({ name: 'product_pricing_id' })
  public pricing: ProductPricing;

  @Column({ default: false })
  public deleted: boolean;
}
