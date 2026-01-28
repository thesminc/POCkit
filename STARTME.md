# AICT - Quick Start

## Prerequisites

- Node.js v18+
- PostgreSQL running on localhost:5432
- Database: `ai_consultation_v2` (password: `changeme`)

## Start Server

```bash
cd server
npm install
npx prisma generate
npm run dev
```

Server runs on http://localhost:3000

## Start Client

```bash
cd client
npm install
npm run dev
```

Client runs on http://localhost:5173

## Environment Variables

Create `server/.env` if not exists:

```
DATABASE_URL="postgresql://postgres:changeme@localhost:5432/ai_consultation_v2"
ANTHROPIC_API_KEY="your-api-key"
```
