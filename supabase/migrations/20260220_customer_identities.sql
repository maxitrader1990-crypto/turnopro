-- ==========================================
-- SCRIPT ROBUSTO: VINCULACIÓN DE IDENTIDAD DE CLIENTES
-- ==========================================

-- 1. Agregar columna user_id a customers si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='user_id') THEN
        ALTER TABLE public.customers ADD COLUMN user_id uuid REFERENCES auth.users(id);
        CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
    END IF;
END $$;

-- 2. Función RPC para vincular cliente por email (Frontend/AuthContext)
CREATE OR REPLACE FUNCTION public.claim_customer_profile_by_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email text;
  current_uid uuid;
BEGIN
  current_email := auth.email();
  current_uid := auth.uid();
  
  IF current_email IS NULL OR current_uid IS NULL THEN
    RETURN;
  END IF;

  -- Vincula TODOS los registros de cliente que coincidan con este email
  -- (Un usuario puede ser cliente en múltiples negocios)
  UPDATE public.customers 
  SET user_id = current_uid
  WHERE email = current_email 
  AND user_id IS NULL;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.claim_customer_profile_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_customer_profile_by_email() TO anon;


-- 3. Trigger Automático para Nuevos Usuarios (Auth -> Customer)
CREATE OR REPLACE FUNCTION public.handle_new_user_customer_linking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar si el nuevo usuario tiene email
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Intentar vincular con Customers existentes
  UPDATE public.customers
  SET user_id = NEW.id
  WHERE email = NEW.email
  AND user_id IS NULL;

  RETURN NEW;
END;
$$;

-- Crear Trigger en auth.users (si no existe, o reemplazar)
DROP TRIGGER IF EXISTS on_auth_user_created_link_customer ON auth.users;

CREATE TRIGGER on_auth_user_created_link_customer
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_customer_linking();


-- 4. BACKFILL: Vincular usuarios existentes con clientes existentes
-- Esto corre una sola vez para arreglar los datos actuales
UPDATE public.customers c
SET user_id = u.id
FROM auth.users u
WHERE c.email = u.email
AND c.user_id IS NULL;
