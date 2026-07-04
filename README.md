# 404_PROJECT — Radiology Task Board & Image Annotation Workspace

Fullstack medical workspace web application combining a Kanban task organizer and a multi-image vector polygon annotation tool. Built with Django REST Framework (DRF) and Next.js 14 (App Router).

---

## 1. Project Overview

### Application Purpose
This application provides radiology and annotation teams with a unified workspace:
1. **Task Scheduling (`/tasks`)**: A date-bound Kanban board with drag-and-drop state transitions, priority badges, tags, and date navigation.
2. **Medical Vector Annotation (`/annotate`)**: Multi-image scroll carousel and interactive drawing stage. Annotators draw custom multi-point vector polygon shapes on images, with coordinates normalized to original image dimensions to preserve spatial fidelity across viewports.

### System Architecture
```
┌───────────────────────────────────────────────────────────┐
│                     Browser Client                        │
│   Next.js 14 (App Router) · React 18 · Tailwind CSS       │
└─────────────┬───────────────────────────────┬─────────────┘
              │ Token Auth                    │ Static Assets
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│     Backend REST API      │   │   WhiteNoise Middleware   │
│ Django 5.2 · DRF 3.15     │   │  Pre-compressed CSS/JS    │
└─────────────┬─────────────┘   └───────────────────────────┘
              │ dj-database-url
              ▼
┌───────────────────────────┐
│  Render Managed Postgres  │
│     (vairadiology_db)     │
└───────────────────────────┘
```

---

## 2. Technology Versions

| Category | Component | Exact Version |
|---|---|---|
| **Backend Language** | Python | `3.11.0` (compatible with 3.11+) |
| **Backend Framework** | Django | `5.2.15` |
| **API Toolkit** | Django REST Framework | `3.15.0` |
| **WSGI Server** | Gunicorn | `21.2.0` |
| **Static File Engine** | WhiteNoise | `6.6.0` |
| **Frontend Runtime** | Node.js | `20.12.2` (compatible with 20.x) |
| **Package Manager** | npm | `10.5.0` |
| **Frontend Framework** | Next.js | `14.2.35` (App Router) |
| **UI Library** | React | `18.3.1` |
| **Styling Engine** | Tailwind CSS | `3.4.1` |
| **State Management** | Zustand | `4.5.2` |
| **Drag & Drop** | `@dnd-kit/core` / `@dnd-kit/sortable` | `6.1.0` / `8.0.0` |
| **Database** | PostgreSQL | `15.0+` (Production) / SQLite 3 (Dev) |

---

## 3. Local Development Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/Rytnix786/404-Project-Not-Found-VAIradiology.git
cd 404-Project-Not-Found-VAIradiology
```

---

### Step 2: Configure & Start the Django Backend

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows (PowerShell):
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # macOS / Linux:
   python -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create backend `.env` file:
   ```bash
   cp .env.example .env
   ```

5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

6. Run the idempotent seed script:
   ```bash
   python manage.py seed_demo
   ```

7. Start the backend development server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   *Backend API is accessible at `http://127.0.0.1:8000/api/`.*

---

### Step 3: Configure & Start the Next.js Frontend

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create frontend `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Frontend application is accessible at `http://localhost:3000/`.*

---

## 4. Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Description | Example (Local Dev) |
|---|---|---|---|
| `SECRET_KEY` | Yes | Django cryptographic signing key. | `django-insecure-local-dev-key` |
| `DEBUG` | Yes | Set `True` for local development, `False` for production. | `True` |
| `ALLOWED_HOSTS` | Yes | Comma-separated list of allowed host header values. | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed cross-origin URLs. | `http://localhost:3000` |
| `DATABASE_URL` | No | PostgreSQL connection URL parsed via `dj-database-url`. Defaults to `db.sqlite3` if unset. | `postgres://user:pass@ep-123.render.com/vairadiology_db` |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Required | Description | Example (Local Dev) |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base HTTP endpoint of the backend DRF API (without trailing slash). | `http://localhost:8000` |

---

## 5. Running the Demo

### Demo Credentials
- **Email**: `demo@404.com`
- **Password**: `password123`

### Seeding Data
Run the following management command in the `backend/` directory:
```bash
python manage.py seed_demo
```

