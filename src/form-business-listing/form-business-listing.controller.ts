import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Param,
  ParseIntPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiImplicitQuery, ApiUseTags } from '@nestjs/swagger';
import { RequiredPipe, ParseBooleanPipe } from '@sierralabs/nest-utils';

import { FormBusinessListing } from '../entities/form-business-listing.entity';
import { User } from '../entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';
import { FormBusinessListingExceptions } from './form-business-listing.exceptions';
import { FormBusinessListingService } from './form-business-listing.service';
import { StateService } from '../state/state.service';
import { FormBusinessListingDto } from './form-business-listing.dto';
import { RoleEnum } from '../roles/roles.enum';
import { Roles, OwnerInterceptor } from '@sierralabs/nest-identity';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { GDExpectedException } from '../gd-expected.exception';

const { Admin } = RoleEnum;
@ApiUseTags('Form Business Listing')
@Controller('form-business-listing')
export class FormBusinessListingController {
  constructor(
    private readonly formBusinessListingService: FormBusinessListingService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly stateService: StateService,
  ) {}

  @Roles(Admin)
  @Get()
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  @UsePipes(new SearchValidationPipe(FormBusinessListing))
  public async search(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<[FormBusinessListing[], number]> {
    return this.formBusinessListingService.getFormBusinessListings(
      search,
      page,
      limit,
      order,
      includeDeleted,
    );
  }

  @Roles(Admin)
  @Get(':id([0-9]+)')
  public async getOne(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<FormBusinessListing> {
    return this.formBusinessListingService.findBusinessById(id);
  }

  @Post()
  public async create(
    @Body(new RequiredPipe()) formBusinessListing: FormBusinessListingDto,
  ): Promise<boolean> {
    try {
      // Retrieve user details
      if (formBusinessListing.user && formBusinessListing.user.id) {
        formBusinessListing.user =
          formBusinessListing.user && formBusinessListing.user.id
            ? ((await this.userService.findById(
                formBusinessListing.user.id,
              )) as User)
            : null;
        /**
         * Manually set meta-data, since OwnerInterceptor does not work
         * for public (non-loggedin) forms.
         */
        formBusinessListing.createdBy = formBusinessListing.user.id;
      } else {
        delete formBusinessListing.user;
      }
      const locale =
        (formBusinessListing.user && formBusinessListing.user.locale) || null;
      // Retrieve State details
      formBusinessListing.state = await this.stateService.findById(
        formBusinessListing.stateId,
      );
      const savedRecord = await this.formBusinessListingService.create(
        formBusinessListing as FormBusinessListing,
      );
      const emailNotification = this.formBusinessListingService.composeFormBusinessListingEmail(
        savedRecord,
        locale,
      );
      return this.notificationService.sendEmailMessage(
        emailNotification,
        locale,
      );
    } catch (error) {
      const { sendingFailed } = FormBusinessListingExceptions;
      throw new GDExpectedException(sendingFailed);
    }
  }
}
