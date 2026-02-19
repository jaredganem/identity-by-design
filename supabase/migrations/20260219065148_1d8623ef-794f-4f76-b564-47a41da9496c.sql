CREATE POLICY "Admins can read page views"
ON public.page_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));