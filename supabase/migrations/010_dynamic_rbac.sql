-- 1. Create Roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Role Permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission VARCHAR(255) NOT NULL,
    PRIMARY KEY (role_id, permission)
);

-- 3. Add system roles
INSERT INTO public.roles (id, workspace_id, name, description, is_system)
VALUES 
    ('00000000-0000-0000-0000-000000000001', NULL, 'superadmin', 'Administrateur global de la plateforme IT-Facture', TRUE),
    ('00000000-0000-0000-0000-000000000002', NULL, 'admin', 'Propriétaire ou gérant du workspace', TRUE),
    ('00000000-0000-0000-0000-000000000003', NULL, 'comptable', 'Accès restreint aux finances et rapports', TRUE),
    ('00000000-0000-0000-0000-000000000004', NULL, 'user', 'Employé standard (création factures/clients)', TRUE)
ON CONFLICT DO NOTHING;

-- 4. Map system permissions
-- ADMIN
INSERT INTO public.role_permissions (role_id, permission) VALUES
('00000000-0000-0000-0000-000000000002', 'manage_users'),
('00000000-0000-0000-0000-000000000002', 'manage_agencies'),
('00000000-0000-0000-0000-000000000002', 'manage_settings'),
('00000000-0000-0000-0000-000000000002', 'view_reports'),
('00000000-0000-0000-0000-000000000002', 'manage_discounts'),
('00000000-0000-0000-0000-000000000002', 'view_audit'),
('00000000-0000-0000-0000-000000000002', 'manage_expenses'),
('00000000-0000-0000-0000-000000000002', 'manage_reminders')
ON CONFLICT DO NOTHING;

-- COMPTABLE
INSERT INTO public.role_permissions (role_id, permission) VALUES
('00000000-0000-0000-0000-000000000003', 'view_reports')
ON CONFLICT DO NOTHING;

-- SUPERADMIN
-- We could give superadmin all permissions or just bypass it in code. We'll bypass in code.

-- 5. Add role_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- 6. Migrate existing profiles
UPDATE public.profiles SET role_id = '00000000-0000-0000-0000-000000000001' WHERE role = 'superadmin';
UPDATE public.profiles SET role_id = '00000000-0000-0000-0000-000000000002' WHERE role = 'admin';
UPDATE public.profiles SET role_id = '00000000-0000-0000-0000-000000000003' WHERE role = 'comptable';
UPDATE public.profiles SET role_id = '00000000-0000-0000-0000-000000000004' WHERE role = 'user' OR role IS NULL;

-- 7. Update is_workspace_admin function to use role_id OR role for backward compatibility
CREATE OR REPLACE FUNCTION public.is_workspace_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT role IN ('admin', 'superadmin') OR role_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- 8. RLS for Roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view roles in their workspace or system roles"
ON public.roles FOR SELECT
USING (workspace_id = get_user_workspace_id() OR is_system = true);

CREATE POLICY "Admins can manage roles in their workspace"
ON public.roles FOR ALL
USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

-- 9. RLS for Role Permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view role permissions"
ON public.role_permissions FOR SELECT
USING (
  role_id IN (SELECT id FROM public.roles WHERE workspace_id = get_user_workspace_id() OR is_system = true)
);

CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL
USING (
  role_id IN (SELECT id FROM public.roles WHERE workspace_id = get_user_workspace_id() AND is_system = false)
  AND is_workspace_admin()
);
