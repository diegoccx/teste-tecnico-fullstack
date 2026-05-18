import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`organizations\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(200) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`email\` varchar(200) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`role\` enum('super_admin','owner','user') NOT NULL DEFAULT 'user',
        \`organization_id\` varchar(36) NULL,
        \`is_active\` tinyint NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_users_organization\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`invitations\` (
        \`id\` varchar(36) NOT NULL,
        \`email\` varchar(200) NOT NULL,
        \`token\` varchar(255) NOT NULL,
        \`role\` enum('super_admin','owner','user') NOT NULL,
        \`organization_id\` varchar(36) NULL,
        \`invited_by_id\` varchar(36) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`accepted_at\` datetime NULL,
        \`status\` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_invitations_token\` (\`token\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_invitations_organization\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_invitations_invitedBy\` FOREIGN KEY (\`invited_by_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`files\` (
        \`id\` varchar(36) NOT NULL,
        \`original_name\` varchar(500) NOT NULL,
        \`stored_name\` varchar(500) NOT NULL,
        \`file_path\` varchar(1000) NOT NULL,
        \`size\` bigint NOT NULL,
        \`mime_type\` varchar(200) NOT NULL,
        \`type\` enum('text','image') NOT NULL,
        \`organization_id\` varchar(36) NOT NULL,
        \`uploaded_by_id\` varchar(36) NOT NULL,
        \`uploaded_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_files_organization\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_files_uploadedBy\` FOREIGN KEY (\`uploaded_by_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`file_shares\` (
        \`id\` varchar(36) NOT NULL,
        \`file_id\` varchar(36) NOT NULL,
        \`shared_by_id\` varchar(36) NOT NULL,
        \`shared_with_id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_file_shares_unique\` (\`file_id\`, \`shared_with_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_file_shares_file\` FOREIGN KEY (\`file_id\`) REFERENCES \`files\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_file_shares_sharedBy\` FOREIGN KEY (\`shared_by_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_file_shares_sharedWith\` FOREIGN KEY (\`shared_with_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`file_shares\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`files\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`invitations\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`organizations\``);
  }
}
