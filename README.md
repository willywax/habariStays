# Habari Stays

Hotel booking & management platform for Tanzania. See `memory/PRD.md` for product/architecture context and `DEPLOYMENT.md` for GCP deployment steps.

## Backend environment variables

The deployed API is `backend/server_postgres.py`. Copy `backend/.env.example` to `backend/.env` and fill in real values before running it.

### Required

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing secret. **The server refuses to start if this is unset** — there is no hardcoded fallback. Generate a long random value (e.g. `openssl rand -hex 32`) and never reuse the one from `.env.example`. |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql+asyncpg://user:password@host:5432/habari_stays`. |

### Optional (feature-gated — the app runs without them, with that feature disabled/limited)

| Variable | Description | Default |
|---|---|---|
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:3000,http://localhost:8000,https://habaristays.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (sign-in with Google) | — |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (photo uploads) | `diupey6vs` |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset | `habari_stays_upload` |
| `BEEM_API_KEY` / `BEEM_SECRET_KEY` | Beem Africa SMS credentials | — |
| `BEEM_SENDER_ID` | SMS sender ID | `HABARISTAYS` |
| `SELCOM_TILL_NUMBER` | Till number shown for manual M-Pesa payment | `123456` |
| `PORT` | Port the server listens on | `8080` |

**Note:** `backend/server.py` (MongoDB) is a legacy, unused implementation kept in the repo during an incomplete Mongo→Postgres migration — it is not what runs in production and should not be used as a reference for env vars.
