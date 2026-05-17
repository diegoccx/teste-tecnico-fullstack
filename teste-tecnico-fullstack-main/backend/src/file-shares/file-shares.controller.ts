import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';
import { FileSharesService } from './file-shares.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/entities/user.entity';

class ShareFileDto {
  @IsArray()
  @IsUUID(4, { each: true })
  userIds: string[];
}

@ApiTags('File Shares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('file-shares')
export class FileSharesController {
  constructor(private readonly fileSharesService: FileSharesService) {}

  @Post(':fileId')
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'Share a file with one or more org members' })
  shareFile(
    @Param('fileId') fileId: string,
    @Body() dto: ShareFileDto,
    @CurrentUser() user: User,
  ) {
    return this.fileSharesService.shareFile(fileId, dto.userIds, user);
  }

  @Get(':fileId')
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'Get all shares for a file' })
  getShares(@Param('fileId') fileId: string, @CurrentUser() user: User) {
    return this.fileSharesService.getSharesForFile(fileId, user);
  }

  @Delete('revoke/:shareId')
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'Revoke a file share' })
  revoke(@Param('shareId') shareId: string, @CurrentUser() user: User) {
    return this.fileSharesService.revokeShare(shareId, user);
  }
}
