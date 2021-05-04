import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

import { Organization } from './organization.entity';
import { User } from './user.entity';

/**
 * Tracks all marketing messages sent via text.
 */
@Entity()
export class Message {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelPropertyOptional()
  @ManyToOne(type => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ApiModelProperty()
  @Column('text')
  public text: string;

  @ApiModelProperty()
  @Column()
  public estimateSendCount: number;

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @ManyToOne(type => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
