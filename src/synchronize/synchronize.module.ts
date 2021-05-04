import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationService } from '../notification/notification.service';
import { ProductModule } from '../product/product.module';
import { BiotrackCSVInventoryService } from './biotrack/biotrack-inventory-csv.service';
import { BiotrackInventoryService } from './biotrack/biotrack-inventory.service';
import { BiotrackUserService } from './biotrack/biotrack-user.service';
import { MjfreewayInventoryService } from './mjfreeway/mjfreeway-inventory.service';
import { MjfreewayUserService } from './mjfreeway/mjfreeway-user.service';
import { SynchronizeController } from './synchronize.controller';
import { SynchronizeService } from './synchronize.service';
import { SignInLinkModule } from '../sign-in-link/sign-in-link.module';
import { FreewayUserIdentification } from '../entities/freeway-user-identification.entity';
import { BiotrackUser } from '../entities/biotrack-user.entity';
import { BiotrackOrderService } from './biotrack/biotrack-order.service';
import { MjfreewayOrderService } from './mjfreeway/mjfreeway-order.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BiotrackUser, FreewayUserIdentification]),
    HttpModule,
    forwardRef(() => OrderModule),
    ProductModule,
    SignInLinkModule,
  ],
  controllers: [SynchronizeController],
  providers: [
    BiotrackCSVInventoryService,
    BiotrackInventoryService,
    BiotrackOrderService,
    BiotrackUserService,
    MjfreewayInventoryService,
    MjfreewayOrderService,
    MjfreewayUserService,
    MjfreewayUserService,
    NotificationService,
    SynchronizeService,
  ],
  exports: [
    BiotrackOrderService,
    BiotrackUserService,
    MjfreewayOrderService,
    MjfreewayUserService,
  ],
})
export class SynchronizeModule {}
