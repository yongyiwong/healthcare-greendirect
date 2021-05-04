import { Entity, Column } from 'typeorm';
import { UserPhone as BaseUserPhone } from '@sierralabs/nest-identity';
import { ReplaceRelationType } from '@sierralabs/nest-utils';
import { User } from './user.entity';
import { ApiModelProperty } from '@nestjs/swagger';

@Entity()
export class UserPhone extends BaseUserPhone {
  @ReplaceRelationType(type => User)
  public userId: number;

  /**
   * The phone number identifier from the Point-of-Sale (POS) system
   */
  @ApiModelProperty()
  @Column({ nullable: true })
  public posId: number;
}
