import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CouponModule } from '../coupon/coupon.module';
import { OrderCoupon } from '../entities/order-coupon.entity';
import { OrderHistory } from '../entities/order-history.entity';
import { OrderProduct } from '../entities/order-product.entity';
import { OrderTax } from '../entities/order-tax.entity';
import { Order } from '../entities/order.entity';
import { LocationModule } from '../location';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { OrderCouponService } from './order-coupon/order-coupon.service';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { SynchronizeModule } from '../synchronize/synchronize.module';
import { UserIdentificationModule } from '../user-identification/user.idenfication.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderHistory,
      OrderProduct,
      OrderTax,
      OrderCoupon,
    ]),
    HttpModule,
    ProductModule,
    UserModule,
    UserIdentificationModule,
    CouponModule,
    forwardRef(() => SynchronizeModule),
    forwardRef(() => LocationModule),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    NotificationService,
    OrderCouponService,
    MessageService,
  ],
  exports: [OrderService],
})
export class OrderModule {}
