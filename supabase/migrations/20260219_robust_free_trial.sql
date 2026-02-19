-- ==========================================
-- SCRIPT ROBUSTO: SUSCRIPCIÓN GRATUITA 15 DÍAS
-- ==========================================

-- 1. Asegurar que las columnas de prueba existan en la tabla subscriptions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='trial_start_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_start_date timestamp with time zone DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='trial_end_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_end_date timestamp with time zone;
    END IF;
    -- Asegurar que plan_type tenga valor por defecto 'pro' si es NULL
    ALTER TABLE public.subscriptions ALTER COLUMN plan_type SET DEFAULT 'pro';
    ALTER TABLE public.subscriptions ALTER COLUMN status SET DEFAULT 'trial';
END $$;

-- 2. Función Trigger Robusta para Nuevos Negocios
CREATE OR REPLACE FUNCTION public.handle_new_business_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertamos la suscripción. Usamos ON CONFLICT DO NOTHING para evitar errores si ya existe (idempotencia)
  -- Nota: Normalmente un negocio nuevo no tiene suscripción, pero por seguridad.
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
  )
  ON CONFLICT (business_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. Crear el Trigger (borrar primero para asegurar que es la versión correcta)
DROP TRIGGER IF EXISTS on_business_created_add_subscription ON public.businesses;

CREATE TRIGGER on_business_created_add_subscription
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_business_subscription();

-- 4. RELLENO (BACKFILL) PARA NEGOCIOS EXISTENTES SIN SUSCRIPCIÓN
-- Esto busca negocios que NO tengan suscripción y les crea una de 15 días A PARTIR DE HOY.
INSERT INTO public.subscriptions (
    business_id,
    status,
    plan_type,
    current_period_start,
    current_period_end,
    trial_start_date,
    trial_end_date
)
SELECT 
    b.id, 
    'trial', 
    'pro', 
    now(), 
    now() + interval '15 days', 
    now(), 
    now() + interval '15 days'
FROM public.businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.business_id = b.id
);

-- 5. CORRECCIÓN PARA SUSCRIPCIONES EXISTENTES "ROTAS" (Opcional pero recomendado)
-- Si hay suscripciones en 'trial' pero que expiraron hace mucho o no tienen fechas bien puestas, 
-- podríamos actualizarlas, pero es arriesgado tocar datos existentes sin saber. 
-- El paso 4 ya cubre a los que NO tienen suscripción.
-- Si quisieras "reiniciar" la prueba a todos los que estén en trial:
/*
UPDATE public.subscriptions
SET 
    current_period_end = GREATEST(current_period_end, now() + interval '15 days'),
    trial_end_date = GREATEST(trial_end_date, now() + interval '15 days')
WHERE status = 'trial' AND trial_end_date < now();
*/
