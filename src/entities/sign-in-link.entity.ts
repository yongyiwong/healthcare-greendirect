import { ApiModelProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class SignInLink {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @ManyToOne(type => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  public user: User;

  @ApiModelProperty()
  @Column('text')
  public token: string;

  @ApiModelProperty()
  @Column({ default: true })
  public active: boolean;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;
}
