-- ==========================================
-- SCRIPT "CERO ERRORES" - IDENTIDAD AUTOMÁTICA
-- ==========================================

-- 1. Función RPC para reparación Manual / Frontend
-- Esta la usa la app cuando detecta problemas o usuario manual.
CREATE OR REPLACE FUNCTION public.claim_profile_by_email()
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

  -- Vincula Negocio
  UPDATE public.business_users 
  SET user_id = current_uid
  WHERE email = current_email 
  AND user_id IS NULL;

  -- Vincula Empleado
  UPDATE public.employees
  SET user_id = current_uid
  WHERE email = current_email 
  AND user_id IS NULL;
END;
$$;

-- Permisos para RPC
GRANT EXECUTE ON FUNCTION public.claim_profile_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_profile_by_email() TO anon;


-- 2. Función Trigger para Usuarios NUEVOS
-- Esta corre automáticamente DENTRO de la base de datos cuando alguien se registra.
CREATE OR REPLACE FUNCTION public.handle_new_user_linking()
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

  -- Intentar vincular con Business Users existente
  UPDATE public.business_users
  SET user_id = NEW.id
  WHERE email = NEW.email
  AND user_id IS NULL;

  -- Intentar vincular con Employee existente
  UPDATE public.employees
  SET user_id = NEW.id
  WHERE email = NEW.email
  AND user_id IS NULL;

  RETURN NEW;
END;
$$;

-- 3. Crear el Trigger en auth.users
-- Primero borramos si existe para evitar duplicados
DROP TRIGGER IF EXISTS on_auth_user_created_link_identity ON auth.users;

CREATE TRIGGER on_auth_user_created_link_identity
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_linking();

-- Confirmación
COMMENT ON TRIGGER on_auth_user_created_link_identity ON auth.users IS 'Trigger de seguridad para vincular automáticamente perfiles de negocio por email al registrarse.';
