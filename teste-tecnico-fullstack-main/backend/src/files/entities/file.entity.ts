import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum FileType {
  TEXT = 'text',
  IMAGE = 'image',
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'original_name', length: 500 })
  originalName: string;

  @Column({ name: 'stored_name', length: 500 })
  storedName: string;

  @Column({ name: 'file_path', length: 1000 })
  filePath: string;

  @Column({ type: 'enum', enum: FileType })
  type: FileType;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ name: 'mime_type', length: 200 })
  mimeType: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'uploaded_by_id' })
  uploadedById: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
