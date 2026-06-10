-- Activer RLS sur toutes les tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Fonction utilitaire pour récupérer le workspace_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT workspace_id FROM profiles WHERE id = auth.uid();
$$;

-- Fonction utilitaire pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_workspace_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$;


-- Workspaces
CREATE POLICY "Users can view their own workspace"
ON workspaces FOR SELECT
USING (id = get_user_workspace_id());

CREATE POLICY "Admins can update their workspace"
ON workspaces FOR UPDATE
USING (id = get_user_workspace_id() AND is_workspace_admin());


-- Profiles
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());


-- Politiques génériques pour les tables contenant workspace_id
-- S'applique à : clients, services, discounts, invoices, settings, subscriptions, expenses, tickets, reminders, audit_logs

-- Macro SQL non possible directement dans PostgreSQL, on doit écrire chaque table :

-- CLIENTS
CREATE POLICY "workspace_isolation_clients_select" ON clients FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_clients_insert" ON clients FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_clients_update" ON clients FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_clients_delete" ON clients FOR DELETE USING (workspace_id = get_user_workspace_id());

-- SERVICES
CREATE POLICY "workspace_isolation_services_select" ON services FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_services_insert" ON services FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_services_update" ON services FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_services_delete" ON services FOR DELETE USING (workspace_id = get_user_workspace_id());

-- DISCOUNTS
CREATE POLICY "workspace_isolation_discounts_select" ON discounts FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_discounts_insert" ON discounts FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_discounts_update" ON discounts FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_discounts_delete" ON discounts FOR DELETE USING (workspace_id = get_user_workspace_id());

-- INVOICES
CREATE POLICY "workspace_isolation_invoices_select" ON invoices FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_invoices_insert" ON invoices FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_invoices_update" ON invoices FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_invoices_delete" ON invoices FOR DELETE USING (workspace_id = get_user_workspace_id());

-- SETTINGS
CREATE POLICY "workspace_isolation_settings_select" ON settings FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_settings_insert" ON settings FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_settings_update" ON settings FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_settings_delete" ON settings FOR DELETE USING (workspace_id = get_user_workspace_id());

-- SUBSCRIPTIONS
CREATE POLICY "workspace_isolation_subscriptions_select" ON subscriptions FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_subscriptions_update" ON subscriptions FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_subscriptions_delete" ON subscriptions FOR DELETE USING (workspace_id = get_user_workspace_id());

-- EXPENSES
CREATE POLICY "workspace_isolation_expenses_select" ON expenses FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_expenses_insert" ON expenses FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_expenses_update" ON expenses FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_expenses_delete" ON expenses FOR DELETE USING (workspace_id = get_user_workspace_id());

-- TICKETS
CREATE POLICY "workspace_isolation_tickets_select" ON tickets FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_tickets_insert" ON tickets FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_tickets_update" ON tickets FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_tickets_delete" ON tickets FOR DELETE USING (workspace_id = get_user_workspace_id());

-- REMINDERS
CREATE POLICY "workspace_isolation_reminders_select" ON reminders FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_reminders_insert" ON reminders FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_reminders_update" ON reminders FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_reminders_delete" ON reminders FOR DELETE USING (workspace_id = get_user_workspace_id());

-- AUDIT LOGS
CREATE POLICY "workspace_isolation_audit_select" ON audit_logs FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_isolation_audit_insert" ON audit_logs FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
-- Personne ne modifie ou supprime les logs d'audit


-- INVOICE ITEMS (Hérite via la jointure avec invoice)
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT
USING (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()));

CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()));

CREATE POLICY "invoice_items_update" ON invoice_items FOR UPDATE
USING (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()));

CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE
USING (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()));


-- PAYMENTS (Hérite via la jointure avec invoice)
CREATE POLICY "payments_select" ON payments FOR SELECT
USING (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()));

CREATE POLICY "payments_insert" ON payments FOR INSERT
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()));

CREATE POLICY "payments_delete" ON payments FOR DELETE
USING (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()));
