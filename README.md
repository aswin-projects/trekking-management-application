# Basecamp — Trekking Management Application (V2)

A full-stack trekking management system for **Admin**, **Trek Staff**, and
**Trekkers (Users)**, built with Flask, VueJS (CDN, no build step), Bootstrap,
SQLite, Redis and Celery.

## Stack

| Layer        | Technology                                    |
|--------------|------------------------------------------------|
| API          | Flask + Flask-Login + Flask-SQLAlchemy          |
| UI           | Vue 3 (CDN) + Vue Router (CDN), served through a single Jinja2 entry template — no Node.js/npm required |
| Styling      | Bootstrap 5 + Bootstrap Icons (custom theme on top) |
| Database     | SQLite (created programmatically via SQLAlchemy models — no manual DB tools used) |
| Caching      | Redis (via Flask-Caching) — caches public trek listings and admin report stats |
| Batch jobs   | Celery + Redis — booking confirmation/cancellation notices, upcoming-trek reminder batch job, report pre-computation job |

## Project layout

```
tma/
  backend/
    app.py                 # Flask app factory, DB init, admin auto-seed
    config.py                # Config (SQLite path, Redis URLs)
    extensions.py             # db, login_manager, cache, celery singletons
                               # + safe_cache/safe_delay wrappers so a down
                               # Redis/Celery never crashes a request
    tasks.py                  # Celery tasks (confirmations, reminders, reports)
    celery_worker.py          # Celery worker entry point
    utils.py                  # role_required decorator, date helper
    seed_demo_data.py         # optional: populate sample staff + treks
    instance/tma.db           # SQLite file (created automatically on first run)
    routes/
      auth.py                 # login / register / staff self-registration / me
      admin.py                 # trek CRUD, staff CRUD, user mgmt, search, reports
      staff.py                  # assigned treks, slot/status mgmt, bookings, payments
      user.py                   # browse/search treks, book, cancel, profile
    models/
      user.py                  # User (admin | staff | user roles)
      staff_profile.py          # StaffProfile (pending | active | inactive)
      trek.py                    # Trek
      booking.py                  # Booking
      notification.py              # simulated notification log
  frontend/
    src/
      index.html               # SPA shell (Jinja renders this once, no dynamic
                                # Jinja variables inside it — avoids clashing
                                # with Vue's {{ }} mustache syntax)
      css/custom.css            # theme (trekking / topographic-contour identity)
      js/
        api.js                   # tiny fetch() wrapper for the JSON API
        app.js                    # Vue app, router, auth guards, layout shell
      components/                # one file per screen/component
  requirements.txt
```

Flask serves everything under `frontend/src` at the `/assets/...` URL path
(configured in `backend/app.py`), and renders `frontend/src/index.html` via
Jinja for the SPA entry point.

## 1. Prerequisites

- Python 3.10+
- Redis (or a Redis-compatible service) running locally on port 6379
  - macOS: `brew install redis && brew services start redis`
  - Ubuntu/Debian: `sudo apt install redis-server && sudo service redis-server start`
  - Windows: install **Memurai** (free, Windows-native Redis-compatible service:
    https://www.memurai.com/get-memurai) — no WSL/Docker required. It installs
    as a background Windows service and starts automatically.

## 2. Setup

```bash
cd tma
python -m venv venv
source venv/bin/activate        # Windows PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

The database is created **programmatically**: the first time you run the app,
`db.create_all()` builds `backend/instance/tma.db` and seeds a default admin:

```
email:    admin@tma.local
password: Admin@123
```

## 3. Run the app

All backend commands are run from inside the `backend/` folder.

Terminal 1 — Redis / Memurai (if not already running as a service):
```bash
redis-server
```

Terminal 2 — Flask app:
```bash
cd backend
python app.py
```
Visit **http://localhost:5000**

Terminal 3 — Celery worker (booking confirmations, cancellation notices, and
the admin "recompute stats" / "send reminders" batch jobs):
```bash
cd backend
celery -A celery_worker.celery worker --loglevel=info
```
On Windows add `-P solo` to that command.

(Optional) Terminal 4 — populate sample staff + treks so the app isn't empty:
```bash
cd backend
python seed_demo_data.py
```
This creates:
- Staff login: `staff1@tma.local` / `Staff@123`
- Trekker login: `trekker1@tma.local` / `Trekker@123`
- Four sample treks across difficulty levels

## 4. Using the app

- **Admin** (`admin@tma.local` / `Admin@123`): create/edit/delete treks, add
  trek staff directly (instant access) *or* review and approve/reject staff
  who self-registered, assign staff to treks, manage/search users & staff,
  activate/deactivate/blacklist trekkers, view live stats and trigger the
  Celery report/reminder batch jobs.
- **Trek Staff**: gets an account either created directly by admin (instant
  access) or by self-registering from the login page under "Apply as trek
  staff" — that account sits in a **pending** state and cannot log in until
  an admin approves it from Admin → Trek Staff. Once active, staff can view
  assigned treks, adjust available slots, open/close a trek, view registered
  trekkers, mark individual bookings as **paid**, and mark a trek completed.
- **Trekker**: self-registers via "Create an account"; browses/searches/
  filters open treks by difficulty, location, and duration; books slots;
  views booking status/history (including live payment status once staff
  marks it paid); cancels a booking; updates their profile.

## Notes on architecture choices

- **Auth**: session-cookie based via Flask-Login. Trekkers self-register and
  log in immediately. Staff either get an account created directly by admin
  (active immediately) or self-register into a `pending` state that blocks
  login until an admin approves them (`StaffProfile.status`).
- **Jinja vs Vue**: `frontend/src/index.html` is rendered once and contains
  no dynamic Jinja expressions, so there's no collision with Vue's `{{ }}`
  interpolation syntax. All component templates live in
  `frontend/src/components/*.js` as plain JS template strings, which Flask
  never processes through Jinja. No Node.js/npm/build step is used, matching
  the project's "Vue CLI only if required, not necessary" guidance.
- **Caching & resilience**: `GET /api/treks` (unfiltered) and
  `GET /api/admin/reports` are cached in Redis and invalidated on writes
  (trek create/update/delete, booking/cancellation/payment update). All
  cache reads/writes and Celery `.delay()` calls go through `safe_cache` /
  `safe_delay` wrappers in `extensions.py`, so a Redis or Celery outage logs
  a warning instead of crashing the request.
- **Celery**: booking/cancellation/reminder notifications are simulated
  (logged to console and written to a `Notification` table) rather than sent
  via a real SMTP provider, since this is a local/offline-friendly demo.
