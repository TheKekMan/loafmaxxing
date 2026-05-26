# LoafRate 🍞😼

Evaluate your cat's loafness and tuck discipline with the world's most advanced looksmaxxing-inspired Neural Loaf Networks. Certified by the International Bread Institute.

## Core Features
* 🧬 **Paw Concealment Matrix (POW-10)**: Evaluates elbow and kickstand leakage.
* 📐 **Potato-Form Geometry (PFG)**: Evaluates spherical-cylindrical symmetry.
* 📦 **Compression Density Index**: Measures core mass-to-fluff packing ratio.
* 🧠 **Mental Loaf State**: Detects Zen vs Combat loafing behaviors.
* 🍞 **Sourdough Crust Toastiness**: Grades coat color, shine, and toastiness.
* **Public Share Pages**: Every analysis is saved to SQLite and can be opened at `/share/<id>`.
* **Compressed Uploads**: Uploaded photos are stored as optimized JPEG files for faster sharing.

---

## 🌐 Multi-Language Support
* 🇷🇺 **Полная поддержка русского языка**: переключатель языков (RU/EN) в шапке сайта. ИИ-анализ, вердикты, метрики и прожары будут сгенерированы на выбранном языке.

---

## 🐳 Docker Setup

You can run both the frontend and backend using Docker. Configure the VLM model type using environment variables:

### Model Modes Available:
1. **`mock`** (Default): Fast, deterministic, image-aware mock metrics. Ideal for development.
2. **`cloud`**: Real VLM analysis using Gemini API. Requires `GEMINI_API_KEY`.
3. **`local`**: Offline local VLM analysis using `Qwen2-VL-2B-Instruct`. Requires downloading the model first.

### Run with Mock VLM (Default):
```bash
docker compose up --build
```

### Run with Cloud VLM (Gemini):
Set `LOAF_MODEL_TYPE=cloud` and `GEMINI_API_KEY` on your host system:
* **PowerShell**:
  ```powershell
  $env:LOAF_MODEL_TYPE="cloud"
  $env:GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
  docker compose up --build
  ```
* **Bash**:
  ```bash
  LOAF_MODEL_TYPE=cloud GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere" docker compose up --build
  ```

### Run with Local VLM:
1. **Download the model**:
   Run the download helper script:
   ```bash
   python backend/download_model.py
   ```
   This will download `Qwen/Qwen2-VL-2B-Instruct` (~4.5 GB) into `backend/models/qwen2-vl-2b`.
2. **Start the containers** in local mode:
   * **PowerShell**:
     ```powershell
     $env:LOAF_MODEL_TYPE="local"
     docker compose up --build
     ```
   * **Bash**:
     ```bash
     LOAF_MODEL_TYPE=local docker compose up --build
     ```
   The local model will be volume-mounted and run on CPU/GPU depending on your system capability.

* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:8000](http://localhost:8000)
* **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

To stop the containers:
```bash
docker compose down
```

For remote production deployment with nginx, optional SSL, cloud/local model
settings, and server maintenance commands, see [DEPLOY.md](DEPLOY.md).

---

## 💻 Local Native Setup

If you prefer to run the services outside Docker, follow these instructions:

### 1. Backend (FastAPI)
Requires Python 3.11+.
```bash
cd backend
# Create virtual environment
py -m venv venv
# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\activate
# Install requirements
pip install -r requirements.txt
# Run the application
python main.py
```
*API runs at [http://localhost:8000](http://localhost:8000).*

### 2. Frontend (Next.js)
Requires Node.js 18+.
```bash
cd frontend
# Install dependencies
npm install
# Run in development mode
npm run dev
```
*App runs at [http://localhost:3000](http://localhost:3000).*

---

## 📁 Directory Structure
```
loafmaxxing/
├── backend/
│   ├── analyzer.py       # VLM model abstraction & mock metrics calculation
│   ├── main.py           # FastAPI server & route handlers
│   ├── requirements.txt  # Python requirements
│   ├── Dockerfile        # Backend container file
│   └── uploads/          # Local uploads directory (bind-mounted in Docker)
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx      # Main multi-step SPA UI with radar chart
│   │   ├── layout.tsx    # App shell, SEO configuration & google fonts
│   │   └── globals.css   # Dark theme styles & scanning laser line
│   ├── Dockerfile        # Frontend container build instructions
│   └── tailwind.config.ts
├── docker-compose.yml    # Main orchestration docker file
└── README.md
```
