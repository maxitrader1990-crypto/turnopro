-- ==========================================
-- SCRIPT DE COMPATIBILIDAD (Frontend Viejo)
-- ==========================================

-- PROBLEMA:
-- La versión web actual busca al usuario por su ID ("Dame el negocio del usuario X").
-- Mis arreglos anteriores permitían buscar por EMAIL ("Dame el negocio con email Y").
-- Como la web vieja usa ID, la base de datos le dice "No tengo nada" (porque faltaba permiso por ID).

-- SOLUCIÓN:
-- Permitir explícitamente que un usuario se busque a sí mismo por ID.

-- 1. Para Dueños de Negocio
CREATE POLICY "Allow select own by user_id" ON public.business_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Para Empleados (Auto-consulta)
CREATE POLICY "Allow select own employee by user_id" ON public.employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
