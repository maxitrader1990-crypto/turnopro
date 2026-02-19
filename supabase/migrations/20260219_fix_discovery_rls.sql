-- ==========================================
-- SCRIPT DE VISIBILIDAD DE EMERGENCIA
-- ==========================================

-- Permite que un usuario autenticado vea cualquier perfil de negocio
-- que coincida con su email, INCLUSO si user_id es NULL.
-- Esto es crucial para que el frontend pueda "descubrir" el negocio y reclamarlo.

-- 1. Políticas para Business Users
DROP POLICY IF EXISTS "Allow read by email match" ON public.business_users;

CREATE POLICY "Allow read by email match" ON public.business_users
FOR SELECT
TO authenticated
USING (email = auth.email());

-- 2. Políticas para Employees
DROP POLICY IF EXISTS "Allow read by email match" ON public.employees;

CREATE POLICY "Allow read by email match" ON public.employees
FOR SELECT
TO authenticated
USING (email = auth.email());

-- 3. Asegurar que RLS esté activo (por si acaso)
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
