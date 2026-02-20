-- ==========================================
-- SCRIPT FINAL: ARREGLO DE PERMISOS DE CALENDARIO
-- ==========================================

-- 1. Habilitar seguridad en Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas que pueden estar fallando
DROP POLICY IF EXISTS "Owners can view all business appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Enable read access for owners" ON public.appointments;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.appointments;

-- 3. Crear Política SIMPLIFICADA (Solo verifica dueños de negocio)
-- Esta política permite al dueño ver todos los turnos de sU negocio.
CREATE POLICY "Owners can view all business appointments"
ON public.appointments
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM public.business_users 
        WHERE business_id = appointments.business_id
    )
);

-- 4. Política de Inserción Pública (Necesaria para que los clientes reserven)
CREATE POLICY "Public can insert appointments"
ON public.appointments
FOR INSERT
WITH CHECK (true); 

-- 5. Función de Disponibilidad (RPC)
-- Si ya existe, la reemplazamos para asegurar que funcione
CREATE OR REPLACE FUNCTION public.get_day_appointments(
    p_business_id uuid,
    p_employee_id uuid,
    p_date date
)
RETURNS TABLE (
    start_time time,
    end_time time
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.start_time::time,
        a.end_time::time
    FROM public.appointments a
    WHERE a.business_id = p_business_id
    AND a.employee_id = p_employee_id
    AND a.appointment_date = p_date
    AND a.status != 'cancelled';
END;
$$;

-- Permisos RPC
GRANT EXECUTE ON FUNCTION public.get_day_appointments(uuid, uuid, date) TO anon;
GRANT EXECUTE ON FUNCTION public.get_day_appointments(uuid, uuid, date) TO authenticated;
