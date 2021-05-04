import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsMobilePhone } from 'class-validator';
import { Location } from './location.entity';

@Entity()
export class MobileCheckIn {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @ManyToOne(type => Location)
  @JoinColumn({ name: 'locationId' })
  public location: Location;

  @ApiModelProperty()
  @Column('text', { name: 'mobile_number' })
  @IsMobilePhone('en-US')
  public mobileNumber: string;

  @ApiModelProperty()
  @Column({ default: false })
  public isClaimed: boolean;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;
}
