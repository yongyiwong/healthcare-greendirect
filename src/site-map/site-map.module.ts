import { Module, forwardRef } from '@nestjs/common';
import { SiteMapController } from './site-map.controller';
import { SiteMapService } from './site-map.service';
import { AppModule } from '../app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [SiteMapController],
  providers: [SiteMapService],
  exports: [SiteMapService],
})
export class SiteMapModule {}
