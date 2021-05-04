import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

@Entity()
export class AppDownload {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('text')
  public platform: string;

  @ApiModelProperty()
  @Column({ default: 0 })
  public downloads: number;

  @ApiModelProperty()
  @Column('smallint')
  public year: number;

  @ApiModelProperty()
  @Column('smallint')
  public month: number;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;
}
