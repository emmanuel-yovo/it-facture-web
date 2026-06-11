-- Migration pour le suivi de la dernière activité
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;
