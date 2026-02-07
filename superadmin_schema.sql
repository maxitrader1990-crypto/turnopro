-- ==========================================
-- SUPER ADMIN SAAS MIGRATION
-- ==========================================

-- 1. Create Super Admins Table
CREATE TABLE IF NOT EXISTS public.super_admins (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view super admins"
ON public.super_admins FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.super_admins));

-- 2. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id),
    amount numeric,
    currency text DEFAULT 'ARS',
    status text, -- paid, pending, failed, refunded
    payment_method text, -- manual, mercadopago, stripe
    payment_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    notes text
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow Super Admins to view all payments
CREATE POLICY "Super admins view all payments"
ON public.payments FOR ALL
USING (auth.uid() IN (SELECT id FROM public.super_admins));

-- Allow Business Owners to view their own payments
CREATE POLICY "Business owners view own payments"
ON public.payments FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.business_users WHERE business_id = public.payments.business_id));

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES auth.users(id),
    action text,
    description text,
    target_id uuid, -- business_id or other entity id
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.super_admins));

-- 4. Ensure Subscriptions Table has all fields
-- (This block is safe to run even if table exists, it just adds missing columns)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='status') THEN
        ALTER TABLE public.subscriptions ADD COLUMN status text DEFAULT 'trial';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_type') THEN
        ALTER TABLE public.subscriptions ADD COLUMN plan_type text DEFAULT 'basic';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='trial_end_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_end_date date;
    END IF;
END $$;

-- 5. FUNCTION: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.super_admins WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. INSERT YOUR USER AS SUPER ADMIN
-- Replace 'maxitrader1990@gmail.com' if needed, but this script tries to match it dynamically
INSERT INTO public.super_admins (id, email)
SELECT id, email FROM auth.users WHERE email = 'maxitrader1990@gmail.com'
ON CONFLICT (id) DO NOTHING;

