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

import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity()
export class UserMarketing {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @ManyToOne(type => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  public user: User;

  @ApiModelPropertyOptional()
  @ManyToOne(type => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  public organization: Organization;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public textMarketingSubscriptionArn: string;

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;
}
