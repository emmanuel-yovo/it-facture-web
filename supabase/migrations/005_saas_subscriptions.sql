-- Add subscription tracking to workspaces table
ALTER TABLE workspaces 
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_interval TEXT, -- 'monthly' or 'yearly'
ADD COLUMN subscription_status TEXT DEFAULT 'active'; -- 'active', 'canceled', 'past_due'
