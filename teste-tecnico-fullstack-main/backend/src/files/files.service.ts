import {
  Injectable, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileType } from './entities/file.entity';
import { FileShare } from '../file-shares/entities/file-share.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File) private readonly fileRepo: Repository<File>,
    @InjectRepository(FileShare) private readonly shareRepo: Repository<FileShare>,
    private readonly storage: StorageService,
  ) {}

  async upload(actor: User, file: Express.Multer.File, type: FileType) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin cannot upload files');
    }

    const folder = type === FileType.IMAGE ? 'images' : 'texts';
    const { storedName, filePath } = await this.storage.save(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );

    const newFile = this.fileRepo.create({
      originalName: file.originalname,
      storedName,
      filePath,
      type,
      size: file.size,
      mimeType: file.mimetype,
      organizationId: actor.organizationId as string,
      uploadedById: actor.id,
    });
    return this.fileRepo.save(newFile) as Promise<File>;
  }

  async findAll(
    actor: User,
    type?: FileType,
    startDate?: string,
    endDate?: string,
    uploadedById?: string,
  ) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin cannot access files');
    }

    const qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploader')
      .where('file.organization_id = :orgId', { orgId: actor.organizationId });

    if (actor.role === UserRole.USER) {
      const sharedFiles = await this.shareRepo.find({
        where: { sharedWithId: actor.id },
        select: ['fileId'],
      });
      const sharedFileIds = sharedFiles.map(s => s.fileId);

      if (sharedFileIds.length > 0) {
        qb.andWhere(
          '(file.uploaded_by_id = :userId OR file.id IN (:...sharedIds))',
          { userId: actor.id, sharedIds: sharedFileIds },
        );
      } else {
        qb.andWhere('file.uploaded_by_id = :userId', { userId: actor.id });
      }
    }

    if (type) qb.andWhere('file.type = :type', { type });
    if (startDate) qb.andWhere('file.uploaded_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('file.uploaded_at <= :endDate', { endDate: endDate + ' 23:59:59' });

    if (actor.role === UserRole.OWNER && uploadedById) {
      qb.andWhere('file.uploaded_by_id = :uploadedById', { uploadedById });
    }

    const files = await qb.orderBy('file.uploaded_at', 'DESC').getMany();

    const sharedFileIds = await this.getSharedFileIds(actor.id);
    return files.map(f => ({
      ...f,
      isShared: sharedFileIds.includes(f.id) && f.uploadedById !== actor.id,
    }));
  }

  async searchFiles(actor: User, query: string, type?: FileType) {
    if (actor.role === UserRole.SUPER_ADMIN) throw new ForbiddenException();

    const qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploader')
      .where('file.organization_id = :orgId', { orgId: actor.organizationId })
      .andWhere('file.original_name LIKE :query', { query: `%${query}%` });

    if (type) qb.andWhere('file.type = :type', { type });

    if (actor.role === UserRole.USER) {
      const sharedFiles = await this.shareRepo.find({
        where: { sharedWithId: actor.id },
        select: ['fileId'],
      });
      const ids = sharedFiles.map(s => s.fileId);
      if (ids.length > 0) {
        qb.andWhere('(file.uploaded_by_id = :uid OR file.id IN (:...ids))', {
          uid: actor.id, ids,
        });
      } else {
        qb.andWhere('file.uploaded_by_id = :uid', { uid: actor.id });
      }
    }

    return qb.orderBy('file.uploaded_at', 'DESC').getMany();
  }

  async updateMetadata(id: string, originalName: string, actor: User) {
    const file = await this.getFileInScope(id, actor);
    await this.fileRepo.update(id, { originalName });
    return { ...file, originalName };
  }

  async deleteFile(id: string, actor: User) {
    const file = await this.fileRepo.findOne({
      where: { id, organizationId: actor.organizationId as string },
    });
    if (!file) throw new NotFoundException('File not found');

    if (actor.role === UserRole.USER) {
      throw new ForbiddenException('Users cannot delete files');
    }

    await this.storage.remove(file.filePath);
    await this.shareRepo.delete({ fileId: id });
    await this.fileRepo.delete(id);
    return { message: 'File deleted successfully' };
  }

  private async getFileInScope(id: string, actor: User): Promise<File> {
    const file = await this.fileRepo.findOne({
      where: { id, organizationId: actor.organizationId as string },
    });
    if (!file) throw new NotFoundException('File not found');

    if (actor.role === UserRole.USER && file.uploadedById !== actor.id) {
      throw new ForbiddenException('You can only edit your own files');
    }
    return file;
  }

  private async getSharedFileIds(userId: string): Promise<string[]> {
    const shares = await this.shareRepo.find({
      where: { sharedWithId: userId },
      select: ['fileId'],
    });
    return shares.map(s => s.fileId);
  }
}
