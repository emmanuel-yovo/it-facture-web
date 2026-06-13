-- Migration: 008_security_hardening.sql
-- Description: Harden Row Level Security to prevent non-admins from executing DELETE operations and modifying settings/subscriptions.

-- 1. Upgrade is_workspace_admin function to include superadmin
CREATE OR REPLACE FUNCTION is_workspace_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT role IN ('admin', 'superadmin') FROM profiles WHERE id = auth.uid();
$$;

-- 2. Restrict DELETE operations to admins and superadmins for operational tables
DROP POLICY IF EXISTS "workspace_isolation_clients_delete" ON clients;
CREATE POLICY "workspace_isolation_clients_delete" ON clients FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_services_delete" ON services;
CREATE POLICY "workspace_isolation_services_delete" ON services FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_invoices_delete" ON invoices;
CREATE POLICY "workspace_isolation_invoices_delete" ON invoices FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_discounts_delete" ON discounts;
CREATE POLICY "workspace_isolation_discounts_delete" ON discounts FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_expenses_delete" ON expenses;
CREATE POLICY "workspace_isolation_expenses_delete" ON expenses FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_tickets_delete" ON tickets;
CREATE POLICY "workspace_isolation_tickets_delete" ON tickets FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_reminders_delete" ON reminders;
CREATE POLICY "workspace_isolation_reminders_delete" ON reminders FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

-- Invoice sub-tables
DROP POLICY IF EXISTS "invoice_items_delete" ON invoice_items;
CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE USING (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()) AND is_workspace_admin());

DROP POLICY IF EXISTS "payments_delete" ON payments;
CREATE POLICY "payments_delete" ON payments FOR DELETE USING (invoice_id IN (SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()) AND is_workspace_admin());

-- 3. Restrict INSERT, UPDATE, DELETE on Settings
DROP POLICY IF EXISTS "workspace_isolation_settings_update" ON settings;
CREATE POLICY "workspace_isolation_settings_update" ON settings FOR UPDATE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_settings_delete" ON settings;
CREATE POLICY "workspace_isolation_settings_delete" ON settings FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_settings_insert" ON settings;
CREATE POLICY "workspace_isolation_settings_insert" ON settings FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id() AND is_workspace_admin());

-- 4. Restrict INSERT, UPDATE, DELETE on Subscriptions
DROP POLICY IF EXISTS "workspace_isolation_subscriptions_update" ON subscriptions;
CREATE POLICY "workspace_isolation_subscriptions_update" ON subscriptions FOR UPDATE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_subscriptions_delete" ON subscriptions;
CREATE POLICY "workspace_isolation_subscriptions_delete" ON subscriptions FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

DROP POLICY IF EXISTS "workspace_isolation_subscriptions_insert" ON subscriptions;
CREATE POLICY "workspace_isolation_subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id() AND is_workspace_admin());
