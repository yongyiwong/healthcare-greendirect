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
import { Location } from './location.entity';
import { User } from './user.entity';

@Entity()
export class UserLocation {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @ManyToOne(type => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  public user: User;

  @ApiModelProperty()
  @ManyToOne(type => Location, { eager: true })
  @JoinColumn({ name: 'locationId' })
  public location: Location;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelPropertyOptional()
  @CreateDateColumn()
  public created: Date;

  @ApiModelProperty()
  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelProperty()
  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
