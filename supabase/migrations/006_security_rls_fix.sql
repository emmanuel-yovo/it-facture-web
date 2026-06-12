-- Protection contre l'élévation de privilèges sur la table profiles
-- On s'assure qu'un utilisateur ne peut pas changer son propre rôle ni son workspace_id

CREATE OR REPLACE FUNCTION protect_profile_critical_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec les droits du créateur pour bypasser les restrictions RLS si besoin
AS $$
BEGIN
  -- Si c'est un superadmin ou le compte de service (bypass RLS), on autorise la modification
  IF (auth.uid() IS NULL OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin') THEN
    RETURN NEW;
  END IF;

  -- Pour les utilisateurs normaux ou admins, on force la conservation de l'ancien role et workspace_id
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role = OLD.role;
  END IF;

  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    NEW.workspace_id = OLD.workspace_id;
  END IF;

  RETURN NEW;
END;
$$;

-- On s'assure de supprimer le trigger s'il existait déjà pour éviter les erreurs
DROP TRIGGER IF EXISTS ensure_profile_security ON profiles;

CREATE TRIGGER ensure_profile_security
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_critical_fields();
