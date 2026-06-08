# Smart Hotel Server

This is the AWS-ready Node/Express server for the static Smart Hotel frontend.

## Local Run

```bash
cp .env.example .env
npm install
npm start
```

Open:

```text
http://127.0.0.1:8080
```

## API

- `GET /health`
- `POST /api/uploads/presign`
- `GET /api/tenants/:tenantId/state/:moduleName`
- `PUT /api/tenants/:tenantId/state/:moduleName`
- `GET /api/public/qr/:tenantId`

Protected endpoints expect an Amazon Cognito JWT bearer token when Cognito is configured.
