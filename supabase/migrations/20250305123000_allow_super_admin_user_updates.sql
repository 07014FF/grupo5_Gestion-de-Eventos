-- Permitir que los super administradores gestionen roles de cualquier usuario
-- Esta migración agrega una política RLS adicional en public.users

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can update users" ON public.users;

CREATE POLICY "Super admins can update users"
  ON public.users FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

COMMENT ON POLICY "Super admins can update users" ON public.users IS
  'Permite a super admins actualizar cualquier fila en public.users para gestionar roles.';
