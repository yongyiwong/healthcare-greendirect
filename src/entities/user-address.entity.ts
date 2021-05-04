import { Column, Entity } from 'typeorm';

import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { UserAddress as BaseUserAddress } from '@sierralabs/nest-identity';
import { ReplaceRelationType } from '@sierralabs/nest-utils';

import { State } from './state.entity';
import { User } from './user.entity';

@Entity()
export class UserAddress extends BaseUserAddress {
  @ApiModelProperty()
  @ReplaceRelationType(type => User)
  public userId: number;

  /**
   * The state to which this ID is tied. Provided by the Point-of-Sale (POS) system.
   */
  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public statePOS: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public instruction: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public nickname: string;

  @ReplaceRelationType(type => State)
  public state: State;

  @ApiModelPropertyOptional()
  @Column('point', { nullable: true })
  public longLat: string;
}
