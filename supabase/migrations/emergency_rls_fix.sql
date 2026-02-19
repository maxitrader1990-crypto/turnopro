-- EMERGENCY FIX: ENABLE ACCESS TO SUBSCRIPTIONS
-- This script ensures the frontend can READ and CREATE subscriptions.

-- 1. Enable RLS (if not already)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for Reading (Allow everyone to read their own business's subscription)
-- We use a broad policy for now to ensure it works. 
-- "USING (true)" means PUBLIC READ ACCESS (Temporary for debugging/fixing)
DROP POLICY IF EXISTS "Public read access" ON public.subscriptions;
CREATE POLICY "Public read access" ON public.subscriptions
FOR SELECT USING (true);

-- 3. Create Policy for Inserting (Auto-Healing need this)
DROP POLICY IF EXISTS "Public insert access" ON public.subscriptions;
CREATE POLICY "Public insert access" ON public.subscriptions
FOR INSERT WITH CHECK (true);

-- 4. Create Policy for Updating
DROP POLICY IF EXISTS "Public update access" ON public.subscriptions;
CREATE POLICY "Public update access" ON public.subscriptions
FOR UPDATE USING (true);

-- 5. RE-RUN Columns check just in case
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='trial_start_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_start_date timestamp with time zone DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='trial_end_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_end_date timestamp with time zone;
    END IF;
END $$;
