-- Fonction pour vérifier la limite de factures
CREATE OR REPLACE FUNCTION check_invoice_limit()
RETURNS trigger AS $$
DECLARE
  workspace_plan text;
  invoice_count integer;
BEGIN
  -- 1. Récupérer le plan de l'entreprise
  SELECT plan INTO workspace_plan FROM public.workspaces WHERE id = NEW.workspace_id;
  
  -- Si aucun plan trouvé, on part du principe que c'est le plan "free"
  IF workspace_plan IS NULL THEN
    workspace_plan := 'free';
  END IF;

  -- 2. Compter le nombre actuel de factures
  SELECT count(*) INTO invoice_count FROM public.invoices WHERE workspace_id = NEW.workspace_id;

  -- 3. Vérifier les limites selon le plan
  IF workspace_plan = 'free' AND invoice_count >= 5 THEN
    RAISE EXCEPTION 'Limite atteinte : Le plan Gratuit est limité à 5 factures maximum. Veuillez passer au plan Starter ou supérieur.';
  ELSIF workspace_plan = 'starter' AND invoice_count >= 50 THEN
    RAISE EXCEPTION 'Limite atteinte : Le plan Starter est limité à 50 factures maximum. Veuillez passer au plan Business ou supérieur.';
  END IF;
  
  -- Pour "business" et "agency", il n'y a pas de limite (Infinity), on laisse passer
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger à la table invoices
DROP TRIGGER IF EXISTS enforce_invoice_limit_trigger ON public.invoices;
CREATE TRIGGER enforce_invoice_limit_trigger
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION check_invoice_limit();


-- Fonction pour vérifier la limite de clients
CREATE OR REPLACE FUNCTION check_client_limit()
RETURNS trigger AS $$
DECLARE
  workspace_plan text;
  client_count integer;
BEGIN
  SELECT plan INTO workspace_plan FROM public.workspaces WHERE id = NEW.workspace_id;
  
  IF workspace_plan IS NULL THEN
    workspace_plan := 'free';
  END IF;

  SELECT count(*) INTO client_count FROM public.clients WHERE workspace_id = NEW.workspace_id;

  IF workspace_plan = 'free' AND client_count >= 3 THEN
    RAISE EXCEPTION 'Limite atteinte : Le plan Gratuit est limité à 3 clients maximum.';
  ELSIF workspace_plan = 'starter' AND client_count >= 50 THEN
    RAISE EXCEPTION 'Limite atteinte : Le plan Starter est limité à 50 clients maximum.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger à la table clients
DROP TRIGGER IF EXISTS enforce_client_limit_trigger ON public.clients;
CREATE TRIGGER enforce_client_limit_trigger
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION check_client_limit();
