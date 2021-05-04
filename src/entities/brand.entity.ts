import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { ColumnDateHoursRoundingTransformer } from '../common/transformers/column-date-hours-rounding.transformer';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { ProductGroup } from './product-group.entity';

export const RANDOM_PRIORITY_OPTION = 0;

@Entity()
export class Brand {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('text')
  public name: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public description: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public imageUrl: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public url: string;

  @OneToMany(
    type => ProductGroup,
    productGroup => productGroup.brand,
  )
  public productGroups: ProductGroup[];

  @ApiModelPropertyOptional()
  @Column('timestamp', {
    nullable: true,
    transformer: new ColumnDateHoursRoundingTransformer(),
  })
  public publishDate: Date;

  @ApiModelPropertyOptional()
  @Column('timestamp', {
    nullable: true,
    transformer: new ColumnDateHoursRoundingTransformer(false),
  })
  public unpublishDate: Date;

  @ApiModelProperty()
  @Column('smallint', { default: RANDOM_PRIORITY_OPTION })
  public priority: number;

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
