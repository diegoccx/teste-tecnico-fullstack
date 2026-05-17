import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';
import { File, FileType } from './entities/file.entity';
import { FileShare } from '../file-shares/entities/file-share.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';

const makeUser = (role: UserRole, orgId = 'org-1', userId = 'user-1'): User => ({
  id: userId,
  name: 'Test',
  email: 'test@test.com',
  passwordHash: 'hash',
  role,
  organizationId: orgId,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  organization: null as any,
});

const makeFile = (orgId = 'org-1', uploadedById = 'user-1'): File => ({
  id: 'file-1',
  originalName: 'test.txt',
  storedName: 'uuid-test.txt',
  filePath: './uploads/texts/uuid-test.txt',
  type: FileType.TEXT,
  size: 1024,
  mimeType: 'text/plain',
  organizationId: orgId,
  uploadedById,
  uploadedBy: makeUser(UserRole.USER, orgId, uploadedById),
  uploadedAt: new Date(),
  organization: null as any,
});

const mockFileRepo = () => ({
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockShareRepo = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockStorage = () => ({
  save: jest.fn().mockResolvedValue({ storedName: 'uuid.txt', filePath: './uploads/texts/uuid.txt' }),
  remove: jest.fn().mockResolvedValue(undefined),
  isS3Enabled: false,
});

describe('FilesService', () => {
  let service: FilesService;
  let fileRepo: ReturnType<typeof mockFileRepo>;
  let shareRepo: ReturnType<typeof mockShareRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: getRepositoryToken(File), useFactory: mockFileRepo },
        { provide: getRepositoryToken(FileShare), useFactory: mockShareRepo },
        { provide: StorageService, useFactory: mockStorage },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    fileRepo = module.get(getRepositoryToken(File));
    shareRepo = module.get(getRepositoryToken(FileShare));
  });

  describe('upload', () => {
    it('should throw ForbiddenException for Super Admin', async () => {
      const superAdmin = makeUser(UserRole.SUPER_ADMIN);
      const mockFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('content'),
        size: 100,
        mimetype: 'text/plain',
      } as Express.Multer.File;

      await expect(service.upload(superAdmin, mockFile, FileType.TEXT))
        .rejects.toThrow(ForbiddenException);
    });

    it('should create file record for Owner', async () => {
      const owner = makeUser(UserRole.OWNER);
      const mockMulterFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('hello world'),
        size: 1024,
        mimetype: 'text/plain',
      } as Express.Multer.File;

      const mockFileEntity = makeFile();
      fileRepo.create.mockReturnValue(mockFileEntity);
      fileRepo.save.mockResolvedValue(mockFileEntity);

      const result = await service.upload(owner, mockMulterFile, FileType.TEXT);

      expect(fileRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          uploadedById: 'user-1',
          type: FileType.TEXT,
        }),
      );
      expect(result.id).toBe('file-1');
    });
  });

  describe('deleteFile', () => {
    it('should allow Owner to delete files from their org', async () => {
      const owner = makeUser(UserRole.OWNER);
      const file = makeFile('org-1', 'other-user');
      fileRepo.findOne.mockResolvedValue(file);
      shareRepo.delete.mockResolvedValue({ affected: 0 });
      fileRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteFile('file-1', owner);
      expect(result.message).toBe('File deleted successfully');
    });

    it('should throw ForbiddenException if User tries to delete', async () => {
      const user = makeUser(UserRole.USER);
      fileRepo.findOne.mockResolvedValue(makeFile());

      await expect(service.deleteFile('file-1', user))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if file not in org', async () => {
      const owner = makeUser(UserRole.OWNER, 'org-2');
      fileRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteFile('file-1', owner))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMetadata', () => {
    it('should allow User to update their own file name', async () => {
      const user = makeUser(UserRole.USER, 'org-1', 'user-1');
      const file = makeFile('org-1', 'user-1');
      fileRepo.findOne.mockResolvedValue(file);
      fileRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateMetadata('file-1', 'new-name.txt', user);
      expect(result.originalName).toBe('new-name.txt');
    });

    it('should throw ForbiddenException if User tries to update someone else file', async () => {
      const user = makeUser(UserRole.USER, 'org-1', 'user-1');
      const file = makeFile('org-1', 'user-2');
      fileRepo.findOne.mockResolvedValue(file);

      await expect(service.updateMetadata('file-1', 'new-name.txt', user))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
