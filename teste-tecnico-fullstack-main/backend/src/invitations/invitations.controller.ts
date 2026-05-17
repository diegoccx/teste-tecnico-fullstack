import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/entities/user.entity';

class InviteOwnerDto {
  @IsEmail()
  email: string;
}

class InviteUserDto {
  @IsEmail()
  email: string;
}

@ApiTags('Invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('owner')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Super Admin invites a new Owner' })
  inviteOwner(@Body() dto: InviteOwnerDto, @CurrentUser() user: User) {
    return this.invitationsService.createOwnerInvitation(dto.email, user);
  }

  @Post('user')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Owner invites a new User to their organization' })
  inviteUser(@Body() dto: InviteUserDto, @CurrentUser() user: User) {
    return this.invitationsService.createUserInvitation(dto.email, user);
  }

  @Get()
  @ApiOperation({ summary: 'List invitations (scoped by role)' })
  list(@CurrentUser() user: User) {
    return this.invitationsService.listInvitations(user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get invitation/org stats (scoped by role)' })
  stats(@CurrentUser() user: User) {
    return this.invitationsService.getStats(user);
  }
}
