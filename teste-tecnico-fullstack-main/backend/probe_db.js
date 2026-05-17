const mysql2 = require('mysql2/promise');

const attempts = [
  { user: 'root', password: '' },
  { user: 'root', password: 'root' },
  { user: 'root', password: '1234' },
  { user: 'root', password: '12345' },
  { user: 'root', password: '123456' },
  { user: 'root', password: 'mysql' },
  { user: 'root', password: 'admin' },
  { user: 'root', password: 'password' },
  { user: 'root', password: 'Root@1234' },
  { user: 'root', password: 'Mysql@1234' },
  { user: 'root', password: 'MySQL80' },
  { user: 'root', password: 'intellux' },
  { user: 'root', password: 'diego' },
  { user: 'root', password: 'root123' },
  { user: 'root', password: 'root@123' },
];

(async () => {
  for (const { user, password } of attempts) {
    try {
      const conn = await mysql2.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user,
        password,
        connectTimeout: 3000,
        authPlugins: { caching_sha2_password: () => () => Buffer.alloc(0) },
      });
      const [rows] = await conn.query('SELECT version() as v');
      console.log(`SUCCESS! user=${user} pwd=${password} MySQL=${rows[0].v}`);

      // Setup database
      await conn.query('CREATE DATABASE IF NOT EXISTS intellux_drive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      await conn.query("CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED WITH mysql_native_password BY 'intellux123'");
      await conn.query("GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%'");
      await conn.query('FLUSH PRIVILEGES');
      console.log('Database intellux_drive created!');
      console.log('User intellux created with password intellux123!');
      await conn.end();
      process.exit(0);
    } catch (e) {
      console.log(`FAIL ${user}/${password}: ${e.message.substring(0, 50)}`);
    }
  }
  console.log('All attempts failed');
  process.exit(1);
})();
