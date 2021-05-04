import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiImplicitQuery,
  ApiUseTags,
  ApiImplicitBody,
} from '@nestjs/swagger';
import { Roles } from '@sierralabs/nest-identity';
import { RequiredPipe } from '@sierralabs/nest-utils';
import * as _ from 'lodash';

import { Message } from '../entities/message.entity';
import { RoleEnum } from '../roles/roles.enum';
import { BroadcastMessageDto, BroadcastMessageCountDto } from './message.dto';
import { MessageService } from './message.service';

const { Admin, SiteAdmin } = RoleEnum;

@ApiBearerAuth()
@ApiUseTags('Messages')
@Controller('messages')
export class MessageController {
  constructor(protected readonly messageService: MessageService) {}

  @Roles(Admin, SiteAdmin)
  @Get()
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'organizationId', required: false })
  public async find(
    @Req() request,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('order') order?: string,
    @Query('organizationId') organizationId?: number,
  ): Promise<[Message[], number]> {
    const user = request.user;

    // roles that needs organizationId
    const organizationIdDependentRoles: RoleEnum[] = [SiteAdmin];
    const isOrganizationIdRequired: boolean = !!_.intersection(
      organizationIdDependentRoles,
      user.roles.map(role => role.name),
    ).length;

    return this.messageService.findAll(
      limit,
      page,
      order,
      organizationId,
      isOrganizationIdRequired,
    );
  }

  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      messageDto: BroadcastMessageDto;
      new() {}
    },
  })
  @Roles(Admin, SiteAdmin)
  @Post()
  public async broadcastMarketingMessage(
    @Req() request,
    @Body(new RequiredPipe()) messageDto: BroadcastMessageDto,
  ) {
    const user = request.user;
    const billableRoles: RoleEnum[] = [SiteAdmin];
    const enableBilling: boolean = !!_.intersection(
      billableRoles,
      user.roles.map(({ name }) => name),
    ).length;

    return this.messageService.broadcastMarketingMessage(
      request.user,
      messageDto,
      enableBilling,
    );
  }

  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      messageDto: BroadcastMessageDto;
      new() {}
    },
  })
  @Roles(Admin, SiteAdmin)
  @Post('estimate-cost')
  public async getEstimatedCost(
    @Req() request,
    @Body(new RequiredPipe()) messageDto: BroadcastMessageDto,
  ): Promise<number> {
    return this.messageService.getEstimatedCost(messageDto);
  }

  @Roles(Admin, SiteAdmin)
  @Get('current-week-count')
  public async getMessageCountCurrentWeek(): Promise<
    BroadcastMessageCountDto[]
  > {
    return this.messageService.getMessageCountCurrentWeek();
  }

  @Roles(Admin, SiteAdmin)
  @Get('count')
  @ApiImplicitQuery({ name: 'organizationId', required: false })
  public async getBroadcastMessageCount(
    @Req() request,
    @Query('organizationId') organizationId?: number,
  ): Promise<BroadcastMessageCountDto[]> {
    const user = request.user;

    // roles that needs organizationId
    const organizationIdDependentRoles: RoleEnum[] = [SiteAdmin];
    const isOrganizationIdRequired: boolean = !!_.intersection(
      organizationIdDependentRoles,
      user.roles.map(role => role.name),
    ).length;

    return this.messageService.getBroadcastMessageCount(
      organizationId,
      isOrganizationIdRequired,
    );
  }
}
