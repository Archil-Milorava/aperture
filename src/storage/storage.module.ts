import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

// ConfigService is global (ConfigModule.forRoot({ isGlobal: true })), so
// StorageService can inject it without importing ConfigModule here.
@Module({
  providers: [StorageService],
  exports: [StorageService], // so other modules (Posts) can use it
})
export class StorageModule {}
