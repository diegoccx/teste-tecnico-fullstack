import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`organizations\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(200) NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(200) NOT NULL,
        \`email\` varchar(200) NOT NULL,
        \`passwordHash\` varchar(255) NOT NULL,
        \`role\` enum('super_admin','owner','user') NOT NULL DEFAULT 'user',
        \`isActive\` tinyint NOT NULL DEFAULT 0,
        \`organizationId\` varchar(36) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_users_organization\` FOREIGN KEY (\`organizationId\`) REFERENCES \`organizations\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`invitations\` (
        \`id\` varchar(36) NOT NULL,
        \`email\` varchar(200) NOT NULL,
        \`token\` varchar(100) NOT NULL,
        \`role\` enum('owner','user') NOT NULL,
        \`status\` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
        \`expiresAt\` datetime NOT NULL,
        \`organizationId\` varchar(36) NULL,
        \`invitedById\` varchar(36) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_invitations_token\` (\`token\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_invitations_organization\` FOREIGN KEY (\`organizationId\`) REFERENCES \`organizations\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_invitations_invitedBy\` FOREIGN KEY (\`invitedById\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`drive_files\` (
        \`id\` varchar(36) NOT NULL,
        \`originalName\` varchar(500) NOT NULL,
        \`storedName\` varchar(500) NOT NULL,
        \`filePath\` varchar(1000) NOT NULL,
        \`mimeType\` varchar(100) NOT NULL,
        \`size\` int NOT NULL,
        \`type\` enum('text','image') NOT NULL,
        \`organizationId\` varchar(36) NOT NULL,
        \`uploadedById\` varchar(36) NOT NULL,
        \`uploadedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_drive_files_organization\` FOREIGN KEY (\`organizationId\`) REFERENCES \`organizations\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_drive_files_uploadedBy\` FOREIGN KEY (\`uploadedById\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`file_shares\` (
        \`id\` varchar(36) NOT NULL,
        \`fileId\` varchar(36) NOT NULL,
        \`sharedWithId\` varchar(36) NOT NULL,
        \`sharedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_file_shares_unique\` (\`fileId\`, \`sharedWithId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_file_shares_file\` FOREIGN KEY (\`fileId\`) REFERENCES \`drive_files\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_file_shares_sharedWith\` FOREIGN KEY (\`sharedWithId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`file_shares\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`drive_files\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`invitations\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`organizations\``);
  }
}
