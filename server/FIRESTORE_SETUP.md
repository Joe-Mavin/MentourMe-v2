# Firestore + Cloud Run Setup Guide

This backend is now 100% Firestore-based. Sequelize/MySQL has been removed from the active runtime. Follow these steps to run locally and deploy to Cloud Run using Firestore.

## 1) Environment variables
Create a .env file in `server/` with at least:

- JWT_SECRET=<a-strong-secret>
- CLIENT_URL=http://localhost:3000

For WebRTC (TURN/STUN via Metered), optional but recommended:
- METERED_USERNAME=your_username
- METERED_PASSWORD=your_password
- METERED_DOMAIN=your_domain

For email (Brevo SMTP), optional:
- BREVO_SMTP_USER=your_brevo_user
- BREVO_SMTP_PASSWORD=your_brevo_password
- BREVO_SMTP_PORT=465
- SENDER_EMAIL=you@example.com

### Firestore credentials options
The app initializes Firebase Admin in `server/config/firestore.js`.
You have two options:

A) Explicit credentials via env vars:
- FIREBASE_PROJECT_ID=your-project-id
- FIREBASE_CLIENT_EMAIL=service-account@your-project-id.iam.gserviceaccount.com
- FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

Note: Newlines in the private key must be escaped as `\n` in env files. The code automatically converts them back at runtime.

B) Application Default Credentials (ADC):
- Local dev: `gcloud auth application-default login` and ensure your project is set with `gcloud config set project <project_id>`.
- Cloud Run: Use Workload Identity / default service account with appropriate IAM roles (see below).

Required IAM roles on the service account (Cloud Run):
- roles/datastore.user (or roles/datastore.owner for broad access)

## 2) Install and run locally

From repository root:

- npm install --prefix server
- npm run dev --prefix server

Server will start at port 5000 by default. Health checks:
- GET http://localhost:5000/health
- GET http://localhost:5000/healthcheck

## 3) Quick functional tests

- Create a test mentor user:
  POST http://localhost:5000/api/auth/create-test-mentor

- Login:
  POST http://localhost:5000/api/auth/login
  { "email": "mentor@test.com", "password": "password123" }

- Get profile (requires Bearer token from login):
  GET http://localhost:5000/api/auth/profile

- Notifications (requires token):
  GET http://localhost:5000/api/notifications

- Newsletter:
  POST http://localhost:5000/api/newsletter/subscribe { "email": "test@example.com" }

- WebRTC config (requires token):
  GET http://localhost:5000/api/webrtc/config

## 4) Collections created

On first use the following Firestore collections are used:
- users
- onboarding
- mentorship_requests
- notifications
- newsletters
- _counters (for numeric IDs, see `server/utils/firestoreIds.js`)

## 5) Cloud Run deployment (high-level)

- Ensure your project: `gcloud config set project <project_id>`
- Build container (example):
  docker build -t gcr.io/<project_id>/mentourme-server:firestore .
- Push: `gcloud auth configure-docker` then `docker push gcr.io/<project_id>/mentourme-server:firestore`
- Deploy:
  gcloud run deploy mentourme-server \
    --image gcr.io/<project_id>/mentourme-server:firestore \
    --platform managed \
    --region <your_region> \
    --allow-unauthenticated \
    --set-env-vars CLIENT_URL=https://your-frontend.domain,JWT_SECRET=... \
    --set-env-vars FIREBASE_PROJECT_ID=...,FIREBASE_CLIENT_EMAIL=...,FIREBASE_PRIVATE_KEY="$(cat private.key | sed ':a;N;$!ba;s/\n/\\n/g')"

If using ADC/Workload Identity (recommended), omit the explicit Firebase env vars and ensure the service account attached to the service has roles/datastore.user.

## 6) Notes about removed SQL

- All Sequelize imports were removed from active repositories and services used at startup.
- Messaging/rooms SQL-dependent socket handlers are disabled; only video-call signaling and typing indicators remain.
- Unmigrated modules (blog, tasks, rooms, sessions) are not mounted in `server/server.js` yet.

## 7) Next migrations

Planned modules to migrate or deprecate:
- mentorship requests/sessions (storage for session history)
- messaging and rooms (Firestore schema and socket events)
- tasks (battle missions) and progress tracking
- blog (posts, comments, likes)

Once each is migrated to Firestore repositories, we can mount their routes again.
