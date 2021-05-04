import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import { State } from './state.entity';
import { User } from './user.entity';

@Entity()
export class FormBusinessListing {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @ManyToOne(type => User)
  @JoinColumn({ name: 'userId' })
  public user: User;

  @ApiModelProperty()
  @Column('text')
  public fullName: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'phone_number', nullable: true })
  public phoneNumber: string;

  @ApiModelPropertyOptional()
  @Column('citext')
  @IsEmail()
  public email: string;

  @ApiModelProperty()
  @Column('text')
  public businessType: string;

  @ApiModelProperty()
  @Column('text')
  public businessName: string;

  @ApiModelProperty()
  @Column('text', { name: 'address_line_1' })
  public addressLine1: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'address_line_2', nullable: true })
  public addressLine2: string;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public city: string;

  @ApiModelProperty()
  @ManyToOne(type => State, { eager: true, nullable: true })
  @JoinColumn({ name: 'state_id' })
  public state: State;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public website: string;

  @ApiModelProperty()
  @Column('text')
  public postalCode: string;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
