import { Location } from './location.entity';
import { ApiModelProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Entity,
} from 'typeorm';
import { Deal } from './deal.entity';

@Entity()
export class LocationDeal {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Deal)
  @JoinColumn({ name: 'dealId' })
  public deal: Deal;

  @ManyToOne(type => Location)
  @JoinColumn({ name: 'locationId' })
  public location: Location;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

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
