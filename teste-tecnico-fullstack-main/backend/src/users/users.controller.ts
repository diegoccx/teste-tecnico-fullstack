import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('org-members')
  @Roles(UserRole.OWNER, UserRole.USER)
  @ApiOperation({ summary: 'List all members of the authenticated user organization' })
  getOrgMembers(@CurrentUser() user: User) {
    return this.usersService.getOrgMembers(user);
  }

  @Get('org-stats')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get org user stats for Owner dashboard' })
  getOrgStats(@CurrentUser() user: User) {
    return this.usersService.getOrgStats(user);
  }
}
