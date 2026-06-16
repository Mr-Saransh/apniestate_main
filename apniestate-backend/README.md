# ApniEstate Backend

Backend API for the ApniEstate Construction ERP Platform.

## Overview

ApniEstate is a construction ERP system designed to manage:

* Projects
* Construction Sites
* Site Supervisors
* Workers Attendance
* Daily Site Reports
* Materials Management
* Equipment Management
* Vendors
* Documents
* Notifications
* User Management

This repository contains the backend services built using:

* Next.js (API Routes)
* TypeScript
* PostgreSQL
* Prisma ORM
* JWT Authentication
* Role-Based Access Control (RBAC)

---

## Tech Stack

| Layer            | Technology     |
| ---------------- | -------------- |
| Runtime          | Node.js        |
| Framework        | Next.js        |
| Language         | TypeScript     |
| Database         | PostgreSQL     |
| ORM              | Prisma         |
| Authentication   | JWT            |
| Validation       | Zod            |
| Storage          | Local / AWS S3 |
| Password Hashing | bcryptjs       |

---

## Project Structure

```text
apniestate-backend/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│
├── src/
│   ├── app/
│   │   └── api/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── sites/
│   │   ├── attendance/
│   │   ├── daily-reports/
│   │   ├── materials/
│   │   ├── vendors/
│   │   ├── equipment/
│   │   ├── documents/
│   │   ├── notifications/
│   │   └── settings/
│   │
│   ├── middleware/
│   ├── storage/
│   ├── lib/
│   └── types/
│
├── .env.example
├── package.json
└── README.md
```

---

## Setup

### Clone Repository

```bash
git clone <repository-url>
cd apniestate-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```bash
cp .env.example .env.local
```

Update values inside `.env.local`.

---

## Database Setup

Create PostgreSQL database:

```sql
CREATE USER apniestate WITH PASSWORD 'your-password';

CREATE DATABASE apniestate_dev
OWNER apniestate;

GRANT ALL PRIVILEGES
ON DATABASE apniestate_dev
TO apniestate;
```

---

## Prisma

Generate Prisma Client:

```bash
npx prisma generate
```

Create migration:

```bash
npx prisma migrate dev --name init
```

Run seed:

```bash
npx prisma db seed
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

## Running Development Server

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:3001
```

---

## Authentication

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "admin@apniestate.com",
  "password": "admin123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {}
  }
}
```

---

### Logout

```http
POST /api/auth/logout
```

Requires:

```http
Authorization: Bearer <token>
```

---

## User Roles

| Role              | Description          |
| ----------------- | -------------------- |
| BUILDER           | System owner         |
| SITE_SUPERVISOR   | Site management      |
| ACCOUNTANT        | Financial operations |
| INVENTORY_MANAGER | Material management  |

---

## Available APIs

### Authentication

```text
POST /api/auth/login
POST /api/auth/logout
```

### Users

```text
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

### Projects

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

### Health Check

```text
GET /api/health
```

---

## Storage Providers

### Local Storage

```env
STORAGE_PROVIDER=local
```

Files stored in:

```text
/uploads
```

### AWS S3

```env
STORAGE_PROVIDER=s3
```

Configure:

```env
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

---

## Development Commands

```bash
# Start server
npm run dev

# Build
npm run build

# Production
npm run start

# Generate Prisma Client
npx prisma generate

# Create Migration
npx prisma migrate dev --name migration_name

# Reset Database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed Database
npx prisma db seed

# Type Check
npx tsc --noEmit
```

---

## Seeded Administrator

Default development administrator:

```text
Email: admin@apniestate.com
Password: admin123
```

Change these credentials immediately in production.

---

## Future Modules

Planned ERP modules:

* Payroll Management
* Purchase Orders
* Inventory Tracking
* Billing & Invoicing
* Expense Tracking
* Contractor Management
* Client Portal
* Mobile Application APIs
* Analytics Dashboard
* Audit Logs

---

## License

Private project.

Copyright © ApniEstate.

