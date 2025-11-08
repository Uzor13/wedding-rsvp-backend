# Wedding RSVP Backend

Node/Express API that powers the RSVP management dashboard. It handles admin authentication, guest onboarding, tag assignments, SMS notifications, PDF/QR generation, and allows dynamic theming through a settings document stored in MongoDB.

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
```

The app also seeds an admin user (`admin` / `admin1234`) and default event settings via the seed script below.

## Getting Started

```bash
npm install
npm run seed          # creates admin user + default settings document
npm run dev           # runs API with nodemon + frontend project via concurrently
```

- `npm run start:backend` – backend only with nodemon
- `npm run start:frontend` – launches the frontend dev server

The API serves:

- `POST /api/admin/login` – returns JWT
- `GET/PUT /api/settings` – admin-only settings CRUD
- `GET /api/settings/public` – public-facing settings used by the invitation page
- Guest/tag CRUD and RSVP endpoints under `/api/...` and `/api/tags/...`

## Deployment Notes

- Provide the same environment variables on the hosting platform (Render, Railway, etc.).
- Run `npm run seed` once after provisioning the database to ensure the admin user and default settings exist.
- Rotate credentials regularly; JWT `SECRET_KEY` should be unique per environment.

