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
import { Product } from './product.entity';
import { ProductPricingWeight } from './product-pricing-weight.entity';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';

@Entity()
export class ProductPricing {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelPropertyOptional()
  @OneToOne(type => Product)
  @JoinColumn({ name: 'product_id' })
  public product: Product;

  @ApiModelPropertyOptional()
  @Column('numeric', {
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  public price: number;

  /**
   * If the product was set up within a pricing group, this is the name of that group. Provided by the Point-of-Sale
   * (POS) system.
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public pricingGroupName: string;

  /**
   * A list of prices by weight.
   */
  @OneToMany(
    type => ProductPricingWeight,
    productPricingWeight => productPricingWeight.pricing,
    { cascade: true },
  )
  @ApiModelPropertyOptional()
  public weightPrices: ProductPricingWeight[];

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
