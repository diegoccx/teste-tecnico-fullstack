# Intellux Drive

Sistema de gerenciamento de arquivos multi-tenant com hierarquia de convites. Cada organização tem isolamento completo de dados — arquivos, usuários e compartilhamentos nunca cruzam boundaries entre tenants.

> **Deploy:** [https://intellux-drive.vercel.app](https://intellux-drive.vercel.app) · API: [https://intellux-drive-api.up.railway.app](https://intellux-drive-api.up.railway.app)
>
> *(URLs de exemplo — substitua com seus links reais após o deploy)*

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 10 + TypeORM + MySQL 8 |
| Frontend | React 18 + Vite + Sass + React Hook Form + Zod |
| Armazenamento | AWS S3 (Free Tier) com fallback para disco local |
| Autenticação | JWT + Passport |
| Deploy | Vercel (frontend) + Railway/AWS EC2 (backend) |

---

## Rodando localmente

### Pré-requisitos

- Node.js v18+
- MySQL 8.0 rodando na porta 3306

### 1. Banco de dados

Se estiver usando Docker:

```bash
docker compose up -d
```

Se já tiver MySQL instalado:

```bash
# Windows (como Admin)
net start MySQL80

# Criar banco e usuário
mysql -u root -pSUASENHA -e "
  CREATE DATABASE IF NOT EXISTS intellux_drive CHARACTER SET utf8mb4;
  CREATE USER IF NOT EXISTS 'intellux'@'%' IDENTIFIED BY 'intellux123';
  GRANT ALL PRIVILEGES ON intellux_drive.* TO 'intellux'@'%';
  FLUSH PRIVILEGES;
"
```

Ou use o script utilitário incluído:

```bash
cd backend
node setup_db.js
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais de banco

# Criar o Super Admin inicial
npm run seed

# Subir em modo dev (watch)
npm run start:dev
```

API: `http://localhost:3001`  
Swagger: `http://localhost:3001/api/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

---

## Seed — Super Admin

```bash
cd backend
npm run seed
# Cria: email=admin@intellux.com | senha=Admin@123456
```

---

## Variáveis de ambiente

### Backend (`backend/.env`)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=intellux
DB_PASSWORD=intellux123
DB_DATABASE=intellux_drive

JWT_SECRET=troque_por_uma_string_longa_e_aleatoria
JWT_EXPIRES_IN=7d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# AWS S3 — deixe vazio para usar armazenamento local
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
```

### Frontend (`frontend/.env`)

```env
# Deixe vazio em dev — o proxy do Vite cuida disso
# Em produção (Vercel), aponte para a URL da API
VITE_API_URL=
```

---

## Migrations

```bash
cd backend

# Gerar nova migration a partir das entidades
npm run migration:generate -- -d src/database/data-source.ts -n NomeDaMigration

# Executar migrations pendentes
npm run migration:run

# Reverter a última migration
npm run migration:revert
```

Em desenvolvimento, o banco é sincronizado automaticamente (`synchronize: true`). Em produção, defina `NODE_ENV=production` e as migrations serão usadas.

---

## AWS S3 (diferencial)

O armazenamento de arquivos suporta dois modos:

**Local (padrão):** uploads salvos em `./uploads/texts/` e `./uploads/images/`. Não requer configuração adicional.

**AWS S3 (Free Tier):** quando as variáveis `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` e `AWS_S3_BUCKET` estão configuradas, todos os uploads vão direto para o S3. Os arquivos ficam acessíveis via URL pública do S3. O ServeStatic local é desativado automaticamente.

Para configurar o bucket S3:

```bash
# Crie o bucket no console AWS ou via CLI
aws s3 mb s3://nome-do-bucket --region us-east-1

# Configure a política de acesso público (para servir arquivos diretamente)
# Veja: docs/s3-bucket-policy.json
```

---

## Endpoints principais

| Método | Rota | Auth | Role |
|---|---|---|---|
| POST | `/auth/login` | — | — |
| POST | `/auth/activate` | — | — |
| GET | `/auth/validate-token?token=` | — | — |
| POST | `/invitations/owner` | JWT | super_admin |
| POST | `/invitations/user` | JWT | owner |
| GET | `/invitations` | JWT | super_admin, owner |
| GET | `/invitations/stats` | JWT | super_admin, owner |
| GET | `/users/org-members` | JWT | owner, user |
| POST | `/files/upload/text` | JWT | owner, user |
| POST | `/files/upload/image` | JWT | owner, user |
| GET | `/files` | JWT | owner, user |
| GET | `/files/search?q=` | JWT | owner, user |
| PATCH | `/files/:id` | JWT | owner, user |
| DELETE | `/files/:id` | JWT | owner |
| POST | `/file-shares/:fileId` | JWT | owner, user |
| GET | `/file-shares/:fileId` | JWT | owner, user |
| DELETE | `/file-shares/revoke/:shareId` | JWT | owner, user |

Documentação completa via Swagger em `/api/docs`.

---

## Testes

```bash
cd backend
npm test
# 24 testes unitários — 3 suites (auth, files, invitations)
```

---

## Deploy

### Frontend → Vercel

1. Importe o repositório na Vercel
2. Configure o diretório raiz como `frontend`
3. Adicione a variável de ambiente `VITE_API_URL=https://sua-api.railway.app`
4. Deploy automático a cada push na main

### Backend → Railway / AWS EC2

**Railway:**
```bash
railway login
railway init
railway up
# Configure as variáveis de ambiente no dashboard
```

**AWS EC2 (Free Tier — t2.micro):**
```bash
# No servidor:
git clone <repo>
cd backend
cp .env.example .env  # edite as vars
npm ci
npm run build
npm run migration:run
npm start
```

O `Dockerfile` incluído pode ser usado para qualquer ambiente com suporte a contêiner.

---

## Fluxo de uso

```
Super Admin → POST /invitations/owner
           ← token UUID (48h)

Owner ativa conta → POST /auth/activate (+ nome da organização)
                 ← JWT

Owner → POST /invitations/user
      ← token UUID (48h)

User ativa conta → POST /auth/activate
               ← JWT

Owner/User → upload, compartilhamento, filtros
```
