-- 1. Ensure columns exist
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status text DEFAULT 'trial';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone DEFAULT now();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone DEFAULT (now() + interval '15 days');

-- 2. Function for new businesses (TRIGGER FUNCTION)
CREATE OR REPLACE FUNCTION public.handle_new_business_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (
    business_id,
    status,
    plan_type,
    current_period_start,
    current_period_end,
    trial_start_date,
    trial_end_date
  )
  VALUES (
    NEW.id,
    'trial',
    'premium',
    now(),
    now() + interval '15 days',
    now(),
    now() + interval '15 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger
DROP TRIGGER IF EXISTS on_business_created_add_subscription ON public.businesses;
CREATE TRIGGER on_business_created_add_subscription
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_business_subscription();

-- 4. Migration for existing users
-- Insert missing subscriptions for any business that lacks one
INSERT INTO public.subscriptions (
    business_id, 
    status, 
    plan_type, 
    current_period_start, 
    current_period_end, 
    trial_start_date, 
    trial_end_date
)
SELECT b.id, 'trial', 'premium', now(), now() + interval '15 days', now(), now() + interval '15 days'
FROM public.businesses b
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.business_id = b.id);

-- 5. Fix MaxiTrader specifically (Force Reset to Trial)
UPDATE public.subscriptions
SET status = 'trial',
    plan_type = 'premium',
    current_period_end = (now() + interval '15 days'),
    trial_end_date = (now() + interval '15 days')
WHERE business_id IN (
    SELECT business_id FROM public.business_users WHERE email = 'MaxiTrader1990@gmail.com'
);
