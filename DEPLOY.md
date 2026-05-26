# LoafRate Remote Server Deploy

This guide assumes a Linux server with Docker Engine and Docker Compose v2.

## 1. Prepare the server

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
```

Install Docker using the official Docker instructions for your distro, then verify:

```bash
docker --version
docker compose version
```

## 2. Copy project and configure env

```bash
git clone <your-repo-url> loafmaxxing
cd loafmaxxing
cp .env.example .env
```

Edit `.env` for production:

```env
DOMAIN=loafrate.example.com
NEXT_PUBLIC_API_URL=/api
PUBLIC_BACKEND_URL=https://loafrate.example.com/api
CORS_ORIGINS=https://loafrate.example.com,https://www.loafrate.example.com
LOAF_MODEL_TYPE=mock
INSTALL_LOCAL_VLM=false
```

For Gemini cloud inference:

```env
LOAF_MODEL_TYPE=cloud
GEMINI_API_KEY=your_key_here
GEMINI_MODEL_ID=gemini-2.5-flash
```

For local VLM inference:

```env
LOAF_MODEL_TYPE=local
INSTALL_LOCAL_VLM=true
LOAF_HF_MODEL_ID=Qwen/Qwen2-VL-2B-Instruct
LOAF_MODEL_PATH=/app/models/qwen2-vl-2b
USE_CUDA=false
```

On GPU servers, install `nvidia-container-toolkit`, set `USE_CUDA=true`, and add GPU runtime settings if your Docker setup requires them.

## 3. Start HTTP production stack

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

The HTTP stack serves:

- Frontend: `http://your-domain/`
- Backend API through nginx: `http://your-domain/api/`
- Health check: `http://your-domain/health`

## 4. Issue Let's Encrypt certificate

Make sure DNS A/AAAA records point to the server and port 80 is open.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile ssl run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d loafrate.example.com \
  -d www.loafrate.example.com \
  --email you@example.com \
  --agree-tos \
  --no-eff-email
```

Then copy the SSL example and replace the example domain:

```bash
cp nginx/conf.d/loafrate-ssl.conf.example nginx/conf.d/loafrate-ssl.conf
sed -i 's/loafrate.example.com/your-domain.com/g' nginx/conf.d/loafrate-ssl.conf
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

After SSL is enabled, update `.env`:

```env
NEXT_PUBLIC_API_URL=/api
PUBLIC_BACKEND_URL=https://your-domain.com/api
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## 5. Download a local model

For native host download:

```bash
cd backend
python download_model.py
```

For Docker-based local inference, place the downloaded model under `backend/models/<model-dir>` and set:

```env
LOAF_MODEL_PATH=/app/models/<model-dir>
LOAF_MODEL_TYPE=local
INSTALL_LOCAL_VLM=true
```

Then rebuild:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build backend
```

## 6. Maintenance

View logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

Update app:

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Stop stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```
