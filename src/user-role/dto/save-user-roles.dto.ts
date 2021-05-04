import { ApiModelProperty } from '@nestjs/swagger';
import { RoleEnum } from '../../roles/roles.enum';

export class SaveUserRolesDto {
  @ApiModelProperty()
  readonly roles: RoleEnum[];
}
