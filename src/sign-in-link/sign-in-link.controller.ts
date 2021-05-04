import { Controller, Post, Get, Delete, Body, Req } from '@nestjs/common';
import { ApiUseTags } from '@nestjs/swagger';
import { Roles } from '@sierralabs/nest-identity';

import { SignInLinkService } from './sign-in-link.service';
import { SignInLinkStatusDto } from './dto/sign-in-link-status.dto';

@ApiUseTags('Sign In Link')
@Controller('sign-in-link')
export class SignInLinkController {
  constructor(public readonly signInLinkService: SignInLinkService) {}

  @Roles('$authenticated')
  @Get('status')
  public async getStatus(@Req() request): Promise<SignInLinkStatusDto> {
    return this.signInLinkService.getStatusByUserId(request.user.id);
  }

  @Roles('$authenticated')
  @Delete()
  public async revoke(@Req() request): Promise<void> {
    return this.signInLinkService.revokeByUserId(request.user.id);
  }

  @Post('send/email/verification')
  public async sendVerificationEmail(
    @Body('email') email: string,
  ): Promise<boolean> {
    return this.signInLinkService.sendVerificationEmail(email);
  }
}
