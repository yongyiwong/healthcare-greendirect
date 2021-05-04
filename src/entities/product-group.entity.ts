import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Brand } from './brand.entity';
import { Product } from './product.entity';

@Entity()
export class ProductGroup {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('text')
  public name: string;

  @ApiModelProperty()
  @ManyToOne(type => Brand)
  @JoinColumn({ name: 'brand_id' })
  public brand: Brand;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public description: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public category: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public imageUrl: string;

  @OneToMany(
    type => Product,
    products => products.productGroup,
  )
  public products: Product[];

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;

  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
