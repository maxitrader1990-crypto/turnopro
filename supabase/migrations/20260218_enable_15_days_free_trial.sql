
-- 1. Ensure columns exist (Safely)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='trial_start_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_start_date timestamp with time zone DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='trial_end_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_end_date timestamp with time zone;
    END IF;
END $$;

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
    'pro', 
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

-- 4. Migration for existing users (Update non-active subscriptions)
UPDATE public.subscriptions
SET status = 'trial',
    plan_type = 'pro',
    current_period_start = now(),
    current_period_end = (now() + interval '15 days'),
    trial_start_date = now(),
    trial_end_date = (now() + interval '15 days')
WHERE status != 'active';

-- 5. Insert missing subscriptions for any business that lacks one
INSERT INTO public.subscriptions (
    business_id, 
    status, 
    plan_type, 
    current_period_start, 
    current_period_end, 
    trial_start_date, 
    trial_end_date
)
SELECT b.id, 'trial', 'pro', now(), now() + interval '15 days', now(), now() + interval '15 days'
FROM public.businesses b
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.business_id = b.id);
