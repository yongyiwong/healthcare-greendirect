import { ApiModelProperty } from '@nestjs/swagger';

export class SaveUserLocationDto {
  @ApiModelProperty()
  readonly location: number;
}
