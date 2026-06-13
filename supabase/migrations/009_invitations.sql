-- Migration: 009_invitations.sql
-- Description: Create invitations table and stop auto-creating workspaces on user signup

-- 1. Create invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    token UUID NOT NULL DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their workspace invitations" 
ON invitations FOR SELECT 
USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

CREATE POLICY "Admins can insert workspace invitations" 
ON invitations FOR INSERT 
WITH CHECK (workspace_id = get_user_workspace_id() AND is_workspace_admin());

CREATE POLICY "Admins can delete workspace invitations" 
ON invitations FOR DELETE 
USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());


-- 2. Modify handle_new_user to NOT create an empty workspace
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile without a workspace
  -- User will be redirected to /onboarding because workspace_id is NULL
  INSERT INTO public.profiles (id, workspace_id, full_name, role)
  VALUES (new.id, NULL, COALESCE(new.raw_user_meta_data->>'full_name', 'Utilisateur'), 'admin');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
