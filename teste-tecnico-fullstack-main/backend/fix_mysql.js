const { execSync } = require('child_process');

// Try to fix MySQL auth via WSL
try {
  const cmd = `wsl -d Ubuntu -- sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root123'; CREATE DATABASE IF NOT EXISTS intellux_drive CHARACTER SET utf8mb4; CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED BY 'intellux123'; GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%'; FLUSH PRIVILEGES;" 2>&1`;
  const result = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
  console.log('Result:', result);
  console.log('MySQL fix applied!');
} catch (e) {
  console.log('WSL command error:', e.message);

  // Try mariadb
  try {
    const cmd2 = `wsl -d Ubuntu -- sudo mariadb -e "CREATE DATABASE IF NOT EXISTS intellux_drive; CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED BY 'intellux123'; GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%'; FLUSH PRIVILEGES;" 2>&1`;
    const result2 = execSync(cmd2, { encoding: 'utf8', timeout: 15000 });
    console.log('MariaDB result:', result2);
  } catch (e2) {
    console.log('MariaDB error:', e2.message);
  }
}
