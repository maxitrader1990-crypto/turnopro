-- ==========================================
-- SCRIPT DE EMERGENCIA: REPARACIÓN DE PERMISOS DE EMPLEADOS
-- ==========================================

-- Este script arregla el problema de "No se ven los empleados" y "No puedo crear empleados".
-- Restaura el acceso público para la página de reservas y da acceso total al Dueño.

-- 1. Habilitar seguridad (por si acaso)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 2. Borrar políticas anteriores restrictivas o conflictivas
DROP POLICY IF EXISTS "Allow read by email match" ON public.employees;
DROP POLICY IF EXISTS "Public Read Access" ON public.employees;
DROP POLICY IF EXISTS "Owner Full Access" ON public.employees;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;

-- 3. POLÍTICA PÚBLICA (Para la Página de Reservas)
-- Permite que CUALQUIERA (incluso sin loguearse) vea la lista de empleados.
-- Necesario para que clientes elijan barbero.
CREATE POLICY "Public Read Access" ON public.employees
FOR SELECT
TO public
USING (true);

-- 4. POLÍTICA DE DUEÑO (Para el Dashboard)
-- Permite que el DUEÑO del negocio pueda VER, CREAR, EDITAR y BORRAR sus empleados.
-- Verifica que el user_id actual sea dueño del business_id del empleado.
CREATE POLICY "Owner Full Access" ON public.employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_users bu
    WHERE bu.business_id = employees.business_id
    AND bu.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_users bu
    WHERE bu.business_id = employees.business_id
    AND bu.user_id = auth.uid()
  )
);

-- 5. (Opcional) Permitir que el propio empleado edite su perfil si tiene email vinculado
CREATE POLICY "Employee Self Edit" ON public.employees
FOR UPDATE
TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());
