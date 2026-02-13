-- Enable RLS on tables (if not already enabled)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow public read access (ANON)
CREATE POLICY "Public Read Businesses" ON businesses FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Services" ON services FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Employees" ON employees FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Portfolio" ON portfolio_items FOR SELECT TO anon USING (true);

-- Allow public create access for Customers and Appointments (for booking)
CREATE POLICY "Public Create Customers" ON customers FOR INSERT TO anon WITH CHECK (true);
-- Note: You might want to restrict this more in production
CREATE POLICY "Public Create Appointments" ON appointments FOR INSERT TO anon WITH CHECK (true);

-- Grant usage on schema (sometimes needed)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
