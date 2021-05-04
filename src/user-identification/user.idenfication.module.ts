import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { UserIdentification } from '../entities/user-identification.entity';
import { UserIdentificationService } from './user.identification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserIdentification]),
  ],
  providers: [UserIdentificationService],
  controllers: [],
  exports: [UserIdentificationService],
})
export class UserIdentificationModule {}
