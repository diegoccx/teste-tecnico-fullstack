const mysql2 = require('mysql2/promise');

(async () => {
  const conn = await mysql2.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'CCX@die131417',
    connectTimeout: 5000,
  });
  console.log('Connected to MySQL!');

  await conn.query('CREATE DATABASE IF NOT EXISTS intellux_drive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.query("CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED WITH mysql_native_password BY 'intellux123'");
  await conn.query("GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%'");
  await conn.query('FLUSH PRIVILEGES');

  const [dbs] = await conn.query('SHOW DATABASES');
  console.log('Databases:', dbs.map(r => Object.values(r)[0]).join(', '));
  await conn.end();
  console.log('DATABASE SETUP COMPLETE!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
