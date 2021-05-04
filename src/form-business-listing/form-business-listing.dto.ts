import { ApiModelProperty } from '@nestjs/swagger';
import { State } from '../entities/state.entity';
import { BusinessType } from './business-type.enum';
import { User } from '../entities/user.entity';

export class FormBusinessListingDto {
  @ApiModelProperty()
  id: number;
  @ApiModelProperty()
  fullName: string;
  @ApiModelProperty()
  phoneNumber: string;
  @ApiModelProperty()
  email: string;
  @ApiModelProperty()
  businessType: BusinessType;
  @ApiModelProperty()
  businessName: string;
  @ApiModelProperty()
  addressLine1: string;
  @ApiModelProperty()
  addressLine2: string;
  @ApiModelProperty()
  city: string;
  @ApiModelProperty()
  state: State;
  @ApiModelProperty()
  website: string;
  @ApiModelProperty()
  postalCode: string;

  stateId?: number;
  user: User;
  created?: Date;
  createdBy?: number;
  modified?: Date;
  modifiedBy?: number;
  deleted?: boolean;
}
