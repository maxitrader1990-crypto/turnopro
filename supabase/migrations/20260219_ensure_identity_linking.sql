-- Database Function: claim_profile_by_email
-- Description: Automatically links a business_users or employees record to the currently authenticated user
-- if the email matches and the user_id is currently NULL.
-- This runs with SECURITY DEFINER to bypass RLS restrictions on unlinked "orphaned" records.

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
  
  -- Safety checks
  IF current_email IS NULL OR current_uid IS NULL THEN
    RETURN;
  END IF;

  -- 1. Link Business Users
  -- Update 'business_users' setting user_id where email matches and user_id is NULL
  UPDATE public.business_users
  SET user_id = current_uid
  WHERE email = current_email 
  AND user_id IS NULL;

  -- 2. Link Employees
  -- Update 'employees' setting user_id where email matches and user_id is NULL
  UPDATE public.employees
  SET user_id = current_uid
  WHERE email = current_email 
  AND user_id IS NULL;
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.claim_profile_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_profile_by_email() TO anon;
