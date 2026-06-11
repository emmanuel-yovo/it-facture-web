-- Supprimer l'ancienne politique si elle existait déjà sous un autre nom
DROP POLICY IF EXISTS "Users can insert their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can insert workspaces" ON public.workspaces;

-- Créer la politique qui autorise un utilisateur connecté à créer son entreprise
CREATE POLICY "Users can insert their own workspaces"
ON public.workspaces
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Autoriser également la mise à jour de son propre profil au cas où (pour changer de rôle en admin)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