### Initial Seeded Dataset
Executing `seed_demo` creates:
1. **User**: `demo@404.com` (Superuser / Staff privileges).
2. **Tasks**: 3 tasks assigned to `demo@404.com` for the current date:
   - *"Review chest X-ray annotations"* (`status: todo`, `priority: high`, tags: `radiology`, `urgent`)
   - *"Calibrate viewport scaling ratio"* (`status: in_progress`, `priority: medium`, tags: `frontend`)
   - *"Deploy Django & DRF API to Render"* (`status: done`, `priority: high`, tags: `backend`)
3. **Annotated Image**: 1 synthetic 800x600 test scan (`demo_scan_01.png`) saved to the `Image` table, containing 1 polygon shape annotation (`Shape` ID 1 with 4 normalized coordinate vertices).

---

## 6. Production Deployment (Render)

The application is deployed on **Render** using a `render.yaml` Blueprint file.

### Production URLs
- **Frontend URL**: `https://v-radiology-frontend.onrender.com`
- **Backend API URL**: `https://v-radiology-backend.onrender.com`
- **GitHub Repository**: `https://github.com/Rytnix786/404-Project-Not-Found-VAIradiology.git`

### Backend Service Configuration (Render Web Service)
- **Runtime**: Python 3.11
- **Build Command**:
  ```bash
  cd backend && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate && python manage.py seed_demo
  ```
- **Start Command**:
  ```bash
  cd backend && gunicorn config.wsgi:application
  ```
- **Environment Variables**: `DATABASE_URL` (connected to Render Managed PostgreSQL), `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS=.onrender.com`, `CORS_ALLOWED_ORIGINS=https://v-radiology-frontend.onrender.com`.

### Frontend Service Configuration (Render Web Service)
- **Runtime**: Node.js 20
- **Build Command**:
  ```bash
  cd frontend && npm install && npm run build
  ```
- **Start Command**:
  ```bash
  cd frontend && npm run start
  ```
- **Environment Variable**: `NEXT_PUBLIC_API_URL=https://v-radiology-backend.onrender.com`

---

## 7. Real Engineering Challenges & Solutions

### Challenge 1: Viewport-Independent Coordinate Scaling for Image Annotations
- **Problem**: When a user draws a polygon annotation on an image displayed at `640x480` on a laptop screen, viewing the same image on a `1920x1080` monitor caused raw pixel coordinates to shift, misaligning polygon points from the underlying image features.
- **Why It Happened**: HTML `<canvas>` and raw SVG elements default to client pixel dimensions (`e.clientX`, `e.clientY`), which vary based on browser window width, screen resolution, and CSS layout constraints.
- **Solution**: On mouse clicks, pixel offsets (`offsetX`, `offsetY`) are normalized against the current rendered image dimensions (`clientWidth`, `clientHeight`):
  $$x_{norm} = \frac{offsetX}{width_{client}}, \quad y_{norm} = \frac{offsetY}{height_{client}}$$
  Normalized coordinates ($0.0 \le x, y \le 1.0$) are saved in the Django `Shape` JSONField. At render time, an SVG overlay with `viewBox="0 0 1000 1000"` maps normalized values ($x_{norm} \times 1000$) natively inside an SVG element positioned directly over the source image.
- **Tradeoff**: SVG viewBox mapping avoids JavaScript resize event listeners, offloading all coordinate scaling to the browser's native layout engine.

---

