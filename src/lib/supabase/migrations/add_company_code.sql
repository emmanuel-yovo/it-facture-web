-- 1. Ajouter la colonne company_code à la table workspaces si elle n'existe pas
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS company_code TEXT UNIQUE;

-- 2. Générer des codes pour les workspaces existants qui n'en ont pas
-- (Format: 6 caractères aléatoires majuscules/chiffres)
UPDATE workspaces 
SET company_code = upper(substring(md5(random()::text) from 1 for 6)) 
WHERE company_code IS NULL;

-- 3. Créer la fonction sécurisée pour rejoindre un workspace via le code
CREATE OR REPLACE FUNCTION join_workspace(invite_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Permet à la fonction de s'exécuter avec les privilèges du créateur
AS $$
DECLARE
  target_workspace_id uuid;
  current_user_id uuid;
BEGIN
  -- Obtenir l'ID de l'utilisateur qui fait la requête
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  -- Trouver le workspace correspondant au code
  SELECT id INTO target_workspace_id 
  FROM workspaces 
  WHERE company_code = invite_code 
  LIMIT 1;

  -- Si le workspace n'existe pas, retourner false
  IF target_workspace_id IS NULL THEN
    RETURN false;
  END IF;

  -- Mettre à jour le profil de l'utilisateur avec l'ID du workspace et le rôle 'user'
  UPDATE profiles 
  SET 
    workspace_id = target_workspace_id,
    role = 'user'
  WHERE id = current_user_id;

  RETURN true;
END;
$$;
