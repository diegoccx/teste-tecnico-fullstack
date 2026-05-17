import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User, UserRole } from '../users/entities/user.entity';

const makeUser = (role: UserRole, orgId?: string): User => ({
  id: 'user-uuid',
  name: 'Test',
  email: 'test@test.com',
  passwordHash: 'hash',
  role,
  organizationId: orgId || null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  organization: null as any,
});

const mockInvRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

const mockOrgRepo = () => ({
  count: jest.fn(),
});

const mockUserRepo = () => ({
  findOne: jest.fn(),
});

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invRepo: ReturnType<typeof mockInvRepo>;
  let orgRepo: ReturnType<typeof mockOrgRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: getRepositoryToken(Invitation), useFactory: mockInvRepo },
        { provide: getRepositoryToken(Organization), useFactory: mockOrgRepo },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    invRepo = module.get(getRepositoryToken(Invitation));
    orgRepo = module.get(getRepositoryToken(Organization));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('createOwnerInvitation', () => {
    it('should throw ForbiddenException if not Super Admin', async () => {
      const owner = makeUser(UserRole.OWNER, 'org-1');
      await expect(service.createOwnerInvitation('test@test.com', owner))
        .rejects.toThrow(ForbiddenException);
    });

    it('should create invitation for Super Admin', async () => {
      const admin = makeUser(UserRole.SUPER_ADMIN);
      userRepo.findOne.mockResolvedValue(null);
      invRepo.findOne.mockResolvedValue(null);
      const mockInv = { id: 'inv-1', email: 'owner@test.com', token: 'uuid-token', role: UserRole.OWNER };
      invRepo.create.mockReturnValue(mockInv);
      invRepo.save.mockResolvedValue(mockInv);

      const result = await service.createOwnerInvitation('owner@test.com', admin);
      expect(invRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'owner@test.com', role: UserRole.OWNER }),
      );
      expect(result.email).toBe('owner@test.com');
    });

    it('should throw BadRequestException for duplicate pending invitation', async () => {
      const admin = makeUser(UserRole.SUPER_ADMIN);
      userRepo.findOne.mockResolvedValue(null);
      invRepo.findOne.mockResolvedValue({
        email: 'owner@test.com',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 1000),
      });

      await expect(service.createOwnerInvitation('owner@test.com', admin))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already-active user', async () => {
      const admin = makeUser(UserRole.SUPER_ADMIN);
      userRepo.findOne.mockResolvedValue(makeUser(UserRole.OWNER, 'org-1'));

      await expect(service.createOwnerInvitation('owner@test.com', admin))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('createUserInvitation', () => {
    it('should throw ForbiddenException if not Owner', async () => {
      const user = makeUser(UserRole.USER, 'org-1');
      await expect(service.createUserInvitation('user@test.com', user))
        .rejects.toThrow(ForbiddenException);
    });

    it('should create user invitation for Owner', async () => {
      const owner = makeUser(UserRole.OWNER, 'org-1');
      userRepo.findOne.mockResolvedValue(null);
      invRepo.findOne.mockResolvedValue(null);
      const mockInv = { id: 'inv-2', email: 'user@test.com', token: 'token-2', role: UserRole.USER };
      invRepo.create.mockReturnValue(mockInv);
      invRepo.save.mockResolvedValue(mockInv);

      const result = await service.createUserInvitation('user@test.com', owner);
      expect(result.email).toBe('user@test.com');
    });
  });

  describe('getStats', () => {
    it('should return Super Admin stats with org count and invite rate', async () => {
      const admin = makeUser(UserRole.SUPER_ADMIN);
      orgRepo.count.mockResolvedValue(5);
      invRepo.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7);

      const result = await service.getStats(admin);
      expect(result).toEqual({
        totalOrganizations: 5,
        totalOwnerInvitations: 10,
        acceptedOwnerInvitations: 7,
        acceptanceRate: 70,
      });
    });

    it('should return Owner stats', async () => {
      const owner = makeUser(UserRole.OWNER, 'org-1');
      invRepo.count
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      const result = await service.getStats(owner) as any;
      expect(result.totalInvitations).toBe(8);
      expect(result.acceptedInvitations).toBe(5);
      expect(result.pendingInvitations).toBe(3);
    });

    it('should throw ForbiddenException for regular user', async () => {
      const user = makeUser(UserRole.USER, 'org-1');
      await expect(service.getStats(user)).rejects.toThrow(ForbiddenException);
    });
  });
});
