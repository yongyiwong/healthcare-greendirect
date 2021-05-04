import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';
import { User } from './user.entity';
import { Location } from './location.entity';

@Entity()
export class LocationRating {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => User)
  @JoinColumn({ name: 'userId' })
  public user: User;

  @ManyToOne(type => Location)
  @JoinColumn({ name: 'locationId' })
  public location: Location;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public firstName: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public lastName: string;

  @ApiModelProperty()
  @Column('numeric', {
    precision: 2,
    scale: 1,
    transformer: new ColumnNumericTransformer(),
  })
  public rating: number;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public review: string;

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
