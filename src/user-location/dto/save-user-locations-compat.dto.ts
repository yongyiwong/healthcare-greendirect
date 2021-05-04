import { ApiModelProperty } from '@nestjs/swagger';
import { RoleEnum } from '../../roles/roles.enum';

// TODO: @deprecated
export class SaveUserLocationsCompatDto {
  @ApiModelProperty()
  readonly assignments: {
    id?: number;
    role?: RoleEnum; // TODO: @deprecated
    location?: number | null;
    mode: 'create' | 'update' | 'delete';
  }[];
}
