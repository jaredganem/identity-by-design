
-- Add last_name column to leads (optional)
ALTER TABLE public.leads ADD COLUMN last_name text;

-- Create page_views table for analytics
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  page text NOT NULL DEFAULT '/',
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (tracking is public)
CREATE POLICY "Anyone can log a page view"
  ON public.page_views
  FOR INSERT
  WITH CHECK (true);

-- No select/update/delete for anon users
-- Only readable via direct DB queries (admin)
