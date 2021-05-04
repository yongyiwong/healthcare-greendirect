import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PromoBanner {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('text')
  public name: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public bannerUrl: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public bannerMobileUrl: string;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public backgroundColor: string;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public clickUrl: string;

  @ApiModelProperty()
  @Column({ default: false })
  public isActive: boolean;

  @ApiModelProperty()
  @Column('smallint', { default: 0 })
  public sequenceNumber: number;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
