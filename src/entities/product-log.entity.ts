import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

import { LocationLog } from './location-log.entity';
import { Product } from './product.entity';

export enum ProductLogStatus {
  update = 'UPDATE',
  create = 'CREATE',
}

@Entity()
export class ProductLog {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => LocationLog)
  @JoinColumn({ name: 'location_log_id' })
  public locationLog: LocationLog;

  @ManyToOne(type => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  public product: Product;

  @Column('text')
  public status: string;

  @Column('text', { nullable: true })
  public message: string;

  @Column('jsonb', { nullable: true })
  public productSnapshot: any;

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;
}
