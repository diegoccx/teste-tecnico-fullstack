const mysql = require('mysql2/promise');

async function testAndSetup() {
  const configs = [
    { user: 'root', password: '' },
    { user: 'root', password: 'root' },
    { user: 'root', password: 'root123' },
    { user: 'intellux', password: 'intellux123' },
  ];

  for (const cfg of configs) {
    try {
      const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: cfg.user,
        password: cfg.password,
        connectTimeout: 5000,
      });
      console.log('Connected as ' + cfg.user);

      if (cfg.user === 'root') {
        await conn.query('CREATE DATABASE IF NOT EXISTS intellux_drive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await conn.query("CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED BY 'intellux123'");
        await conn.query("GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%'");
        await conn.query('FLUSH PRIVILEGES');
        console.log('DB intellux_drive created, user intellux granted');
      } else {
        const [rows] = await conn.query('SHOW DATABASES');
        console.log('Databases:', rows.map(r => Object.values(r)[0]).join(', '));
      }

      await conn.end();
      console.log('DB_SETUP_SUCCESS');
      return true;
    } catch (e) {
      console.log('FAIL ' + cfg.user + ': ' + e.message.substring(0, 60));
    }
  }
  return false;
}

testAndSetup().then(ok => {
  process.exit(ok ? 0 : 1);
});
