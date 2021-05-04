import { ContactReason } from './contact-reason.enum';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { State } from '../entities/state.entity';

export class FormContactDto {
  @ApiModelProperty()
  id: number;
  @ApiModelProperty()
  fullName: string;
  @ApiModelProperty()
  phoneNumber: string;
  @ApiModelProperty()
  email: string;
  @ApiModelProperty()
  city: string;
  @ApiModelProperty()
  state: State;
  @ApiModelProperty()
  postalCode: string;
  @ApiModelProperty()
  reason: ContactReason;
  @ApiModelProperty()
  message: string;

  stateId?: number;
  user: User;
  created?: Date;
  createdBy?: number;
  modified?: Date;
  modifiedBy?: number;
  deleted?: boolean;
}
