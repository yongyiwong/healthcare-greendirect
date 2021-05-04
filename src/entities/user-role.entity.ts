import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity()
export class UserRole {
  @ApiModelProperty()
  @ManyToOne(type => User, { primary: true })
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @ApiModelProperty()
  @ManyToOne(type => Role, { eager: true, primary: true })
  @JoinColumn({ name: 'role_id' })
  public role: Role;
}
