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
import { User } from './user.entity';

/**
 * Deals that have been claimed by a user (not limited to PATIENT roles.)
 */
@Entity()
export class UserDeal {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Deal)
  @JoinColumn({ name: 'dealId' })
  public deal: Deal;

  @ManyToOne(type => User)
  @JoinColumn({ name: 'userId' })
  public user: User;

  /**
   * Date when user claimed this deal. Can be used for validating against the deal.expirationDate
   */
  @ApiModelProperty()
  @Column('timestamp', { nullable: true })
  public dateClaimed: Date;

  /**
   * Date when user used this deal in the location. Can be used for validating if this deal is still active/usable.
   */
  @ApiModelProperty()
  @Column('timestamp', { nullable: true })
  public dateUsed: Date;

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
