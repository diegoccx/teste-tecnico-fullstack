import {
  Controller, Post, Get, Patch, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { FilesService } from './files.service';
import { FileType } from './entities/file.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/entities/user.entity';

const TEXT_EXTENSIONS = ['.txt', '.md', '.csv'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_SIZE = 10 * 1024 * 1024;

class UpdateFileDto {
  @IsString()
  originalName: string;
}

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload/text')
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'Upload a text file (.txt, .md, .csv)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (!TEXT_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) {
        return cb(new BadRequestException('Only .txt, .md and .csv files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: MAX_SIZE },
  }))
  uploadText(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
    if (!file) throw new BadRequestException('No file provided');
    return this.filesService.upload(user, file, FileType.TEXT);
  }

  @Post('upload/image')
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) {
        return cb(new BadRequestException('Only image files are allowed (.jpg, .png, .gif, .webp)'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: MAX_SIZE },
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
    if (!file) throw new BadRequestException('No file provided');
    return this.filesService.upload(user, file, FileType.IMAGE);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'List files (visibility scoped by role)' })
  list(
    @CurrentUser() user: User,
    @Query('type') type?: FileType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('uploadedById') uploadedById?: string,
  ) {
    return this.filesService.findAll(user, type, startDate, endDate, uploadedById);
  }

  @Get('search')
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'Search files by name' })
  search(
    @CurrentUser() user: User,
    @Query('q') q: string,
    @Query('type') type?: FileType,
  ) {
    return this.filesService.searchFiles(user, q || '', type);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'Update file name' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFileDto,
    @CurrentUser() user: User,
  ) {
    return this.filesService.updateMetadata(id, dto.originalName, user);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a file (Owner only)' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.filesService.deleteFile(id, user);
  }
}
