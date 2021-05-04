import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Post,
  Body,
  UsePipes,
} from '@nestjs/common';
import { ApiUseTags, ApiImplicitQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FormContactService } from './form-contact.service';
import { RoleEnum } from '../roles/roles.enum';
import { FormContact } from '../entities/form-contact.entity';
import { Roles } from '@sierralabs/nest-identity';
import { RequiredPipe, ParseBooleanPipe } from '@sierralabs/nest-utils';
import { NotificationService } from '../notification/notification.service';
import { FormContactExceptions } from './form-contact.exceptions';
import { UserService } from '../user/user.service';
import { User } from '../entities/user.entity';
import { StateService } from '../state/state.service';
import { FormContactDto } from './form-contact.dto';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { GDExpectedException } from '../gd-expected.exception';

const { Admin } = RoleEnum;
@ApiBearerAuth()
@ApiUseTags('Form Contacts')
@Controller('form-contacts')
export class FormContactController {
  constructor(
    private readonly formContactService: FormContactService,
    private readonly userService: UserService,
    private readonly stateService: StateService,
    private readonly notificationService: NotificationService,
  ) {}

  @Roles(Admin)
  @Get()
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  @UsePipes(new SearchValidationPipe(FormContact))
  public async search(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<[FormContact[], number]> {
    return this.formContactService.getFormContacts(
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
  ): Promise<FormContact> {
    return this.formContactService.findContactById(id);
  }

  @Post()
  public async create(
    @Body(new RequiredPipe()) formContact: FormContactDto,
  ): Promise<boolean> {
    try {
      // Retrieve user details
      if (formContact.user && formContact.user.id) {
        formContact.user =
          formContact.user && formContact.user.id
            ? ((await this.userService.findById(formContact.user.id)) as User)
            : null;

        /**
         * Manually set meta-data, since OwnerInterceptor does not work
         * for public (non-loggedin) forms.
         */
        formContact.createdBy = formContact.user.id;
      } else {
        delete formContact.user;
      }
      const locale = (formContact.user && formContact.user.locale) || null;

      // Retrieve State details
      formContact.state = await this.stateService.findById(formContact.stateId);

      const savedRecord = await this.formContactService.create(
        formContact as FormContact,
      );
      const emailNotification = this.formContactService.composeFormContactEmail(
        savedRecord,
        locale,
      );
      return this.notificationService.sendEmailMessage(
        emailNotification,
        locale,
      );
    } catch (error) {
      const { sendingFailed } = FormContactExceptions;
      throw new GDExpectedException(sendingFailed);
    }
  }
}
