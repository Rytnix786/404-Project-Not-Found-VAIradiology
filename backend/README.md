# Django REST API Backend — 404_PROJECT

Backend REST API for the 404_PROJECT Kanban task manager and vector image annotation workspace. Built with Django and Django REST Framework.

---

## 1. Overview & Architecture

The backend provides a stateless HTTP REST API using Django REST Framework (DRF) with Token Authentication.

- **`core` app**: Handles custom user model (`core.User`), authentication endpoints (`/api/auth/login/`, `/api/auth/logout/`, `/api/auth/me/`), and system health check (`/api/health/`).
- **`tasks` app**: Implements Kanban task management (`/api/tasks/`, `/api/tags/`) supporting status filtering (`todo`, `in_progress`, `done`), date filtering (`due_date`), tag assignments, and priority ordering.
- **`annotations` app**: Manages image uploads (`/api/images/`) with auto-detected width/height metadata and vector polygon shape annotations (`/api/shapes/`) with normalized coordinates.

---

## 2. Environment & Technology Versions

- **Python**: `3.11.0` (or `3.11+`)
- **Django**: `5.2.15`
- **Django REST Framework**: `3.15.0`
- **Database**: PostgreSQL 15+ (Production) / SQLite 3 (Local Development)
- **WSGI Server**: Gunicorn `21.2.0`
- **Static File Middleware**: WhiteNoise `6.6.0`

---

## 3. Local Development Setup

### 1. Prerequisites
Ensure Python `3.11+` and `pip` are installed.

### 2. Virtual Environment & Dependencies
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Create `.env` in the `backend/` directory:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
DEBUG=True
SECRET_KEY=django-insecure-local-dev-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Database Migrations & Demo Seeding
```bash
# Apply Django database migrations
python manage.py migrate

# Seed demo user, tasks, and annotated test image
python manage.py seed_demo
```

### 5. Start Development Server
```bash
python manage.py runserver 127.0.0.1:8000
```
API endpoints will be available at `http://127.0.0.1:8000/api/`.

---

## 4. Environment Variables

| Variable | Description | Default (Local) |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (parsed via `dj-database-url`). If unset, falls back to `sqlite:///db.sqlite3`. | `None` |
| `SECRET_KEY` | Django cryptographic signing key. | `django-insecure-...` |
| `DEBUG` | Enables Django verbose stacktraces. Set `False` in production. | `True` |
| `ALLOWED_HOSTS` | Comma-separated list of permitted HTTP Host headers. | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins. | `http://localhost:3000` |

---

## 5. Seed Command Details

Command: `python manage.py seed_demo`

This command is **idempotent** and safe to execute multiple times:
- Creates/updates superuser `demo@404.com` with password `password123`.
- Creates sample tags (`radiology`, `urgent`, `frontend`, `backend`, `review`).
- Seeds 3 tasks for the current date across `todo`, `in_progress`, and `done` statuses.
- Generates a synthetic 800x600 test scan image (`demo_scan_01.png`) using Pillow if no images exist for the demo user, and attaches a normalized vector polygon shape (`points: [{"x": 0.3125, "y": 0.25}, ...]`).

---

## 6. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health/` | Health check diagnostics | No |
| `POST` | `/api/auth/login/` | User authentication (returns token + user obj) | No |
| `POST` | `/api/auth/logout/` | Invalidates token | Yes |
| `GET` | `/api/auth/me/` | Retrieves current authenticated user profile | Yes |
| `GET`, `POST` | `/api/tasks/` | List tasks (supports `?due_date=YYYY-MM-DD` & `?status=...`) / Create task | Yes |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/api/tasks/<id>/` | Retrieve, update, or delete specific task | Yes |
| `GET` | `/api/tags/` | List all available task tags | Yes |
| `GET`, `POST` | `/api/images/` | List uploaded images / Upload image file | Yes |
| `GET`, `DELETE` | `/api/images/<id>/` | Retrieve image details or delete image | Yes |
| `GET`, `POST` | `/api/shapes/` | List shapes / Create new shape | Yes |
| `DELETE` | `/api/shapes/<id>/` | Delete specific shape annotation | Yes |
