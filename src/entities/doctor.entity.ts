import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { State } from './state.entity';

@Entity()
export class Doctor {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('text')
  public name: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public description: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public website: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public email: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public thumbnail: string;

  @ApiModelPropertyOptional()
  @Column('point', { nullable: true })
  public longLat: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'address_line_1', nullable: true })
  public addressLine1: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'address_line_2', nullable: true })
  public addressLine2: string;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public city: string;

  @ApiModelPropertyOptional()
  @ManyToOne(type => State, { eager: true, nullable: true })
  @JoinColumn({ name: 'state_id' })
  public state: State;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'postal_code', nullable: true })
  public postalCode: string;

  @ApiModelPropertyOptional()
  @Column('text', { name: 'phone_number', nullable: true })
  public phoneNumber: string;

  @ApiModelProperty()
  @Column({ default: 2 })
  public priority: number;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

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
}