### Challenge 2: Localhost Cookie Rejection vs. Production HTTPS (`BUG-012`)
- **Problem**: In local testing on `http://localhost:3000`, backend authentication succeeded (`200 OK` from `/api/auth/login/`), but page navigations redirected back to `/login` as if authentication failed.
- **Why It Happened**: The client cookie helper in `lib/cookies.ts` appended `; Secure` to all cookies unconditionally. According to RFC 6265, browsers silently reject cookies flagged with `Secure` when transmitted over unencrypted `http://` connections. As a result, `document.cookie` dropped the session token immediately after writing.
- **Solution**: Modified `lib/cookies.ts` to inspect protocol before appending the `Secure` attribute:
  ```typescript
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax${secureFlag}`;
  ```
- **Tradeoff**: Conditional evaluation allows local development over HTTP without compromising HTTPS security in production.

---

### Challenge 3: Kanban Optimistic Drag-and-Drop Updates with Rollback
- **Problem**: Dragging a task card between columns in `@dnd-kit` felt laggy when waiting for the backend REST API response (`PATCH /api/tasks/<id>/`).
- **Why It Happened**: A standard `fetch()` await pattern blocks UI state mutation until HTTP response roundtrips complete (~200–400ms).
- **Solution**: Implemented an optimistic state update model inside `Board.tsx`. On `onDragEnd`, the UI immediately mutates local task state in React memory. Simultaneously, an asynchronous `PATCH` request is dispatched to DRF. If the network call rejects or returns a non-2xx status, a rollback function restores the previous task list and displays an inline error state.
- **Tradeoff**: Provides instant 60fps interaction while preserving data consistency against API failures.

---

### Challenge 4: PostgreSQL Ephemeral Storage vs. Local SQLite Media Files
- **Problem**: Ephemeral hosting providers (Render, Heroku) wipe local files on redeploy, causing SQLite database files and uploaded media images to disappear.
- **Why It Happened**: Containerized cloud hosts spin up fresh filesystems on every deployment build.
- **Solution**: Configured Django's `DATABASES` setting via `dj-database-url` to attach a persistent Render Managed PostgreSQL instance in production while keeping local SQLite zero-config development intact. Added an automated management command (`seed_demo`) into the deployment pipeline that programmatically regenerates essential diagnostic images and shapes using Pillow if missing.
- **Tradeoff**: Guarantees zero downtime or missing records after redeployments without requiring manual database restoration.

---

## 8. Repository Structure

```
.
├── backend/                        # Django REST Framework API
│   ├── config/                     # Settings, WSGI, root URL routing
│   │   ├── settings.py             # Database, Whitenoise, CORS & DRF settings
│   │   ├── urls.py                 # Core API route inclusions
│   │   └── wsgi.py                 # Gunicorn entrypoint
│   ├── core/                       # Custom User model & auth views
│   │   ├── management/commands/    # Seed script (seed_demo.py)
│   │   ├── models.py               # Custom User model (email auth)
│   │   └── views.py                # Health & authentication endpoints
│   ├── tasks/                      # Kanban task management app
│   │   ├── models.py               # Task & Tag models
│   │   └── views.py                # TaskViewSet with date/status filters
│   ├── annotations/                # Medical image annotation app
│   │   ├── models.py               # Image & Shape models
│   │   └── views.py                # ImageViewSet & ShapeViewSet
│   └── requirements.txt            # Python dependencies (gunicorn, psycopg2-binary, etc.)
│
├── frontend/                       # Next.js 14 App Router App
│   ├── src/
│   │   ├── app/                    # Pages (/login, /tasks, /annotate, /)
│   │   │   ├── globals.css         # Design system tokens & utility classes
│   │   │   └── page.tsx            # Main workspace landing page
│   │   ├── components/             # Board, Column, TaskCard, TaskModal, DateSelector
│   │   ├── context/                # AuthContext & DateContext
│   │   ├── lib/                    # Client cookies helper (cookies.ts)
│   │   └── middleware.ts           # Next.js Edge Middleware route protection
│   └── package.json                # Node dependencies & scripts
│
├── render.yaml                     # Infrastructure-as-Code Blueprint for Render
└── README.md                       # Workspace Documentation
```

---

## 9. Production Links & Demo Credentials

- **Production Live Application**: [https://four04-project-not-found-vairadiology.onrender.com](https://four04-project-not-found-vairadiology.onrender.com)
- **Backend API Health Check**: [https://four04-project-not-found-vairadiology.onrender.com/api/health/](https://four04-project-not-found-vairadiology.onrender.com/api/health/)
- **GitHub Repository**: [https://github.com/Rytnix786/404-Project-Not-Found-VAIradiology.git](https://github.com/Rytnix786/404-Project-Not-Found-VAIradiology.git)
- **Demo User Email**: `demo@404.com`
- **Demo User Password**: `password123`

---

## 10. Future Improvements

1. **Cloud Media Storage Integration**: Attach `django-storages` with AWS S3 or Cloudinary to preserve user-uploaded media files beyond container lifecycles.
2. **COCO / YOLO Export**: Add export endpoints (`/api/images/<id>/export/`) to download polygon annotations in standard machine learning dataset formats.
3. **Multi-User Real-time Collaboration**: Integrate Django Channels with WebSockets to reflect task drag-and-drop moves across concurrent user sessions in real time.
