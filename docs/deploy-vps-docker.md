# Deploy em VPS com Docker

Este projeto e um app Next.js com Prisma e PostgreSQL. O setup abaixo sobe o app e um Postgres local na VPS.

## 1. Preparar a VPS

Instale Docker e Docker Compose, clone o repositorio e entre na pasta do projeto.

```bash
git clone <url-do-repositorio> nacho-man
cd nacho-man
cp .env.production.example .env.production
```

Edite `.env.production` com os valores reais. Gere segredos com:

```bash
openssl rand -base64 48
```

Preencha pelo menos:

- `POSTGRES_PASSWORD`
- `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `CLOUDINARY_*`
- `SAIPOS_DATA_API_TOKEN`, se a integracao Saipos for usada
- `SMTP_*`, se envio de email for usado

## 2. Subir o banco local

```bash
docker compose --env-file .env.production up -d db
```

Se voce vai migrar dados de outro Postgres/Supabase, restaure o dump antes de subir o app. Exemplo:

```bash
mkdir -p backups
cp backup.dump backups/backup.dump
docker compose --env-file .env.production exec -T db pg_restore -U nachoman -d nachoman --clean --if-exists --no-owner /backups/backup.dump
```

Para dump em SQL puro:

```bash
cp backup.sql backups/backup.sql
docker compose --env-file .env.production exec -T db psql -U nachoman -d nachoman -f /backups/backup.sql
```

## 3. Aplicar o schema Prisma

O repositorio atualmente nao tem migrations versionadas do Prisma, entao o comando de deploy usa `prisma db push`.

```bash
docker compose --env-file .env.production --profile tools run --rm migrate
```

Se a base restaurada ja estiver exatamente no schema atual, esse comando deve apenas confirmar o estado.

## 4. Build e start do app

```bash
docker compose --env-file .env.production up -d --build app
docker compose --env-file .env.production ps
```

O app fica disponivel em `http://IP_DA_VPS:3000`, ou na porta definida por `APP_PORT`.

Teste o healthcheck:

```bash
curl http://localhost:3000/api/health
```

## 5. Atualizar depois de enviar novas mudancas

```bash
git pull
docker compose --env-file .env.production build app migrate
docker compose --env-file .env.production --profile tools run --rm migrate
docker compose --env-file .env.production up -d app
```

## 6. Proxy reverso

Use Nginx, Caddy ou Traefik apontando para `127.0.0.1:3000`. Configure SSL e deixe `NEXT_PUBLIC_SITE_URL` com a URL final em HTTPS.

Exemplo Nginx:

```nginx
server {
  server_name seudominio.com.br;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 7. Backup do banco na VPS

```bash
mkdir -p backups
docker compose --env-file .env.production exec -T db pg_dump -U nachoman -d nachoman -Fc > backups/nachoman-$(date +%F).dump
```

Guarde os backups fora da VPS tambem.
