CREATE TABLE public.rental_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text,
  payment_terms text,
  period_days integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_value numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_requests TO authenticated;
GRANT ALL ON public.rental_requests TO service_role;

ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rental requests"
  ON public.rental_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own rental requests"
  ON public.rental_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin updates rental requests"
  ON public.rental_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin deletes rental requests"
  ON public.rental_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER rental_requests_updated_at
  BEFORE UPDATE ON public.rental_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX rental_requests_product_dates_idx ON public.rental_requests(product_id, start_date, end_date) WHERE status = 'confirmed';
CREATE INDEX rental_requests_status_idx ON public.rental_requests(status);