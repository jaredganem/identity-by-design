-- Add admin-only SELECT policy on leads table to prevent unauthorized data access
CREATE POLICY "Admins can read leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));