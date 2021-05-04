import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';
import { Role as BaseRole } from '@sierralabs/nest-identity';
import { ReplaceRelationType } from '@sierralabs/nest-utils';

@Entity()
@Unique(['name'])
export class Role extends BaseRole {
  @ReplaceRelationType(type => User)
  public users: User[];
}
