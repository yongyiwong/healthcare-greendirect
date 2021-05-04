import { ApiModelProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Deal } from './deal.entity';

@Entity()
export class DealDay {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Deal)
  @JoinColumn({ name: 'dealId' })
  public deal: Deal;

  @ApiModelProperty()
  @Column('smallint', { name: 'day_of_week' })
  public dayOfWeek: number;

  @ApiModelProperty()
  @Column({ default: true })
  public isActive: boolean;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelProperty()
  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelProperty()
  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
