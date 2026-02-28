# EduTrack — Learning Management System

A full-stack LMS built with vanilla HTML/CSS/JS (frontend) and Express + MongoDB (backend), deployable to Vercel.

## Project Structure

```
edutrack/
├── api/
│   └── index.js          # Express app (Vercel serverless entry)
├── lib/
│   ├── db.js             # Mongoose connection with serverless caching
│   └── seed.js           # One-time data seeder
├── models/
│   ├── Teacher.js        # Mongoose Teacher model
│   └── Group.js          # Mongoose Group model
├── public/
│   └── index.html        # Full frontend SPA
├── .env.example          # Environment variable template
├── .gitignore
├── package.json
├── vercel.json           # Vercel routing config
└── README.md
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# 3. Run locally
node api/index.js
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Then set these environment variables in Vercel Dashboard → Project → Settings → Environment Variables:

| Key               | Value                        |
|-------------------|------------------------------|
| MONGODB_URI       | Your Atlas connection string |
| JWT_SECRET        | A long random secret string  |
| ADMIN_USERNAME    | admin                        |
| ADMIN_PASSWORD    | your secure password         |
| FRONTEND_URL      | https://your-app.vercel.app  |

## MongoDB Atlas (Free Tier)

1. Go to https://cloud.mongodb.com → Create free M0 cluster
2. Database Access → Add user with password
3. Network Access → Add IP 0.0.0.0/0 (allow all for Vercel)
4. Connect → Drivers → Copy connection string
5. Paste into MONGODB_URI (replace username/password)

## API Endpoints

| Method | Endpoint              | Auth    | Description              |
|--------|-----------------------|---------|--------------------------|
| GET    | /api                  | —       | Health check             |
| POST   | /api/auth/admin       | —       | Admin login → JWT        |
| POST   | /api/auth/teacher     | —       | Teacher login → JWT      |
| GET    | /api/teachers         | Admin   | List all teachers        |
| GET    | /api/teachers/me      | Teacher | Own profile              |
| POST   | /api/teachers         | Admin   | Create teacher           |
| PUT    | /api/teachers/:id     | Admin   | Update teacher           |
| DELETE | /api/teachers/:id     | Admin   | Delete teacher + groups  |
| GET    | /api/groups           | Both    | Get groups               |
| POST   | /api/groups           | Both    | Create group             |
| PUT    | /api/groups/:id       | Both    | Update group             |
| DELETE | /api/groups/:id       | Both    | Delete group             |
| GET    | /api/stats            | Admin   | Platform statistics      |

## Demo Credentials

**Admin:** admin / admin123

**Teachers:** alisher.n, malika.y, bobur.t, dilnoza.r, sardor.m — all use password `teacher123`
