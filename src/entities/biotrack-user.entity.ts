import {
  Column,
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Unique,
  ManyToOne,
} from 'typeorm';

import { ApiModelProperty } from '@nestjs/swagger';
import { ColumnNumericTransformer } from '@sierralabs/nest-utils';

import { User } from './user.entity';

// TODO Why in the world is all this data duplicated here?  Why store total spend here? -lbradley 29 June 2021
@Entity()
@Unique(['posId', 'posOrgId'])
export class BiotrackUser {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('text')
  public posId: string;

  @ManyToOne(type => User)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  /** refers to the Biotrack organization POS ID, not GD organization.id */
  @Column({ nullable: true })
  public posOrgId: number;

  @Column('text', { nullable: true })
  public firstName: string;

  @Column('text', { nullable: true })
  public middleName: string;

  @Column('text', { nullable: true })
  public lastName: string;

  @Column('text', { nullable: true })
  public email: string;

  @Column('date', { nullable: true })
  public birthday: Date;

  @Column('text', { nullable: true })
  public medicalNumber: string;

  @Column('date', { nullable: true })
  public medicalExpireDate: Date;

  @Column('text', { nullable: true })
  public licenseNumber: string;

  @Column('date', { nullable: true })
  public licenseExpireDate: Date;

  @Column('text', { nullable: true })
  public addressLine1: string;

  @Column('text', { nullable: true })
  public addressLine2: string;

  @Column('text', { nullable: true })
  public city: string;

  @Column('text', { nullable: true })
  public state: string;

  @Column('text', { nullable: true })
  public postalCode: string;

  @Column('text', { nullable: true })
  public phoneNumber: string;

  @Column({ nullable: true })
  public isSmsOptIn: boolean;

  @Column('int', { nullable: true })
  public totalPoints: number;

  @Column('int', { nullable: true })
  public totalOrders: number;

  @Column('numeric', {
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  public totalSpent: number;

  @Column({ default: false })
  public isDeleted: boolean;

  @Column({ nullable: true })
  public created: Date;

  @Column({ nullable: true })
  public modified: Date;
}
