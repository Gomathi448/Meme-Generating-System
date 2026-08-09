# Automated Intelligent Meme Generating System Using AI & NLP

An advanced AI-powered platform that automatically generates memes from user prompts, topics, or uploaded images. The system uses natural language processing (NLP) to generate captions in multiple languages, performs sentiment analysis and calculates humor/virality scores, and embeds custom overlay engines.

---

## Technical Stack & Architecture

### Backend: FastAPI (Python)
- **FastAPI:** Async web routing with self-documenting Swagger UI.
- **SQLAlchemy:** Relational database ORM (SQLite zero-setup local, PostgreSQL drop-in).
- **PIL (Pillow):** Dynamic caption wrapping and overlay rendering engine.
- **Bcrypt & JWT:** Safe password hashes, access tokens, and refresh token cycles.
- **WebSockets:** Telemetry status pushes and global gallery sync notifications.

### Frontend: React + TypeScript + Vite + Tailwind CSS
- **Framer Motion:** Smooth slide menus and neobrutalist layout hover transitions.
- **Recharts:** Dashboard telemetry graphs for engagement trends, cost track, and pipeline latencies.
- **Canvas API:** Instant fluid client-side rendering previews.
- **Tailwind CSS:** Meme-culture display fonts, high-contrast styles, and dark/light modes.

---

## Directory Structure

```
/MemeGenAI
├── /backend          # Python FastAPI server
│   ├── /app
│   │   ├── /core     # config, database, security, sockets
│   │   ├── /models   # user, template, meme, interaction models
│   │   ├── /schemas  # pydantic schemas
│   │   ├── /routers  # auth, templates, memes, users, analytics, ai_models
│   │   └── /services # ai_service (NLP/sentiment), image_service (PIL overlays)
│   └── requirements.txt
├── /frontend         # Vite React web application
│   ├── /src
│   │   ├── /components # Navbar, Sidebar, MemeCard
│   │   ├── /context    # Auth, Theme, Toast providers
│   │   ├── /hooks      # useWebSockets hook
│   │   └── /pages      # Login/Signup, Home, Gallery, Profile, Generator, Dashboards
├── /shared           # Formal API specifications
├── /tests            # pytest (backend) & Playwright (frontend E2E)
└── docker-compose.yml
```

---

## Local Development Quickstart

### Prerequisites
- Python 3.12+
- Node.js 20+

### 1. Run Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate virtual environment:
   - **Windows PowerShell:** `.\venv\Scripts\Activate.ps1`
   - **Bash/macOS:** `source venv/bin/activate`
4. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the application:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The API will be live at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`*

### 2. Run Frontend Web Application
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot development compiler:
   ```bash
   npm run dev
   ```
   *The client will be running at `http://localhost:5173`*

---

## Running Test Suites

### 1. Backend Pytest
Run the endpoint integration and schema tests:
```bash
# From workspace root
$env:PYTHONPATH="backend"; .\backend\venv\Scripts\Activate.ps1; python -m pytest tests/backend/test_api.py
```

### 2. Frontend E2E Playwright Tests
Execute E2E user path flows:
```bash
cd frontend
npx playwright test ../tests/frontend/e2e.spec.ts
```

---

## Container Deployment (Docker)

To build and orchestrate both containers locally:
```bash
docker-compose up --build
```
- **Web App URL:** `http://localhost:3000`
- **Backend API URL:** `http://localhost:8000`
