import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvitationsModule } from './invitations/invitations.module';
import { FilesModule } from './files/files.module';
import { FileSharesModule } from './file-shares/file-shares.module';
import { StorageModule } from './storage/storage.module';
import { User } from './users/entities/user.entity';
import { Organization } from './organizations/entities/organization.entity';
import { Invitation } from './invitations/entities/invitation.entity';
import { File } from './files/entities/file.entity';
import { FileShare } from './file-shares/entities/file-share.entity';

const staticModule = ServeStaticModule.forRoot({
  rootPath: join(process.cwd(), 'uploads'),
  serveRoot: '/uploads',
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'intellux_drive'),
        entities: [User, Organization, Invitation, File, FileShare],
        // Use migrations in production; synchronize for local dev
        synchronize: config.get('NODE_ENV') !== 'production',
        migrations: ['dist/database/migrations/*.js'],
        logging: false,
        charset: 'utf8mb4',
      }),
    }),
    // Only serve local uploads when S3 is NOT configured
    ...(process.env.AWS_S3_BUCKET ? [] : [staticModule]),
    StorageModule,
    AuthModule,
    UsersModule,
    InvitationsModule,
    FilesModule,
    FileSharesModule,
  ],
})
export class AppModule {}
