# Local Setup

## 1. Install dependencies
```bash
npm install
```

## 2. Create and seed the local database
```bash
npm run db:setup
```

This creates a local MySQL database named `vidya_plus` using:
- `backend/schema.sql`
- `backend/seed.sql`

Default local DB settings used by the backend:
- Host: `127.0.0.1`
- Port: `3306`
- User: `root`
- Password: empty
- Database: `vidya_plus`

## 3. Run frontend and backend together
```bash
npm run local
```

## 4. Open the app
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Default admin login
- Email: `hisofttechnology2016@gmail.com`
- Password: `1234567890`
