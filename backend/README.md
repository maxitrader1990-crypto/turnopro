# TurnoPro Backend

SaaS Platform for Shift/Appointment Management with Gamification.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Database Setup:
   - Ensure PostgreSQL is running.
   - Create a database named `turnopro`.
   - Run the schema script:

     ```bash
     psql -U postgres -d turnopro -f db/schema.sql
     ```

3. Environment Variables:
   - Copy `.env.example` to `.env`.
   - Update values.

4. Run Server:

   ```bash
   npm run dev
   ```

## Architecture

- **Multi-tenant**: Uses `business_id` column in all tables.
- **Middleware**: `tenantIsolation` automatically resolves tenant context from subdomain.
- **Gamification**: Built-in engine for points, levels, and rewards.

## API Endpoints

- Auth: `/api/auth/register`, `/api/auth/login`
- Super Admin: `/api/admin/businesses`

## License

Proprietary
