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

import { Location } from './location.entity';
import { User } from './user.entity';

export enum LocationLogStatus {
  started = 'STARTED',
  startedRemoteInventory = 'STARTED_REMOTE_INVENTORY',
  completedRemoteInventory = 'COMPLETED_REMOTE_INVENTORY',
  updatingInventory = 'UPDATING_INVENTORY',
  completed = 'COMPLETED',
  failed = 'FAILED',
}

@Entity()
export class LocationLog {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Location)
  @JoinColumn({ name: 'location_id' })
  public location: Location;

  @ManyToOne(type => User)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @Column('text')
  public status: LocationLogStatus;

  @Column('text', { nullable: true })
  public message: string;

  @Column({ default: 0 })
  public productCount: number;

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;
}
