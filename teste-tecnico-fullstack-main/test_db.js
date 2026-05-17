const mysql = require('mysql2/promise');

async function testAndSetup() {
  // Try root first to create user/db
  const configs = [
    { user: 'root', password: '', database: null },
    { user: 'root', password: 'root123', database: null },
    { user: 'root', password: 'root', database: null },
    { user: 'intellux', password: 'intellux123', database: 'intellux_drive' },
  ];

  for (const cfg of configs) {
    try {
      const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database || undefined,
        connectTimeout: 5000,
      });
      console.log(`Connected as ${cfg.user}`);

      if (cfg.user === 'root') {
        await conn.query(`CREATE DATABASE IF NOT EXISTS intellux_drive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await conn.query(`CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED BY 'intellux123'`);
        await conn.query(`GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%'`);
        await conn.query(`FLUSH PRIVILEGES`);
        console.log('Database and user created!');
      } else {
        const [rows] = await conn.query('SELECT DATABASE() as db');
        console.log('Connected to:', rows[0].db);
      }

      await conn.end();
      console.log('SUCCESS');
      return true;
    } catch (e) {
      console.log(`Failed with ${cfg.user}: ${e.message}`);
    }
  }
  return false;
}

testAndSetup().then(ok => {
  console.log(ok ? 'DB SETUP COMPLETE' : 'DB SETUP FAILED');
  process.exit(ok ? 0 : 1);
});
