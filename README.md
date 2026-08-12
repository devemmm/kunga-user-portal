# kunga-user-portal — Learning Portal

> React 18 + Vite web app for parents using the Kunga Basics child development platform. Served by nginx in production at **app.kungabasics.com**.

---

## Table of Contents

- [Branching Strategy](#branching-strategy)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication & Session](#authentication--session)
- [Pages](#pages)
- [Key Features](#key-features)
- [API Client](#api-client)
- [Internationalisation](#internationalisation)
- [Deployment](#deployment)
- [Deployment Troubleshooting](#deployment-troubleshooting)

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `dev` | Active development. All new work is merged here first. |
| `staging` | Pre-production verification. Promote from `dev` when ready for QA. |
| `prod` | Production. Promote from `staging` after sign-off. Deployed to `app.kungabasics.com`. |

Workflow: `dev` → `staging` → `prod`. Open PRs against `dev`.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **React 18** | UI framework |
| **Vite 5** | Dev server + production bundler |
| **React Router v6** | Client-side routing + `useSearchParams` for filter state |
| **Lucide React** | Icon set |
| **nginx** | Static file serving + SPA fallback (Docker) |

---

## Project Structure

```
kunga-user-portal/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout.jsx              # App shell — sidebar nav, header, outlet
│   │   └── DailyRoutineModal.jsx   # Per-session routine check-in popup (premium)
│   ├── lib/
│   │   ├── api.js                  # Fetch-based API client (JWT + silent refresh)
│   │   ├── auth.jsx                # AuthProvider + useAuth() hook
│   │   ├── i18n.jsx                # LangProvider + useLang() hook (en · fr · kin)
│   │   └── theme.jsx               # ThemeProvider (system · light · dark)
│   ├── pages/
│   │   ├── Home.jsx                # Dashboard: hero, stats, CTA, routine widget
│   │   ├── Modules.jsx             # Module list with smart filter tabs + SVG icons
│   │   ├── ModuleDetail.jsx        # Module player, resources, feedback
│   │   ├── TodaysRoutine.jsx       # Full routine checklist page
│   │   ├── Progress.jsx            # Progress charts + milestone timeline
│   │   ├── AskGad.jsx              # Submit questions to Dr. Gad + view responses
│   │   ├── ChildAssessment.jsx     # Child development self-assessment
│   │   ├── MilestoneReport.jsx     # Milestone tracking & report
│   │   ├── Profile.jsx             # Profile photo, child profile, activity log
│   │   ├── Settings.jsx            # Language, theme, notifications, MFA, password
│   │   ├── Notifications.jsx       # In-app notifications list
│   │   ├── PaymentsAndSubscription.jsx  # Subscription status + payment history
│   │   ├── ManualPayment.jsx       # Mobile money / manual payment submission
│   │   ├── Login.jsx               # Email/password + Google OAuth + MFA OTP
│   │   └── ResetPassword.jsx       # Password reset via email token
│   └── App.jsx                     # Router + AuthProvider + PrivateRoute + DailyRoutineModal
├── Dockerfile                      # Multi-stage: node builder → nginx:alpine
├── docker-compose.yml              # kunga-user-portal service (port 8082 internally)
├── nginx.conf                      # SPA fallback + asset caching
├── .env.example
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- `kunga-api` running on port 3001

### Local Development

```bash
cd kunga-user-portal
npm install
cp .env.example .env.local    # set VITE_API_URL=http://localhost:3001/api/v1
npm run dev
```

User portal → **http://localhost:5174**

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api/v1` | Base URL for all API calls. Use `http://localhost:3001/api/v1` locally. |

> In Docker the nginx config serves the built SPA; the API URL is baked in at build time via the Vite `VITE_API_URL` build arg.

---

## Authentication & Session

- **Login**: `POST /auth/login` — email + password. Returns `accessToken` (15 min) + `refreshToken` (30 days).
- **Google OAuth**: `POST /auth/google` with a Google ID token.
- **MFA**: If `mfaEnabled`, login returns `{ mfaRequired: true, mfaToken }`. User enters OTP → `POST /auth/mfa/verify`.
- **Silent refresh**: The API client (`src/lib/api.js`) intercepts 401 responses, calls `POST /auth/refresh`, retries once, and calls `logout()` if refresh fails.
- **`useAuth()`** hook exposes: `user`, `childProfile`, `prefs`, `loading`, `refetch()`.
- Tokens stored in `localStorage` (`kb_token`, `kb_refresh`).

---

## Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Home | `/` | Auth | Hero card, stats strip, smart CTA button, routine widget |
| Modules | `/modules` | Auth | Filter tabs (All / In Progress / Completed / Not Started) with count badges, SVG group icons, progress bars |
| Module Detail | `/modules/:id` | Auth | Video player, resource downloads, feedback form |
| Today's Routine | `/routine` | Premium | Full daily routine checklist grouped by morning / afternoon / evening |
| Progress | `/progress` | Auth | Module completion charts, milestone timeline |
| Ask Dr. Gad | `/ask-gad` | Premium | Submit text/video questions, view Dr. Gad's responses |
| Child Assessment | `/assessment` | Auth | Self-assessment questionnaire for child development |
| Milestone Report | `/milestones` | Auth | Milestone tracker and detailed report |
| Profile | `/profile` | Auth | Photo upload, child profile (name, DOB, challenges), paginated activity log, sign out |
| Settings | `/settings` | Auth | Language, theme, notifications, MFA toggle, password change, sign out |
| Notifications | `/notifications` | Auth | In-app notification list |
| Payments | `/payments` | Auth | Subscription status, payment history |
| Manual Payment | `/manual-payment` | Auth | Submit mobile money proof of payment |
| Login | `/login` | Public | Email/password, Google OAuth, MFA OTP |
| Reset Password | `/reset-password` | Public | Token-based password reset |

---

## Key Features

### Daily Routine Modal
On every new session, premium users see a bottom-sheet modal with today's routine tasks. Tasks are grouped by Morning / Afternoon / Evening and sync to the DB on every toggle. When all tasks are checked, the modal celebrates and redirects to home. Dismissing with "Do it later" or "✕" hides it for the session only (next session it reappears). The modal is mounted in `PrivateRoute` via `DailyRoutineModal.jsx` so it appears on any page after login.

Session key: `kb_routine_modal_YYYY-MM-DD` in `sessionStorage`.

### Smart Module Filter
The Modules page auto-selects the best filter tab on load: if the user has in-progress modules it opens on "In Progress"; if they have completed modules but nothing in progress it opens on "Not Started"; otherwise defaults to "All". Filter state is preserved in the URL via `?filter=` so the browser back button works.

### Module Icons
Each module group gets a distinct inline SVG icon generated from its name (keyword-matched on the frontend — independent of the DB emoji field). Groups: Speech & Language (blue), Calm & Focus (purple), Movement & Motor (green), Social & Play (amber), Sensory (pink), default (green books).

### Smart CTA Button (Home)
The home page shows a contextual action button below the stats strip:
- No progress → **"Start Learning"** → links to the first module
- Has in-progress module → **"Continue Learning"** → links directly to that module, shows `X% complete`
- All done → **"🏆 All done — review modules"** → links to `/modules`

### Free Book Popup
A modal promoting the free PDF book appears once per session. Clicking **"I've already downloaded it"** saves `freeBookDownloaded: true` to `user_preferences` via `PATCH /preferences` — the popup never appears again across any future session or device.

### Custom Date Picker
The child profile form uses a fully custom date picker (no native `<input type="date">`). It has day / month / year drill-down views, a glass-style design, keyboard-friendly layout, and a Clear / Today shortcut row.

### Child Profile
Parents can set their child's name, date of birth, age in months, and select challenge chips (Speech Delay, Language Delay, Autism Spectrum, Hearing Impairment, Attention Deficit, Social Difficulties, Sensory Processing, Motor Delays). Saved via `POST /users/me/child-profile`.

### Progress Stats (Source of Truth)
All completion counts on the Home page and the Modules page use `GET /modules/groups` (`modulesApi.getGroups()`) as the single source of truth — not the raw progress rows. This ensures completed/in-progress counts match exactly between both pages.

---

## API Client

`src/lib/api.js` exports named API objects for each domain:

| Export | Base path | Key methods |
|--------|-----------|-------------|
| `authApi` | `/auth` | `login`, `register`, `googleAuth`, `me`, `updateProfile`, `updatePhoto`, `removePhoto`, `changePassword`, MFA setup/disable |
| `modulesApi` | `/modules` | `getGroups`, `list`, `getById`, `listResources`, `submitFeedback` |
| `progressApi` | `/progress` | `get`, `update`, `updateProgress`, `markComplete` |
| `videosApi` | `/videos` | `getStreamUrl`, `bookmark`, `getNotes`, `addNote`, `updateNote`, `deleteNote` |
| `routineApi` | `/routine` | `getDate`, `toggle`, `streak` |
| `preferencesApi` | `/preferences` | `get`, `update` |
| `usersApi` | `/users/me` | `getProgressSummary`, `getActivity`, `upsertChildProfile` |
| `askGadApi` | `/ask-gad` | `list`, `submit`, `uploadMedia` |
| `assessmentsApi` | `/assessments` | `list`, `getById`, `create`, `submit`, `history` |
| `announcementsApi` | `/announcements` | `getActive`, `getBanner`, `dismiss` |
| `subscriptionsApi` | `/subscriptions` | `getStatus` |
| `paymentsApi` | `/payments` | `myHistory` |
| `manualPaymentsApi` | `/manual-payments` | `plans`, `my` |
| `routineApi` | `/routine` | `getDate`, `toggle`, `streak` |
| `milestonesApi` | `/milestones` | `list`, `submit` |
| `notificationsApi` | `/users/me/notifications` | `list` |

`FormData` bodies skip `Content-Type: application/json` — the browser sets the multipart boundary automatically.

---

## Internationalisation

Three languages: **English**, **Français**, **Kinyarwanda**. All strings live in `src/lib/i18n.jsx`.

```jsx
import { useLang } from '../lib/i18n.jsx';
const { t, lang, setLang } = useLang();
t('home.greeting.morning') // → "Good morning"
```

Language is persisted to `localStorage` and synced with the user's `preferences.language` on the API.

---

## Deployment

The user portal is included in the root `deploy.sh` script:

```bash
# From the kunga-basics/ root directory:
./deploy.sh portal        # deploy user portal only
./deploy.sh all           # deploy API + admin + portal + website
```

### Manual Docker deploy

```bash
# Sync files
rsync -az --exclude='node_modules' --exclude='dist' --exclude='.git' \
  --exclude='.env' --exclude='.env.local' \
  ./kunga-user-portal/ root@api.kungabasics.com:/opt/kunga-basics/kunga-user-portal/

# On the server
cd /opt/kunga-basics/kunga-user-portal
docker compose build --no-cache kunga-basics
docker compose up -d --remove-orphans
docker compose logs -f
```

The container name is `kunga-user-portal`, the Docker Compose service name is `kunga-basics`. It runs internally on port `8082` (mapped to `127.0.0.1:8082:80`). The host nginx reverse-proxies `app.kungabasics.com` → `http://127.0.0.1:8082`.

### nginx — upload size

The host nginx config for `api.kungabasics.com` must include:

```nginx
client_max_body_size 150M;
```

Without this, file uploads (PDFs, avatars) larger than 1 MB will return a `413` error.

---

## Deployment Troubleshooting

### "Cannot find module" after Docker build

**Cause:** A package listed only in `devDependencies` is `import`-ed at runtime.
**Fix:** Move the package to `dependencies` in `package.json` and redeploy.

### Photo/file upload returns 404

**Cause:** Wrong API endpoint. The correct route is `POST /auth/avatar` (not `/auth/me/photo`).

### CORS errors locally

**Cause:** `VITE_API_URL` is pointing at the production API.
**Fix:** Set `VITE_API_URL=http://localhost:3001/api/v1` in `.env.local`.

### `kunga-network` not found

**Cause:** `kunga-api` must be started first — it creates the shared Docker network.

```bash
cd ../kunga-api && docker compose up -d
cd ../kunga-user-portal && docker compose up --build -d
```
