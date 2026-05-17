import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getOrgMembers(actor: User) {
    if (!actor.organizationId) throw new ForbiddenException('No organization');
    return this.userRepo.find({
      where: { organizationId: actor.organizationId as string, isActive: true },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    });
  }

  async getOrgStats(actor: User) {
    if (actor.role !== UserRole.OWNER) throw new ForbiddenException();
    const total = await this.userRepo.count({
      where: { organizationId: actor.organizationId as string, isActive: true },
    });
    return { totalActiveUsers: total };
  }
}
