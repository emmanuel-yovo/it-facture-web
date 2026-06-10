-- 1. Trigger pour la création automatique du Profile et Workspace lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Créer le workspace pour l'utilisateur
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (new.email || '''s Workspace', new.id)
  RETURNING id INTO new_workspace_id;

  -- Créer le profil
  INSERT INTO public.profiles (id, workspace_id, full_name, role)
  VALUES (new.id, new_workspace_id, COALESCE(new.raw_user_meta_data->>'full_name', 'Utilisateur'), 'admin');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Fonction pour générer le prochain numéro de facture (Thread-safe)
CREATE OR REPLACE FUNCTION get_next_invoice_number(
  p_workspace_id UUID,
  p_doc_type TEXT -- 'invoice' ou 'quote'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_prefix TEXT;
  v_last_number TEXT;
  v_next_seq INTEGER;
  v_new_number TEXT;
BEGIN
  v_year := to_char(CURRENT_DATE, 'YYYY');
  
  IF p_doc_type = 'invoice' THEN
    v_prefix := 'FAC-' || v_year || '-';
  ELSE
    v_prefix := 'DEV-' || v_year || '-';
  END IF;

  -- Trouver le dernier numéro pour cette année
  SELECT invoice_number INTO v_last_number
  FROM invoices
  WHERE workspace_id = p_workspace_id 
    AND document_type = p_doc_type
    AND invoice_number LIKE v_prefix || '%'
  ORDER BY invoice_number DESC
  LIMIT 1;

  IF v_last_number IS NULL THEN
    v_next_seq := 1;
  ELSE
    -- Extraire la partie numérique ex: 'FAC-2026-0005' -> '0005' -> 5
    v_next_seq := CAST(SUBSTRING(v_last_number FROM LENGTH(v_prefix) + 1) AS INTEGER) + 1;
  END IF;

  -- Formater avec des zéros (ex: 0001)
  v_new_number := v_prefix || LPAD(v_next_seq::TEXT, 4, '0');
  
  RETURN v_new_number;
END;
$$;


-- 3. Fonction pour mettre à jour automatiquement le statut d'une facture après un paiement
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_total_paid NUMERIC;
  v_grand_total NUMERIC;
BEGIN
  -- Déterminer l'ID de la facture
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  -- Calculer le total payé
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE invoice_id = v_invoice_id;

  -- Récupérer le total de la facture
  SELECT grand_total INTO v_grand_total
  FROM invoices
  WHERE id = v_invoice_id;

  -- Mettre à jour le statut
  IF v_total_paid >= v_grand_total AND v_grand_total > 0 THEN
    UPDATE invoices SET status = 'paid' WHERE id = v_invoice_id;
  ELSIF v_total_paid > 0 THEN
    UPDATE invoices SET status = 'partial' WHERE id = v_invoice_id;
  ELSE
    UPDATE invoices SET status = 'unpaid' WHERE id = v_invoice_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger aux paiements
CREATE TRIGGER trigger_update_invoice_status
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE PROCEDURE update_invoice_payment_status();
