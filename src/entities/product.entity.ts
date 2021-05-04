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
import { Location } from './location.entity';
import { ProductPricing } from './product-pricing.entity';
import { ProductImage } from './product-image.entity';
import { ProductGroup } from './product-group.entity';

@Entity()
export class Product {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  /**
   * The product identifier from the Point-of-Sale (POS) system.
   */
  @ApiModelProperty()
  @Column({ nullable: true })
  public posId: number;

  @ApiModelProperty()
  @ManyToOne(type => Location)
  @JoinColumn({ name: 'location_id' })
  public location: Location;

  @ApiModelPropertyOptional()
  @ManyToOne(type => ProductGroup)
  @JoinColumn({ name: 'product_group_id' })
  public productGroup: ProductGroup;

  /**
   * Name of product
   */
  @ApiModelProperty()
  @Column('text')
  public name: string;

  /**
   * Description of product
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public description: string;

  /**
   * Category to which the product belongs
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public category: string;

  /**
   * Subcategory to which the product belongs
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public subcategory: string;

  /**
   * Flag to determine if the product is in stock at the location.
   */
  @ApiModelProperty()
  @Column({ default: true })
  public isInStock: boolean;

  /**
   * Flag to determine if the product is marked as a medicated item.
   * (Currently does not appear to be returning from MJ Freeway)
   */
  @ApiModelProperty()
  @Column({ default: false })
  public isMedicated: boolean;

  /**
   * Identifer of the strain to which the product belongs. Provided by the Point-of-Sale (POS) system.
   */
  @ApiModelPropertyOptional()
  @Column({ nullable: true })
  public strainId: number;

  /**
   * Description of the strain to which the product belongs.
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public strainName: string;

  /**
   * The method used to the price the item. A value of unit means a simple price is used, i.e. $10/each. A value of
   * weight means a pricing scheme is implemented using predefined weights.
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public pricingType: string;

  /**
   * A list of pricing schemes for this product.
   */
  @ApiModelPropertyOptional()
  @OneToOne(
    type => ProductPricing,
    productPricing => productPricing.product,
    {
      cascade: true,
    },
  )
  public pricing: ProductPricing;

  /**
   * A list of product images.
   */
  @ApiModelPropertyOptional()
  @OneToMany(
    type => ProductImage,
    productImage => productImage.product,
  )
  public images: ProductImage[];

  @ApiModelProperty()
  @Column({ default: false })
  public hidden: boolean;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

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
