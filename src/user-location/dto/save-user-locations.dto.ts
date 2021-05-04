import { ApiModelProperty } from '@nestjs/swagger';

export class SaveUserLocationsDto {
  @ApiModelProperty()
  readonly assignments: number[];
}
