CREATE OR REPLACE FUNCTION public.cancel_rental_request(_rental_id uuid, _reason text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF days_until_start < 15 THEN
    RAISE EXCEPTION 'Cancelamento não permitido: faltam menos de 15 dias para o início da locação.';
  END IF;

  IF r.deposit_paid_at IS NOT NULL THEN
    credit_amount := r.deposit_value;
    INSERT INTO public.rental_credits(user_id, rental_request_id, amount, reason)
    VALUES (r.user_id, r.id, credit_amount, COALESCE(_reason,'Cancelamento com 15 dias ou mais de antecedência'));
  END IF;

  UPDATE public.rental_requests
    SET status='cancelled', cancelled_at=now(), cancellation_reason=_reason
    WHERE id=_rental_id;

  RETURN json_build_object('ok',true,'credit_amount',credit_amount);
END;
$function$;