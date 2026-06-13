-- Migration 011: Sécurisation des limites d'abonnement (Triggers)

-- Cette fonction générique vérifie les limites en fonction de la table cible
CREATE OR REPLACE FUNCTION check_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_workspace_id UUID;
    v_plan TEXT;
    v_current_count INTEGER;
    v_limit INTEGER;
    v_is_superadmin BOOLEAN := FALSE;
BEGIN
    -- 1. Récupérer le workspace_id de la ligne à insérer
    IF TG_TABLE_NAME = 'profiles' THEN
        v_workspace_id := NEW.workspace_id;
    ELSE
        v_workspace_id := NEW.workspace_id;
    END IF;

    -- Si pas de workspace_id, on ignore (ex: profils superadmin orphelins)
    IF v_workspace_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 2. Vérifier si l'utilisateur courant est superadmin
    -- (Le superadmin contourne les limites)
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (role = 'superadmin' OR EXISTS (SELECT 1 FROM roles WHERE id = profiles.role_id AND name = 'superadmin'))
    ) INTO v_is_superadmin;

    IF v_is_superadmin THEN
        RETURN NEW;
    END IF;

    -- 3. Récupérer le plan du workspace
    SELECT plan INTO v_plan FROM workspaces WHERE id = v_workspace_id;

    -- 4. Définir les limites selon le plan et la table
    IF TG_TABLE_NAME = 'clients' THEN
        IF v_plan = 'free' THEN v_limit := 3;
        ELSIF v_plan = 'starter' THEN v_limit := 50;
        ELSE v_limit := -1; -- -1 signifie infini
        END IF;

        IF v_limit != -1 THEN
            SELECT count(*) INTO v_current_count FROM clients WHERE workspace_id = v_workspace_id;
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Limite de clients atteinte pour le plan %', v_plan USING ERRCODE = 'P0001';
            END IF;
        END IF;

    ELSIF TG_TABLE_NAME = 'invoices' THEN
        IF v_plan = 'free' THEN v_limit := 5;
        ELSIF v_plan = 'starter' THEN v_limit := 50;
        ELSE v_limit := -1;
        END IF;

        IF v_limit != -1 THEN
            SELECT count(*) INTO v_current_count FROM invoices WHERE workspace_id = v_workspace_id;
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Limite de factures/devis atteinte pour le plan %', v_plan USING ERRCODE = 'P0001';
            END IF;
        END IF;

    ELSIF TG_TABLE_NAME = 'profiles' THEN
        IF v_plan = 'free' THEN v_limit := 1;
        ELSIF v_plan = 'starter' THEN v_limit := 1;
        ELSIF v_plan = 'business' THEN v_limit := 3;
        ELSE v_limit := -1;
        END IF;

        IF v_limit != -1 THEN
            SELECT count(*) INTO v_current_count FROM profiles WHERE workspace_id = v_workspace_id;
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Limite d''utilisateurs atteinte pour le plan %', v_plan USING ERRCODE = 'P0001';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS tr_check_limits_clients ON clients;
DROP TRIGGER IF EXISTS tr_check_limits_invoices ON invoices;
DROP TRIGGER IF EXISTS tr_check_limits_profiles ON profiles;

-- Créer les Triggers BEFORE INSERT
CREATE TRIGGER tr_check_limits_clients
BEFORE INSERT ON clients
FOR EACH ROW EXECUTE FUNCTION check_subscription_limits();

CREATE TRIGGER tr_check_limits_invoices
BEFORE INSERT ON invoices
FOR EACH ROW EXECUTE FUNCTION check_subscription_limits();

CREATE TRIGGER tr_check_limits_profiles
BEFORE INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION check_subscription_limits();
