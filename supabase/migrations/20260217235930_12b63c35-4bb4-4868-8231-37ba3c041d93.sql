CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  page TEXT DEFAULT '/',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read events" ON public.events FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_events_session ON public.events (session_id);
CREATE INDEX idx_events_event ON public.events (event);
CREATE INDEX idx_events_created ON public.events (created_at);