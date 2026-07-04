# Next.js Frontend App — 404_PROJECT

Frontend single-page web application for the 404_PROJECT Kanban task board and interactive image annotation tool. Built with Next.js 14 (App Router), React 18, Zustand, and Tailwind CSS.

---

## 1. Overview & Key Architecture

The frontend is a client-side dashboard with server-side edge middleware protection.

- **Design System (`globals.css`)**: Workbench Dark theme based on custom CSS property tokens (`--surface-base`, `--surface-raised`, `--surface-overlay`, `--ink-primary`, `--accent`). Uses proportional Inter for UI and JetBrains Mono for data tokens.
- **Route Guards (`middleware.ts`)**: Server-side Next.js Edge Middleware checks the `auth_token` cookie before rendering `/tasks` or `/annotate`. Unauthenticated requests are redirected to `/login?redirect=...`.
- **Kanban Board (`/tasks`)**: Powered by `@dnd-kit/core` and `@dnd-kit/sortable`. Uses a Zustand store (`useDate`) for date state and performs optimistic UI status updates during drag-and-drop with rollback on network failure.
- **Image Annotator (`/annotate`)**: Multi-image scroll carousel and SVG stage overlay (`viewBox="0 0 1000 1000"`). Mouse clicks capture client offsets, normalize coordinates to `[0.0, 1.0]` relative to natural image dimensions, and render vector polygon overlays.

---

## 2. Environment & Technology Versions

- **Node.js**: `20.12.2` (or `20.x`)
- **Package Manager**: `npm 10.5.0`
- **Next.js**: `14.2.35` (App Router)
- **React**: `18.3.1`
- **Tailwind CSS**: `3.4.1`
- **State Management**: `zustand 4.5.2`
- **Drag and Drop**: `@dnd-kit/core 6.1.0`, `@dnd-kit/sortable 8.0.0`

---

## 3. Local Development Setup

### 1. Prerequisites
Ensure Node.js `20+` and `npm` are installed.

### 2. Installation
```bash
cd frontend

# Install dependencies
npm install
```

### 3. Environment Variables
Create `.env.local` in the `frontend/` directory:
```bash
cp .env.example .env.local
```
Ensure `.env.local` contains:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 4. Environment Variables

| Variable | Description | Default (Local) |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Django backend API. Must not end with a trailing slash. | `http://localhost:8000` |

---

## 5. Cookie Management & Localhost HTTPS Fix

The client cookie utility (`lib/cookies.ts`) stores `auth_token` when logging in.

```typescript
const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
const secureFlag = isSecure ? '; Secure' : '';
document.cookie = `${name}=${encodeURIComponent(value || "")}${expires}; path=/; SameSite=Lax${secureFlag}`;
```

*Note: On `http://localhost`, browsers silently discard cookies with the `Secure` flag. The protocol check ensures local development cookies persist while production HTTPS cookies receive full `Secure` flag protection.*

---

## 6. Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Next.js dev server on port 3000 |
| `npm run build` | Compiles production build & runs TypeScript typechecks |
| `npm run start` | Serves compiled production build |
| `npm run lint` | Runs Next.js ESLint checks |
