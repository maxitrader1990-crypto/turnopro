-- 1. Update subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS plan_id text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS payment_provider text,
ADD COLUMN IF NOT EXISTS last_payment_id uuid;

-- 2. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    provider text NOT NULL, -- mercadopago, stripe, manual
    amount numeric NOT NULL,
    currency text DEFAULT 'ARS',
    status text NOT NULL, -- paid, pending, failed
    external_reference text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    discount_percent integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    expires_at timestamp with time zone,
    max_uses integer,
    used_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Payments: Businesses can view their own payments
CREATE POLICY "Enable read access for own payments" ON public.payments
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM public.business_users WHERE business_id = public.payments.business_id
    ));

-- Coupons: Public read (to validate)
CREATE POLICY "Enable read access for coupons" ON public.coupons
    FOR SELECT USING (true);
