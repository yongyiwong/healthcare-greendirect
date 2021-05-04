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

@Entity()
export class UserIdentification {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => User)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  /**
   * Location of where this identification originated
   */
  @ApiModelProperty()
  @ManyToOne(type => Location)
  @JoinColumn({ name: 'locationId' })
  public location: Location;

  /**
   * The ID identifier from the Point-of-Sale (POS) system
   */
  @ApiModelProperty()
  @Column({ nullable: true })
  public posId: number;

  /**
   * Indicates the type of identification
   */
  @Column('text')
  public type: string;

  /**
   * Identification Number
   */
  @Column('text')
  public number: string;

  /**
   * The email address on file in the Point-of-Sale (POS) system
   */
  @Column('citext', { nullable: true })
  public email: string;

  /**
   * The state to which this ID is tied. Provided by the Point-of-Sale (POS) system.
   */
  @Column('text', { nullable: true })
  public state: string;

  @Column({ default: true })
  public isActive: boolean;

  /**
   * Unique system identifier for the file uploaded for this ID. Provided by the Point-of-Sale (POS) system.
   */
  @Column({ nullable: true })
  public fileId: number;

  /**
   * The expiration date of the ID
   */
  @Column('timestamp with time zone', { nullable: true })
  public expires: Date;

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

  @ApiModelPropertyOptional()
  @Column('timestamp', { nullable: true })
  public deleted: Date;
}
