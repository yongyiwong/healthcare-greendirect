import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormBusinessListing } from '../entities/form-business-listing.entity';
import { UserModule } from '../user/user.module';
import { FormBusinessListingController } from './form-business-listing.controller';
import { FormBusinessListingService } from './form-business-listing.service';
import { NotificationService } from '../notification/notification.service';
import { StateModule } from '../state/state.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FormBusinessListing]),
    UserModule,
    StateModule,
  ],
  controllers: [FormBusinessListingController],
  providers: [FormBusinessListingService, NotificationService],
  exports: [FormBusinessListingService],
})
export class FormBusinessListingModule {}
