
-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', false);

-- Authenticated users can upload their own recordings
CREATE POLICY "Users can upload recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recordings'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own recordings
CREATE POLICY "Users can read own recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recordings'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recordings'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own recordings
CREATE POLICY "Users can update own recordings"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recordings'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Table to track cloud-synced recordings metadata
CREATE TABLE public.user_recordings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  text text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Custom',
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recordings"
ON public.user_recordings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings"
ON public.user_recordings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings"
ON public.user_recordings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
ON public.user_recordings FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_recordings_updated_at
BEFORE UPDATE ON public.user_recordings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
