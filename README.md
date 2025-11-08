# Wedding RSVP Backend

Node/Express API for a multi-tenant RSVP platform. It handles admin & couple authentication, guest onboarding, tag assignments, SMS notifications, PDF/QR generation, and thematic settings stored per couple in MongoDB.

## Requirements

- Node.js 18+
- npm
- MongoDB instance (Atlas or self-hosted)

## Environment

Copy `.env.example` to `.env` (or create it manually) and set:

```
MONGO_URI=your-mongo-uri
SECRET_KEY=jwt-secret
TERMII_API_KEY=termii-key
TWILIO_ACCOUNT_SID=optional-if-using-twilio
TWILIO_AUTH_TOKEN=optional-if-using-twilio
TWILIO_MESSAGING_SERVICE_SID=optional-if-using-twilio
REACT_APP_SMS_SENDER_NAME=...
REACT_APP_SMS_API_KEY=...
REACT_APP_SMS_USERNAME=...
SITE_LINK=https://frontend-host             # used for RSVP links/QRs
```

The seed script creates:

- Admin credentials (`admin` / `admin1234`)
- A default settings document (per couple records are created on demand)
- Collections for guests, tags, couples, and settings

## Getting Started

```bash
npm install
npm run seed          # seeds admin user + default settings
npm run dev           # runs API with nodemon + frontend dev server via concurrently
```

- `npm run start:backend` – backend only with nodemon
- `npm run start:frontend` – launches the frontend dev server

The API serves:

- `POST /api/admin/login` – admin JWT (role: `admin`)
- `POST /api/admin/couple/login` – couple JWT (role: `couple`)
- `POST /api/admin/couples` – create a couple (admin only) and auto-generate credentials
- `GET /api/admin/couples` – list couples (admin only)
- `GET/PUT /api/settings` – scoped settings CRUD (admin can pass `coupleId`)
- `GET /api/settings/public` – public settings for invitations (supports `?coupleId=`)
- `POST /api/admin/add-guest`, `/api/admin/guests`, `/api/admin/send-sms`, etc. – guest + tag management, scoped by couple

## Deployment Notes

- Provide the same environment variables on the hosting platform (Render, Railway, etc.).
- Run `npm run seed` once after provisioning the database to ensure the admin user and default settings exist.
- Rotate credentials regularly; JWT `SECRET_KEY` should be unique per environment.
- Configure SMS providers (Termii/Twilio) with production API keys and sender IDs.

