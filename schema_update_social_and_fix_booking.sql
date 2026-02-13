-- 1. Add Social Media Columns to Employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- 2. Ensure Public Insert Policies for Booking Flow (Anon Access)

-- Customers Table: Allow public to create basic customer records
DROP POLICY IF EXISTS "Public can create customers" ON customers;
CREATE POLICY "Public can create customers" ON customers
FOR INSERT 
TO anon
WITH CHECK (true);

-- Appointments Table: Allow public to create appointments
DROP POLICY IF EXISTS "Public can create appointments" ON appointments;
CREATE POLICY "Public can create appointments" ON appointments
FOR INSERT
TO anon
WITH CHECK (true);

-- 3. Verify Read Access (Already likely set, but reinforcing)
DROP POLICY IF EXISTS "Public can view active employees" ON employees;
CREATE POLICY "Public can view active employees" ON employees
FOR SELECT
TO anon
USING (is_active = true AND deleted_at IS NULL);
