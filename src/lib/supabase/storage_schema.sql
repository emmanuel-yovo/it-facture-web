-- SQL pour créer les buckets de stockage sur Supabase

-- Bucket public pour les logos d'entreprise
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket privé pour les PDF (factures, devis)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket privé pour les sauvegardes / exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Configuration RLS (Row Level Security) pour le bucket 'logos'
CREATE POLICY "Public Access to Logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'logos' );

CREATE POLICY "Authenticated users can update their logos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'logos' );

-- Configuration RLS pour le bucket 'invoices'
CREATE POLICY "Authenticated users can manage their invoices"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'invoices' );

-- Configuration RLS pour le bucket 'backups'
CREATE POLICY "Authenticated users can manage their backups"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'backups' );
