-- Migration: 012_fix_onboarding_trigger.sql
-- Description: Autorise l'attribution initiale du rôle admin et du workspace_id lors de l'onboarding.

CREATE OR REPLACE FUNCTION protect_profile_critical_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si c'est un superadmin ou le compte de service, on autorise tout
  IF (auth.uid() IS NULL OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin') THEN
    RETURN NEW;
  END IF;

  -- CAS ONBOARDING : Si l'utilisateur n'a pas encore de workspace, on l'autorise à s'y lier en tant qu'admin
  IF OLD.workspace_id IS NULL AND NEW.workspace_id IS NOT NULL THEN
    -- On laisse le changement de workspace_id s'opérer
    -- Et on laisse le changement de rôle vers 'admin' ou le role_id si fournis
    RETURN NEW;
  END IF;

  -- Pour les utilisateurs normaux ayant DÉJÀ un workspace, on bloque la modification des accès
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role = OLD.role;
  END IF;

  IF NEW.role_id IS DISTINCT FROM OLD.role_id THEN
    NEW.role_id = OLD.role_id;
  END IF;

  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    NEW.workspace_id = OLD.workspace_id;
  END IF;

  RETURN NEW;
END;
$$;
