# 404 Project Not Found — Scaffolded Workspace Monorepo

This monorepo houses a Next.js frontend application and a Django backend API, configured for a modular and independent deployment cycle.

---

## Workspace Structure

```
/
├── backend/            # Django REST API (Python 3.14+)
│   ├── config/         # Project settings, middleware, and root URLs
│   ├── core/           # App handles Custom User authentication & health check views
│   ├── tasks/          # App placeholder for Kanban board models/views
│   ├── annotations/    # App placeholder for annotation models/views
│   ├── requirements.txt
│   ├── .env.example
│   └── manage.py
│
├── frontend/           # Next.js App Router (Node.js 18+)
│   ├── src/
│   │   ├── app/        # Page Router routes (/login, /tasks, /annotate)
│   │   ├── context/    # React context (AuthContext for user state)
│   │   └── lib/        # Helpers (vanilla TypeScript cookie utilities)
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
└── README.md           # Root Workspace Documentation (This file)
```

---

## Architectural Decisions & Tradeoffs

### 1. Backend Authentication: DRF Token Authentication
- **Choice**: Django REST Framework `TokenAuthentication`
- **Rationale**:
  - Independent apps deployed to different domains run into cookie cross-site (`SameSite=None; Secure`) restrictions under standard session-auth.
  - Token authentication is stateless on the HTTP level, allowing the Next.js frontend to securely send credentials in the `Authorization: Token <token>` header without origin conflicts.
  - Tokens are stored in the database, enabling immediate revocation upon logging out (unlike JWTs, which are stateless and harder to revoke immediately).

### 2. Frontend Token Storage: Cookies + Context State
- **Choice**: Store the authentication token in a client-side browser cookie (`auth_token`), keeping user state in React memory.
- **Tradeoffs**:
  - Storing solely in `localStorage` is vulnerable to XSS and makes server-side logic impossible (Next.js Server Components/Middleware cannot read client-side storage).
  - Storing in a cookie allows Next.js **Edge Middleware** and **Server Components** to intercept incoming requests and redirect unauthenticated users *before* rendering client bundles. This solves the "flicker" issue where protected UI is briefly shown before redirecting.
  - Although cookies are vulnerable to CSRF if used for automatic browser authentication, because we manually extract the token from cookies and send it via headers, browser-automatic CSRF vectors do not apply.

### 3. Production PostgreSQL Readiness
- **Choice**: `dj-database-url` configured in `settings.py`.
- **Rationale**:
  - Ephemeral hosting providers (Render, Heroku, etc.) wipe local SQLite databases upon redeployment.
  - In `settings.py`, we parse `DATABASE_URL` from the environment if present, but fall back to local SQLite (`db.sqlite3`) for seamless local development. This permits running production Postgres databases without changing configuration code.

---

## Setup & Running Locally

### System Requirements
- **Python**: `3.11+` (scaffolded using `3.14.0`)
- **Node.js**: `18+` (scaffolded using `20.12.2`)

---

### Step 1: Run the Django Backend

1. Navigate to `/backend`:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   # On Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   
   # On macOS/Linux
   python -m venv .venv
   source .venv/bin/activate
   ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up local configuration:
   ```bash
   cp .env.example .env
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Seed a demo user:
   Open a python shell and create a user:
   ```bash
   python manage.py shell
   ```
   ```python
   from django.contrib.auth import get_user_model
   User = get_user_model()
   User.objects.create_superuser('demo@404.com', 'password123')
   exit()
   ```

7. Start the local API server:
   ```bash
   python manage.py runserver
   ```
   *The backend will run on `http://127.0.0.1:8000/`.*

---

### Step 2: Run the Next.js Frontend

1. Navigate to `/frontend`:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment config:
   ```bash
   cp .env.example .env.local
   ```

4. Start the frontend server:
   ```bash
   npm run dev
   ```
   *The client dashboard will run on `http://localhost:3000/`.*

---

## Verifying Scaffolding Connectivity

1. Open `http://localhost:3000/`.
2. Observe the **Backend Connection Status** card. If the Django server is running, the indicator will pulse green with a status of **Online**, displaying response latency.
3. Click **Access Tasks** or **Access Annotator**. The Next.js Edge Middleware will intercept the page request, see that you are logged out, and redirect you to `/login`.
4. Log in using the seeded credentials:
   - **Email**: `demo@404.com`
   - **Password**: `password123`
5. Upon success, you will be redirected back to the secure `/tasks` area.
