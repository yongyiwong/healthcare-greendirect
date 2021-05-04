import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Location } from './location.entity';

@Entity()
export class LocationHour {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => Location)
  @JoinColumn({ name: 'location_id' })
  public location: Location;

  @Column('smallint', { name: 'day_of_week', default: 0 })
  public dayOfWeek: number;

  @Column({ name: 'is_open', default: false })
  public isOpen: boolean;

  @Column('time', { name: 'start_time', nullable: true })
  public startTime: string;

  @Column('time', { name: 'end_time', nullable: true })
  public endTime: string;

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
