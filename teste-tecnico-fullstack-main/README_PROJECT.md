# Intellux Drive — Full Stack Multi-tenant File Management

## Stack
- **Backend:** NestJS + TypeORM + MySQL
- **Frontend:** React 18 + Vite + Sass + React Hook Form + Zod + Zustand
- **Database:** MySQL 8.0

## Rodar Localmente

### 1. Banco de Dados (MySQL)
```bash
# Se usar Docker:
docker compose up -d

# Se usar MySQL local instalado, iniciar o serviço:
net start MySQL80  # Windows (como Admin)
sudo service mysql start  # Linux/WSL

# Criar banco e usuário:
mysql -u root -pSUASSENHA -e "
  CREATE DATABASE IF NOT EXISTS intellux_drive CHARACTER SET utf8mb4;
  CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED BY 'intellux123';
  GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%';
  FLUSH PRIVILEGES;
"
```

### 2. Backend (NestJS)
```bash
cd backend
npm install
cp .env.example .env  # Edite as variáveis conforme necessário

# Criar Super Admin (seed):
npm run seed

# Iniciar em desenvolvimento:
npm run start:dev
```

API disponível em: http://localhost:3001
Swagger: http://localhost:3001/api/docs

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em: http://localhost:5173

## Seed — Criar Super Admin
```bash
cd backend
npm run seed
# Cria: email=admin@intellux.com senha=Admin@123456
```

## Variáveis de Ambiente (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=intellux
DB_PASSWORD=intellux123
DB_DATABASE=intellux_drive
JWT_SECRET=sua_chave_secreta_jwt
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Fluxo de Uso

1. Login como Super Admin → Enviar convite de Owner → Copiar link
2. Acessar link de ativação → Criar conta de Owner + nome da org
3. Login como Owner → Enviar convite de User → Copiar link
4. Acessar link de ativação → Criar conta de User
5. Owner/User: Upload de arquivos, visualizar, compartilhar

## Endpoints Principais

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | /auth/login | - | Login |
| POST | /auth/activate | - | Ativar conta via token |
| GET | /auth/validate-token?token= | - | Validar token de convite |
| POST | /invitations/owner | Super Admin | Convidar Owner |
| POST | /invitations/user | Owner | Convidar User |
| GET | /invitations | Owner/Admin | Listar convites |
| GET | /invitations/stats | Owner/Admin | Estatísticas |
| GET | /users/org-members | Owner/User | Membros da org |
| POST | /files/upload/text | Owner/User | Upload texto |
| POST | /files/upload/image | Owner/User | Upload imagem |
| GET | /files | Owner/User | Listar arquivos |
| GET | /files/search?q= | Owner/User | Buscar arquivos |
| PATCH | /files/:id | Owner/User | Renomear arquivo |
| DELETE | /files/:id | Owner | Excluir arquivo |
| POST | /file-shares/:fileId | Owner/User | Compartilhar |
| GET | /file-shares/:fileId | Owner/User | Ver compartilhamentos |
| DELETE | /file-shares/revoke/:shareId | Owner/User | Revogar |

## Testes
```bash
cd backend
npm test
# 23 testes unitários passando
```
