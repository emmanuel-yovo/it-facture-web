-- 1. Create agencies table
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prefix TEXT, -- Prefix for invoices e.g. LOM
    address TEXT,
    city TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modify profiles to add agency_id
ALTER TABLE profiles ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;

-- 3. Modify invoices to add agency_id
ALTER TABLE invoices ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;

-- 4. Modify expenses to add agency_id
ALTER TABLE expenses ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;

-- 5. Modify services to add type (product vs service)
ALTER TABLE services ADD COLUMN type TEXT DEFAULT 'service'; -- 'product' or 'service'

-- 6. Create inventory_levels table for branch-specific stock and pricing
CREATE TABLE inventory_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC, -- Overrides service.unit_price if set
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_id, agency_id)
);

-- 7. Add RLS Policies for agencies and inventory
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace agencies" ON agencies
    FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert agencies" ON agencies
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

CREATE POLICY "Admins can update agencies" ON agencies
    FOR UPDATE USING (
        workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

CREATE POLICY "Users can view inventory in their workspace" ON inventory_levels
    FOR SELECT USING (
        agency_id IN (SELECT id FROM agencies WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Admins can insert inventory" ON inventory_levels
    FOR INSERT WITH CHECK (
        agency_id IN (SELECT id FROM agencies WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
    );

CREATE POLICY "Admins can update inventory" ON inventory_levels
    FOR UPDATE USING (
        agency_id IN (SELECT id FROM agencies WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
    );

-- 8. Update get_next_invoice_number to support agency prefix
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_workspace_id UUID, p_doc_type TEXT, p_agency_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_next_num INTEGER;
  v_prefix TEXT;
  v_agency_prefix TEXT;
  v_result TEXT;
BEGIN
  -- Déterminer le préfixe selon le type
  IF p_doc_type = 'invoice' THEN
    v_prefix := 'FAC';
  ELSIF p_doc_type = 'quote' THEN
    v_prefix := 'DEV';
  ELSE
    v_prefix := 'DOC';
  END IF;

  -- Déterminer le préfixe d'agence s'il y a lieu
  v_agency_prefix := '';
  IF p_agency_id IS NOT NULL THEN
    SELECT prefix INTO v_agency_prefix FROM agencies WHERE id = p_agency_id AND prefix IS NOT NULL AND prefix != '';
    IF v_agency_prefix IS NOT NULL AND v_agency_prefix != '' THEN
      v_prefix := v_agency_prefix || '-' || v_prefix;
    END IF;
  END IF;

  -- Trouver le dernier numéro utilisé pour cette année
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_next_num
  FROM invoices
  WHERE workspace_id = p_workspace_id 
    AND document_type = p_doc_type
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  v_result := v_prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_next_num::TEXT, 4, '0');
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
