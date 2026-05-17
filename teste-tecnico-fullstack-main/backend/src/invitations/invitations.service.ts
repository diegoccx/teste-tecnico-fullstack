import {
  Injectable, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation) private readonly invRepo: Repository<Invitation>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createOwnerInvitation(email: string, actor: User) {
    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can invite Owners');
    }
    return this.createInvitation(email, UserRole.OWNER, undefined, actor);
  }

  async createUserInvitation(email: string, actor: User) {
    if (actor.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only Owners can invite Users');
    }
    if (!actor.organizationId) {
      throw new BadRequestException('Owner has no organization');
    }
    return this.createInvitation(email, UserRole.USER, actor.organizationId, actor);
  }

  private async createInvitation(
    email: string,
    role: UserRole,
    organizationId: string | null | undefined,
    actor: User,
  ) {
    const existingUser = await this.userRepo.findOne({ where: { email, isActive: true } });
    if (existingUser) {
      throw new BadRequestException('A user with this email is already an active member');
    }

    const existing = await this.invRepo.findOne({
      where: { email, status: InvitationStatus.PENDING },
    });
    if (existing) {
      if (new Date() < existing.expiresAt) {
        throw new BadRequestException('A pending invitation already exists for this email');
      }
      await this.invRepo.update(existing.id, { status: InvitationStatus.EXPIRED });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = this.invRepo.create({
      email,
      token,
      role,
      organizationId: organizationId ?? null,
      invitedById: actor.id,
      expiresAt,
    });
    return this.invRepo.save(invitation);
  }

  async listInvitations(actor: User) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      return this.invRepo.find({
        where: { role: UserRole.OWNER },
        relations: ['invitedBy'],
        order: { createdAt: 'DESC' },
      });
    }
    if (actor.role === UserRole.OWNER) {
      return this.invRepo.find({
        where: { organizationId: actor.organizationId as string, role: UserRole.USER },
        relations: ['invitedBy'],
        order: { createdAt: 'DESC' },
      });
    }
    throw new ForbiddenException();
  }

  async getStats(actor: User) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      const totalOrgs = await this.orgRepo.count();
      const totalInvites = await this.invRepo.count({ where: { role: UserRole.OWNER } });
      const acceptedInvites = await this.invRepo.count({
        where: { role: UserRole.OWNER, status: InvitationStatus.ACCEPTED },
      });
      return {
        totalOrganizations: totalOrgs,
        totalOwnerInvitations: totalInvites,
        acceptedOwnerInvitations: acceptedInvites,
        acceptanceRate: totalInvites > 0 ? Math.round((acceptedInvites / totalInvites) * 100) : 0,
      };
    }
    if (actor.role === UserRole.OWNER) {
      const orgId = actor.organizationId as string;
      const total = await this.invRepo.count({ where: { organizationId: orgId } });
      const accepted = await this.invRepo.count({
        where: { organizationId: orgId, status: InvitationStatus.ACCEPTED },
      });
      const pending = await this.invRepo.count({
        where: { organizationId: orgId, status: InvitationStatus.PENDING },
      });
      return { totalInvitations: total, acceptedInvitations: accepted, pendingInvitations: pending };
    }
    throw new ForbiddenException();
  }
}
