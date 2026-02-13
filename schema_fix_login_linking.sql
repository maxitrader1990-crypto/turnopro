-- RPC para vincular perfiles por email
-- Permite que un usuario (Google o Manual) "reclame" su perfil de negocio/empleado si el email coincide.
-- Esto soluciona el problema de identidades duplicadas o RLS bloqueando el acceso.

CREATE OR REPLACE FUNCTION public.claim_profile_by_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta como admin para saltar RLS y poder editar el user_id
SET search_path = public
AS $$
DECLARE
  current_user_email text;
  current_user_id uuid;
BEGIN
  -- Obtener datos de la sesión actual
  current_user_email := auth.jwt() ->> 'email';
  current_user_id := auth.uid();

  -- Validar que haya sesión
  IF current_user_email IS NULL OR current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- 1. Vincular Business Users (Dueños)
  -- Si existe un dueño con este email pero diferente ID (o NULL), actualízalo al actual.
  UPDATE public.business_users
  SET user_id = current_user_id
  WHERE email = current_user_email
  AND (user_id IS NULL OR user_id != current_user_id);

  -- 2. Vincular Employees (Barberos/Staff)
  UPDATE public.employees
  SET user_id = current_user_id
  WHERE email = current_user_email
  AND (user_id IS NULL OR user_id != current_user_id);
  
END;
$$;
