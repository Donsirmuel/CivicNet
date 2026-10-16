# CivicNet

CivicNet is a civic accountability platform built around one problem: when a citizen reports a broken road, a clogged drain, or a missing streetlight, it usually stays informal — a WhatsApp complaint with no owner, no timeline, and no way to tell if it was ever fixed. CivicNet makes that silence visible: every report is tied to a ward, local government area, and state; it climbs toward the right official if it goes unanswered; and replies come from named, verified offices with names and dates attached. Nothing goes silent.

## Who it's for

- **Citizens:** report local problems with photos, track them as they move from ward to LGA to state to federal level, see who is responsible, and how long they've been waiting.
- **Government officials:** verified officials claim issues from their jurisdiction, update status with on-the-record replies, and see their own resolution metrics on a dashboard.
- **Anyone browsing:** the landing page shows a live map of Nigeria with recent reports, so the scale of civic activity is visible, not hidden in group chats.

## What it does (shipped)

**Reporting and tracking**
- File a report with a title, description, category, ward/LGA/state location, and an optional photo.
- Every report is placed on a live map of Nigeria (landing page) with rotating hotspot pins colored by status: open (grey), in progress (green), resolved (gold).
- Reports carry a status trail — Reported → Seen → Assigned → In progress → Resolved — and a visible "Day N" counter showing how long they've been waiting.

**Officials reply on the record**
- Verified officials (verified by staff through a request flow) are assigned issues from their jurisdiction.
- Replies are styled differently from citizen comments: name, office, and date attached, in a dedicated block.
- Officials can take an issue, update its status, resolve it, or escalate it to the next level if it isn't moving.
- Official profiles show real impact: issues raised, answered, and resolution rate.

**Feed and discussion**
- Feed with three tabs: For you, Near me (ward scope), and Official replies.
- Posts and issues side by side, with Support (like), comment, share, and bookmark actions.
- Official replies render as separate blocks so the official voice is easy to spot.

**Messaging and notifications**
- Direct messages between citizens and officials with unread indicators.
- Notifications centre groups updates by issue and shows transitions inline ("Pothole on Shomolu: Open → In progress").

**Settings**
- Account details (name, username, email), Voter ID (last digits only), privacy toggles (hide name in comments), alert preferences, and email digest settings — with plain-language explanations for each.

**Technical integrity**
- Read-only mode: seed data is Nigerian names and real local government areas, not John Doe placeholders. Empty states say "Be the first in your ward" instead of showing made-up numbers.
- Single Sovereign Paper palette (paper + deep forest green + gold) so it works in sunlight; no light/dark mode toggle to manage.
- Mobile bottom navigation with a large Report button.

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Django 6, Django REST Framework, `rest_framework.authtoken`, Whitenoise, Gunicorn |
| Database | SQLite locally → PostgreSQL in production via `dj-database-url` |
| Frontend | React 19, Vite 7, React Router 7, Tailwind 3, Axios, Framer Motion, Lucide |
| Deploy | `docker-compose.yml` + `deploy.sh`: Postgres + Gunicorn backend + nginx SPA frontend on one VPS |

## Data model

Source of truth: `backend/civic_connect/connectapp/models.py`.

- **User / UserProfile:** citizens and verified officials, with jurisdiction (ward / LGA / state) and verification status.
- **Issue:** title, description, category, status, scope, priority, state/LGA/ward, upvotes, image URL, assigned official, escalation level, days waiting, status history.
- **StatusHistory:** every status change with who made it and when — the audit trail behind "nothing goes silent."
- **Post / Comment:** feed updates and replies on issues or posts.
- **Message:** direct messages between citizens and officials.
- **Notification / BookmarkedItem:** activity feed and saved reports.

## Run it locally

Prerequisites: Python 3.12+, Node 20+.

**Backend:**
```bash
cd backend/civic_connect
python -m venv ../venv && ../venv/Scripts/activate   # Windows
# source ../venv/bin/activate                          # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
# API → http://localhost:8000/api/   Admin → http://localhost:8000/admin/
```

**Frontend:**
```bash
cd ../frontend   # from backend/civic_connect, go up to frontend/
cp .env.example .env   # set VITE_API_URL=http://localhost:8000/api if running on one machine
npm install
npm run dev   # → http://localhost:5173
```

**Mobile on the same Wi-Fi:** set `VITE_API_URL=http://<your-pc-ip>:8000/api` and start Vite with `--host`. Make sure your PC firewall allows inbound 8000 and 5173, and add your PC's IP to `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` in `backend/civic_connect/civic_connect/settings.py`.

## What's coming next

- Verification-request UI for citizens and staff review flow (endpoints exist; UI template page is in place).
- Password reset flow (backend endpoints exist; forgot-password page wired).
- Escalation UI on feed cards using the backend `escalation_level` field instead of the current scope heuristic.
- Guided report flow (what → where → photo → who) instead of the current popup composer.
- WhatsApp sharing with a link preview, and language toggles (Pidgin, Yoruba, Hausa, Igbo).

## License

`deploy.sh` generates secrets into `.env.vps` (gitignored, never commit it) on first run. Postgres data lives in `./data/postgres` in the work tree (also gitignored — back it up with the rest of the VPS). Set `ALLOWED_HOSTS` / `CSRF_TRUSTED_ORIGINS` to your domain, and flip `SECURE_SSL_REDIRECT=True` once TLS terminates in front.

## Project structure

```
.
├── backend/
│   ├── civic_connect/     # Django project: settings, connectapp (models/views/serializers/urls)
│   ├── API_ENDPOINTS.md   # full API reference
│   ├── README.md          # backend-only guide
│   └── seed_demo_data.py  # optional demo seeder (matches current models)
├── frontend/
│   ├── src/
│   │   ├── components/landing/  # Nav, MapHero, NigeriaMap, HowItMoves, ClosingBand, Footer
│   │   ├── pages/               # Landing, Timeline, IssueDetails, OfficialDashboard, …
│   │   └── services/            # apiClient, auth
│   └── public/                  # brand assets, auth hero images
├── docs/
│   ├── er-diagram.mmd
│   └── screenshots/             # add 01-landing / 02-feed / 03-issue / 04-dashboard.png
├── docker-compose.yml
├── deploy.sh (+ .env.vps.example)
├── backend/Dockerfile
├── frontend/Dockerfile + nginx.conf
└── README.md
```

## Roadmap

- App screenshots (`docs/screenshots/`) — 1440×900, no personal data
- Google sign-in end-to-end (`POST /api/auth/google/` verifies the ID token, creates the account + profile on first login, returns a DRF token; set `GOOGLE_CLIENT_ID` alongside `VITE_GOOGLE_CLIENT_ID`)
- Backend test coverage (`connectapp/tests.py` is still the Django placeholder)
- Verification-request UI for citizens and staff review flow (endpoints exist; UI template page is in place)
- Password reset flow (backend endpoints exist; forgot-password page wired)
- Escalation UI on feed cards using the backend `escalation_level` field instead of the current scope heuristic
- Guided report flow (what → where → photo → who) instead of the current popup composer
- WhatsApp sharing with a link preview, and language toggles (Pidgin, Yoruba, Hausa, Igbo)

MIT. Built as a Final Year Project — production-ready concepts with a few placeholder areas marked in code where data sources haven't been wired yet (noted inline).
