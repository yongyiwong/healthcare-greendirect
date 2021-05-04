import { Module } from '@nestjs/common';
import { FormContactController } from './form-contact.controller';
import { FormContactService } from './form-contact.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormContact } from '../entities/form-contact.entity';
import { UserModule } from '../user/user.module';
import { NotificationService } from '../notification/notification.service';
import { StateModule } from '../state/state.module';

@Module({
  imports: [TypeOrmModule.forFeature([FormContact]), UserModule, StateModule],
  controllers: [FormContactController],
  providers: [FormContactService, NotificationService],
  exports: [FormContactService],
})
export class FormContactModule {}
