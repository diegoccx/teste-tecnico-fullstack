import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { File } from '../../files/entities/file.entity';
import { User } from '../../users/entities/user.entity';

@Entity('file_shares')
@Unique(['fileId', 'sharedWithId'])
export class FileShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'file_id' })
  fileId: string;

  @ManyToOne(() => File, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: File;

  @Column({ name: 'shared_by_id' })
  sharedById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_by_id' })
  sharedBy: User;

  @Column({ name: 'shared_with_id' })
  sharedWithId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_with_id' })
  sharedWith: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
