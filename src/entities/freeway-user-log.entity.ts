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

import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum FreewayUserLogStatus {
  started = 'STARTED',
  startedRemoteSync = 'STARTED_REMOTE_SYNC',
  completedRemoteSync = 'COMPLETED_REMOTE_SYNC',
  updatingFreewayUsers = 'UPDATING_FREEWAY_USERS',
  completed = 'COMPLETED',
  failed = 'FAILED',
}

@Entity()
export class FreewayUserLog {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Organization)
  @JoinColumn({ name: 'organization_id' })
  public organization: Organization;

  @ManyToOne(type => User)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @Column('text')
  public status: FreewayUserLogStatus;

  @Column('text', { nullable: true })
  public message: string;

  @Column({ default: 0 })
  public userCount: number;

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;
}
