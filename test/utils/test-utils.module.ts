import { Module } from '@nestjs/common';
import { FixtureService } from './fixture.service';

@Module({
  providers: [FixtureService],
  exports: [FixtureService],
})
export class TestUtilsModule {}
