import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Invitation, InvitationStatus } from '../invitations/entities/invitation.entity';

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});
const mockOrgRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
});
const mockInvRepo = () => ({
  findOne: jest.fn(),
  update: jest.fn(),
});
const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let orgRepo: ReturnType<typeof mockOrgRepo>;
  let invRepo: ReturnType<typeof mockInvRepo>;
  let jwtService: ReturnType<typeof mockJwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: getRepositoryToken(Organization), useFactory: mockOrgRepo },
        { provide: getRepositoryToken(Invitation), useFactory: mockInvRepo },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    orgRepo = module.get(getRepositoryToken(Organization));
    invRepo = module.get(getRepositoryToken(Invitation));
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('should return access_token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-uuid',
        email: 'test@test.com',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        name: 'Test User',
        organizationId: null,
      };

      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.login('test@test.com', 'password123');

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@test.com');
      expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      userRepo.findOne.mockResolvedValue({
        email: 'test@test.com',
        passwordHash,
        isActive: true,
      });

      await expect(service.login('test@test.com', 'wrong-password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.login('noone@test.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      userRepo.findOne.mockResolvedValue({
        email: 'test@test.com',
        passwordHash,
        isActive: false,
      });

      await expect(service.login('test@test.com', 'password123'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('should return invitation info for valid token', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      invRepo.findOne.mockResolvedValue({
        email: 'owner@test.com',
        role: UserRole.OWNER,
        status: InvitationStatus.PENDING,
        expiresAt: futureDate,
        organization: null,
      });

      const result = await service.validateToken('valid-uuid-token');
      expect(result.email).toBe('owner@test.com');
      expect(result.role).toBe(UserRole.OWNER);
    });

    it('should throw BadRequestException for expired token', async () => {
      const pastDate = new Date(Date.now() - 1000);
      invRepo.findOne.mockResolvedValue({
        status: InvitationStatus.PENDING,
        expiresAt: pastDate,
      });

      await expect(service.validateToken('expired-token'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already-accepted token', async () => {
      invRepo.findOne.mockResolvedValue({
        status: InvitationStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 1000),
      });

      await expect(service.validateToken('used-token'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-existent token', async () => {
      invRepo.findOne.mockResolvedValue(null);
      await expect(service.validateToken('bad-token'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
