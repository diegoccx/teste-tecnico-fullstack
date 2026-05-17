import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { File } from './entities/file.entity';
import { FileShare } from '../file-shares/entities/file-share.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([File, FileShare]), StorageModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
