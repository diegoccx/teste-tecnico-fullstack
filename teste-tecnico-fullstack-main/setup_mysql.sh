#!/bin/bash
if ! command -v mysql &> /dev/null; then
  echo "Installing MySQL..."
  sudo apt-get update -qq
  sudo apt-get install -y mysql-server
fi
sudo service mysql start
sleep 2
sudo mysql -e "
  CREATE DATABASE IF NOT EXISTS intellux_drive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED BY 'intellux123';
  GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%';
  FLUSH PRIVILEGES;
" 2>/dev/null
mysql --version
echo "Testing connection..."
mysql -u intellux -pintelux123 intellux_drive -e "SELECT 'OK' as status;" 2>/dev/null && echo "DB_CONNECTED_OK" || echo "DB_CONN_FAILED"
