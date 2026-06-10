-- Migration: 003_audit_triggers.sql
-- Description: Adds PostgreSQL triggers to automatically log insert/update/delete actions

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action TEXT;
  v_workspace_id UUID;
  v_details TEXT;
  v_resource_id TEXT;
BEGIN
  -- Attempt to get the user ID from the Supabase auth context
  v_user_id := auth.uid();
  
  -- If we can't find a user, we might be running as a service role or webhook.
  -- We'll just leave it null.

  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_workspace_id := NEW.workspace_id;
    v_resource_id := NEW.id::TEXT;
    v_details := 'A créé l''enregistrement dans ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_workspace_id := NEW.workspace_id;
    v_resource_id := NEW.id::TEXT;
    v_details := 'A modifié l''enregistrement dans ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_workspace_id := OLD.workspace_id;
    v_resource_id := OLD.id::TEXT;
    v_details := 'A supprimé l''enregistrement de ' || TG_TABLE_NAME;
  END IF;

  -- Only log if workspace_id is present (avoids errors)
  IF v_workspace_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (workspace_id, user_id, action, resource_type, resource_id, details)
    VALUES (v_workspace_id, v_user_id, v_action, TG_TABLE_NAME, v_resource_id, v_details);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach triggers to tables
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
CREATE TRIGGER audit_clients_trigger AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_invoices_trigger ON invoices;
CREATE TRIGGER audit_invoices_trigger AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_services_trigger ON services;
CREATE TRIGGER audit_services_trigger AFTER INSERT OR UPDATE OR DELETE ON services FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_expenses_trigger ON expenses;
CREATE TRIGGER audit_expenses_trigger AFTER INSERT OR UPDATE OR DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_tickets_trigger ON tickets;
CREATE TRIGGER audit_tickets_trigger AFTER INSERT OR UPDATE OR DELETE ON tickets FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Global Log function for manual logging (like logins)
CREATE OR REPLACE FUNCTION log_global_event(p_user_id UUID, p_action TEXT, p_details TEXT) RETURNS VOID AS $$
BEGIN
  -- For global events, workspace_id is not required, but since it's NOT NULL in our schema, 
  -- we might need to find the user's default workspace or alter the table.
  -- Wait, the audit_logs table has workspace_id UUID NOT NULL.
  -- Let's check the user's workspace_id.
  INSERT INTO public.audit_logs (workspace_id, user_id, action, resource_type, resource_id, details)
  SELECT workspace_id, p_user_id, p_action, 'system', p_user_id::TEXT, p_details
  FROM public.profiles
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
