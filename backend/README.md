# Vidya Plus - PHP/MySQL Backend

This is the PHP/MySQL backend for the Vidya+ College Management System.

## Getting Started

### Running the Server

#### Development Mode
You can run the backend server using the built-in PHP server:

From the backend directory:
```
php -S localhost:8000
```

Or from the project root using the npm script:
```
npm run dev:php
```

## Files

- `db.php` - PDO database connection and helper functions
- `index.php` - Simple router for handling requests
- `auth.php` - Authentication endpoints (login/logout/session) and default super admin creation
- `institutes.php` - Institute management endpoints
- `website_content.php` - Get/post website page content
- `team.php` - CRUD for website_team
- `uploads.php` - File upload handler (multipart/form-data)
- `uploads/` - Uploaded files (created at runtime)
- `schema.sql` - SQL schema to run manually if desired

## Database Configuration

Default DB credentials in `db.php` are set to:
- Server: `auth-db1234.hstgr.io:3306`
- Database: `u441114691_vidya`
- User: `u441114691_vidya`
- Password: `Aarya@202112345`

## Default User

A default super admin user is automatically created if it doesn't exist:
- Email: `hisofttechnology2016@gmail.com`
- Password: `1234567890`

## Deployment Notes

- Upload the `backend` folder to your Hostinger account. Ensure PHP version is compatible (7.4+ recommended).
- Make `backend/uploads` writable (chmod 755/775 as needed).
- Update `db.php` if Hostinger provides different DB user or host.
- Frontend expects backend routes under `/backend/...`. If you deploy at a different path, update the frontend configuration.

## Frontend Integration

The frontend is configured to connect to this backend via the `VITE_API_BASE` environment variable in the `.env` file. If not set, it defaults to `http://localhost:8000`.
