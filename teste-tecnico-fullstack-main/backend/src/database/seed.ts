import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { File } from '../files/entities/file.entity';
import { FileShare } from '../file-shares/entities/file-share.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'intellux',
  password: process.env.DB_PASSWORD || 'intellux123',
  database: process.env.DB_DATABASE || 'intellux_drive',
  entities: [User, Organization, Invitation, File, FileShare],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database');

  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({
    where: { email: 'admin@intellux.com' },
  });

  if (existing) {
    console.log('Super Admin already exists:', existing.email);
    await dataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  const superAdmin = userRepo.create({
    name: 'Super Admin',
    email: 'admin@intellux.com',
    passwordHash,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
  });

  await userRepo.save(superAdmin);
  console.log('✅ Super Admin created successfully!');
  console.log('   Email: admin@intellux.com');
  console.log('   Password: Admin@123456');

  await dataSource.destroy();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
