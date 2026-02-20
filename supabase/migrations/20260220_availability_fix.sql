-- ==========================================
-- SCRIPT CORREGIDO: DISPONIBILIDAD Y SEGURIDAD
-- ==========================================

-- 1. Asegurar RLS en Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Borrar políticas previas si existen para evitar conflictos
DROP POLICY IF EXISTS "Owners can view all business appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;

-- Política: Los dueños de negocio pueden ver TODO de su negocio
CREATE POLICY "Owners can view all business appointments"
ON public.appointments
FOR SELECT
USING (
    -- Dueño del negocio (business_users está vinculado a auth.users)
    auth.uid() IN (
        SELECT user_id FROM public.business_users WHERE business_id = appointments.business_id
    )
    OR
    -- Super Admin (revisar tabla super_admins)
    auth.uid() IN (
        SELECT user_id FROM public.super_admins
    )
);

-- Política: Permitir INSERT público (para reservas anónimas/clientes)
CREATE POLICY "Public can insert appointments"
ON public.appointments
FOR INSERT
WITH CHECK (true); 


-- 2. Función RPC para obtener disponibilidad
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

-- Permisos
GRANT EXECUTE ON FUNCTION public.get_day_appointments(uuid, uuid, date) TO anon;
GRANT EXECUTE ON FUNCTION public.get_day_appointments(uuid, uuid, date) TO authenticated;
