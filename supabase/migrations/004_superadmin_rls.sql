-- Fonction utilitaire pour vérifier si l'utilisateur courant est superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT role = 'superadmin' FROM profiles WHERE id = auth.uid();
$$;

-- Mettre à jour les politiques de sélection (Lecture) pour que le superadmin voie tout
-- 1. Workspaces
DROP POLICY IF EXISTS "Users can view their own workspace" ON workspaces;
CREATE POLICY "Users can view their own workspace or superadmin sees all"
ON workspaces FOR SELECT
USING (id = get_user_workspace_id() OR is_superadmin());

-- 2. Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their workspace" ON profiles;
CREATE POLICY "Users can view profiles in their workspace or superadmin sees all"
ON profiles FOR SELECT
USING (workspace_id = get_user_workspace_id() OR id = auth.uid() OR is_superadmin());

-- 3. Invoices
DROP POLICY IF EXISTS "Users can view invoices in their workspace" ON invoices;
CREATE POLICY "Users can view invoices in their workspace or superadmin sees all"
ON invoices FOR SELECT
USING (workspace_id = get_user_workspace_id() OR is_superadmin());

-- 4. Clients
DROP POLICY IF EXISTS "Users can view clients in their workspace" ON clients;
CREATE POLICY "Users can view clients in their workspace or superadmin sees all"
ON clients FOR SELECT
USING (workspace_id = get_user_workspace_id() OR is_superadmin());

-- 5. Subscriptions
DROP POLICY IF EXISTS "Users can view subscriptions in their workspace" ON subscriptions;
CREATE POLICY "Users can view subscriptions in their workspace or superadmin sees all"
ON subscriptions FOR SELECT
USING (workspace_id = get_user_workspace_id() OR is_superadmin());
