
-- 1. Add new columns to rental_requests
ALTER TABLE public.rental_requests
  ADD COLUMN IF NOT EXISTS deposit_value numeric(10,2),
  ADD COLUMN IF NOT EXISTS balance_value numeric(10,2),
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS balance_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS credit_applied numeric(10,2) NOT NULL DEFAULT 0;

-- Expand status check via trigger (no constraint exists; use trigger validation)
CREATE OR REPLACE FUNCTION public.validate_rental_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','reserved','awaiting_payment','confirmed','cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rental_requests_validate_status ON public.rental_requests;
CREATE TRIGGER rental_requests_validate_status BEFORE INSERT OR UPDATE ON public.rental_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_rental_status();

-- Auto-calculate deposit/balance on insert
CREATE OR REPLACE FUNCTION public.calculate_rental_amounts()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.deposit_value IS NULL THEN
    NEW.deposit_value := ROUND(NEW.total_value * 0.30, 2);
  END IF;
  IF NEW.balance_value IS NULL THEN
    NEW.balance_value := ROUND(NEW.total_value - NEW.deposit_value, 2);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rental_requests_calc_amounts ON public.rental_requests;
CREATE TRIGGER rental_requests_calc_amounts BEFORE INSERT ON public.rental_requests
  FOR EACH ROW EXECUTE FUNCTION public.calculate_rental_amounts();

-- 2. rental_credits table
CREATE TABLE IF NOT EXISTS public.rental_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rental_request_id uuid REFERENCES public.rental_requests(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  used_in_rental_id uuid REFERENCES public.rental_requests(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_credits TO authenticated;
GRANT ALL ON public.rental_credits TO service_role;
ALTER TABLE public.rental_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own credits" ON public.rental_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage credits" ON public.rental_credits FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- 3. Views
CREATE OR REPLACE VIEW public.rental_requests_effective AS
SELECT r.*,
  CASE r.status
    WHEN 'pending' THEN 'Pendente'
    WHEN 'reserved' THEN 'Reservado'
    WHEN 'awaiting_payment' THEN 'Aguardando Pagamento'
    WHEN 'confirmed' THEN 'Confirmado'
    WHEN 'cancelled' THEN 'Cancelado'
  END AS status_label,
  (r.total_value - COALESCE(r.credit_applied,0)) AS effective_total
FROM public.rental_requests r;

GRANT SELECT ON public.rental_requests_effective TO authenticated;

CREATE OR REPLACE VIEW public.user_credit_balance AS
SELECT user_id,
  COALESCE(SUM(CASE WHEN used_at IS NULL THEN amount ELSE 0 END),0) AS available_balance,
  COALESCE(SUM(amount),0) AS total_balance
FROM public.rental_credits
GROUP BY user_id;

GRANT SELECT ON public.user_credit_balance TO authenticated;

-- 4. cancel_rental_request RPC
CREATE OR REPLACE FUNCTION public.cancel_rental_request(_rental_id uuid, _reason text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  credit_amount numeric(10,2) := 0;
  days_until_start integer;
BEGIN
  SELECT * INTO r FROM public.rental_requests WHERE id = _rental_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rental not found'; END IF;
  IF r.user_id <> auth.uid() AND NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF r.status = 'cancelled' THEN RAISE EXCEPTION 'Already cancelled'; END IF;

  days_until_start := (r.start_date - CURRENT_DATE);

  -- Credit rule: if cancelled >7 days before start and deposit was paid, credit the deposit
  IF r.deposit_paid_at IS NOT NULL AND days_until_start > 7 THEN
    credit_amount := r.deposit_value;
    INSERT INTO public.rental_credits(user_id, rental_request_id, amount, reason)
    VALUES (r.user_id, r.id, credit_amount, COALESCE(_reason,'Cancelamento com mais de 7 dias'));
  END IF;

  UPDATE public.rental_requests
    SET status='cancelled', cancelled_at=now(), cancellation_reason=_reason
    WHERE id=_rental_id;

  RETURN json_build_object('ok',true,'credit_amount',credit_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_rental_request(uuid,text) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_rental_request(uuid,text) TO authenticated;

-- 5. get_admin_kpis RPC
CREATE OR REPLACE FUNCTION public.get_admin_kpis()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT json_build_object(
    'faturamento_realizado', COALESCE(SUM(CASE WHEN status='confirmed' THEN total_value END),0),
    'locacoes_realizadas_valor', COALESCE(SUM(CASE WHEN status='confirmed' AND end_date < CURRENT_DATE THEN total_value END),0),
    'reservas_realizadas_valor', COALESCE(SUM(CASE WHEN status IN ('reserved','awaiting_payment','confirmed') AND start_date >= CURRENT_DATE THEN total_value END),0),
    'qtd_realizada_total', COUNT(*) FILTER (WHERE status='confirmed'),
    'qtd_locacoes_realizadas', COUNT(*) FILTER (WHERE status='confirmed' AND end_date < CURRENT_DATE),
    'qtd_reservas_realizadas', COUNT(*) FILTER (WHERE status IN ('reserved','awaiting_payment','confirmed') AND start_date >= CURRENT_DATE),
    'total_cancelado', COALESCE(SUM(CASE WHEN status='cancelled' THEN total_value END),0),
    'qtd_cancelado', COUNT(*) FILTER (WHERE status='cancelled')
  ) INTO result FROM public.rental_requests;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_admin_kpis() FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_kpis() TO authenticated;

-- 6. admin_monthly_stats view
CREATE OR REPLACE VIEW public.admin_monthly_stats AS
SELECT
  to_char(date_trunc('month', start_date),'YYYY-MM') AS month,
  COALESCE(SUM(CASE WHEN status='confirmed' THEN total_value END),0) AS faturamento_realizado,
  COALESCE(SUM(CASE WHEN status='confirmed' AND end_date < CURRENT_DATE THEN total_value END),0) AS locacoes_realizadas_valor,
  COALESCE(SUM(CASE WHEN status IN ('reserved','awaiting_payment','confirmed') AND start_date >= CURRENT_DATE THEN total_value END),0) AS reservas_realizadas_valor,
  COUNT(*) FILTER (WHERE status='confirmed') AS qtd_realizada_total,
  COUNT(*) FILTER (WHERE status='confirmed' AND end_date < CURRENT_DATE) AS qtd_locacoes_realizadas,
  COUNT(*) FILTER (WHERE status IN ('reserved','awaiting_payment','confirmed') AND start_date >= CURRENT_DATE) AS qtd_reservas_realizadas
FROM public.rental_requests
GROUP BY 1
ORDER BY 1;

GRANT SELECT ON public.admin_monthly_stats TO authenticated;

-- 7. profile_events trigger from rental_requests
CREATE OR REPLACE FUNCTION public.sync_profile_event_from_rental()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prod_name text;
BEGIN
  SELECT name INTO prod_name FROM public.products WHERE id = NEW.product_id;
  IF TG_OP = 'INSERT' OR (TG_OP='UPDATE' AND OLD.status <> NEW.status) THEN
    IF NEW.status IN ('reserved','awaiting_payment','confirmed') THEN
      INSERT INTO public.profile_events (user_id, title, event_date, category, product_id)
      VALUES (NEW.user_id, COALESCE(prod_name,'Locação') || ' — ' || NEW.status, NEW.start_date, 'locacao', NEW.product_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rental_requests_sync_event ON public.rental_requests;
CREATE TRIGGER rental_requests_sync_event AFTER INSERT OR UPDATE ON public.rental_requests
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_event_from_rental();
