import {
  Injectable, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileShare } from './entities/file-share.entity';
import { File } from '../files/entities/file.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class FileSharesService {
  constructor(
    @InjectRepository(FileShare) private readonly shareRepo: Repository<FileShare>,
    @InjectRepository(File) private readonly fileRepo: Repository<File>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async shareFile(fileId: string, targetUserIds: string[], actor: User) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin cannot share files');
    }

    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    if (file.organizationId !== actor.organizationId) {
      throw new ForbiddenException('File does not belong to your organization');
    }

    if (actor.role === UserRole.USER && file.uploadedById !== actor.id) {
      throw new ForbiddenException('You can only share your own files');
    }

    const results: FileShare[] = [];
    for (const targetId of targetUserIds) {
      if (targetId === actor.id) continue;

      const target = await this.userRepo.findOne({ where: { id: targetId, isActive: true } });
      if (!target) throw new NotFoundException(`User ${targetId} not found`);

      if (target.organizationId !== actor.organizationId) {
        throw new ForbiddenException(
          `Cannot share with user from a different organization`,
        );
      }

      const existing = await this.shareRepo.findOne({
        where: { fileId, sharedWithId: targetId },
      });
      if (existing) {
        results.push(existing);
        continue;
      }

      const share = this.shareRepo.create({
        fileId,
        sharedById: actor.id,
        sharedWithId: targetId,
      });
      results.push(await this.shareRepo.save(share));
    }
    return { shared: results.length, results };
  }

  async getSharesForFile(fileId: string, actor: User) {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    if (file.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }

    return this.shareRepo.find({
      where: { fileId },
      relations: ['sharedWith'],
    });
  }

  async revokeShare(shareId: string, actor: User) {
    const share = await this.shareRepo.findOne({
      where: { id: shareId },
      relations: ['file'],
    });
    if (!share) throw new NotFoundException('Share not found');

    if (share.file.organizationId !== actor.organizationId) throw new ForbiddenException();

    if (actor.role === UserRole.USER && share.sharedById !== actor.id) {
      throw new ForbiddenException('Cannot revoke this share');
    }

    await this.shareRepo.delete(shareId);
    return { message: 'Share revoked' };
  }
}
