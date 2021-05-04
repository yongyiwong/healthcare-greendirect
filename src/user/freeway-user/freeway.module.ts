import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreewayUser } from '../../entities/freeway-user.entity';
import { FreewayService } from './freeway.service';

@Module({
  imports: [TypeOrmModule.forFeature([FreewayUser])],
  providers: [FreewayService],
  exports: [FreewayService],
})
export class FreewayModule {}
