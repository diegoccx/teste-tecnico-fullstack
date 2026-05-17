import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Invitation, InvitationStatus } from '../invitations/entities/invitation.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Invitation) private readonly invRepo: Repository<Invitation>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async activateAccount(token: string, name: string, password: string, organizationName?: string) {
    const invitation = await this.invRepo.findOne({
      where: { token },
      relations: ['organization'],
    });

    if (!invitation) throw new BadRequestException('Invalid invitation token');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation already used or expired');
    }
    if (new Date() > invitation.expiresAt) {
      await this.invRepo.update(invitation.id, { status: InvitationStatus.EXPIRED });
      throw new BadRequestException('Invitation token has expired');
    }

    const existing = await this.userRepo.findOne({ where: { email: invitation.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);

    let organizationId: string | undefined = invitation.organizationId ?? undefined;

    if (invitation.role === UserRole.OWNER && !organizationId) {
      if (!organizationName) throw new BadRequestException('Organization name is required for Owner activation');
      const org = this.orgRepo.create({ name: organizationName });
      const savedOrg = await this.orgRepo.save(org);
      organizationId = savedOrg.id;
    }

    const user = this.userRepo.create({
      name,
      email: invitation.email,
      passwordHash,
      role: invitation.role,
      organizationId,
      isActive: true,
    });
    const savedUser = (await this.userRepo.save(user)) as User;

    await this.invRepo.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    const jwtToken = this.jwtService.sign({
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      organizationId: savedUser.organizationId,
    });

    return {
      access_token: jwtToken,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        organizationId: savedUser.organizationId,
      },
    };
  }

  async validateToken(token: string) {
    const invitation = await this.invRepo.findOne({
      where: { token },
      relations: ['organization'],
    });
    if (!invitation) throw new BadRequestException('Invalid token');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Token already used');
    }
    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Token expired');
    }
    return {
      email: invitation.email,
      role: invitation.role,
      organization: invitation.organization,
      expiresAt: invitation.expiresAt,
    };
  }
}
