import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileSharesController } from './file-shares.controller';
import { FileSharesService } from './file-shares.service';
import { FileShare } from './entities/file-share.entity';
import { File } from '../files/entities/file.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FileShare, File, User])],
  controllers: [FileSharesController],
  providers: [FileSharesService],
})
export class FileSharesModule {}
