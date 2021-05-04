import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity()
export class UserMJFreeway {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(type => User)
  @JoinColumn({ name: 'user_id' })
  public userId: number;

  @Column('text', { nullable: true })
  public gender: string;

  /**
   * The user's birthdate. The value is stored as a string because it is a date-only field.
   */
  @Column('date', { nullable: true })
  public birthDate: string;

  /**
   * A flag indicating the consumers status
   */
  @Column({ default: true })
  public isActive: boolean;

  /**
   * The method by which the user prefers to be contated
   */
  @Column('text', { nullable: true })
  public preferredContact: string;

  /**
   * A flag indicating whether the consumer is tax exempt
   */
  @Column({ default: false })
  public taxExempt: boolean;

  /**
   * If an organization has multiple facilities, a consumer can designate one as their primary facility.
   */
  @Column({ nullable: true })
  public primaryFacilityId: number;

  /**
   * If the consumer is linked to another marijuana provider, this is the internal ID of that provider.
   */
  @Column({ nullable: true })
  public currentMarijuanaProvider: number;

  /**
   * A date on which the consumer can change providers.
   */
  @Column('date', { nullable: true })
  // tslint:disable-next-line: variable-name
  public date_provider_can_switch: string;

  /**
   * The diagnosis the consumer has been given by their Physician/Health Care Practitioner
   */
  @Column('text', { nullable: true })
  public diagnosis: string;

  /**
   * Physician Name
   */
  @Column('text', { nullable: true })
  public physicianName: string;

  /**
   * Physician License
   */
  @Column('text', { nullable: true })
  public physicianLicense: string;

  /**
   * Physician Address
   */
  @Column('text', { nullable: true })
  public physicianAddress: string;

  /**
   * Indicates whether the consumer is a medical or retail consumer.
   */
  @Column('text', { nullable: true })
  public type: string;

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;
}
