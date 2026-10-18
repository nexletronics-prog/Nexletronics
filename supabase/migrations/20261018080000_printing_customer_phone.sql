BEGIN;

-- Optional contact number supplied by the customer on a 3D-printing request.
ALTER TABLE public.printing_orders
  ADD COLUMN IF NOT EXISTS customer_phone text;

-- Preserve existing authenticated order-creation safeguards while persisting
-- the optional phone number submitted in p_order.customer_phone.
CREATE OR REPLACE FUNCTION public.create_printing_order(p_order jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth', 'storage', 'pg_temp'
AS $function$
DECLARE
  v_uid text := nullif(auth.jwt() ->> 'sub', '');
  v_id text;
  v_quantity integer;
  v_estimated_price numeric;
  v_phone text;
  v_finish text;
  v_dimensions jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_order) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'INVALID_PRINTING_ORDER';
  END IF;

  IF nullif(btrim(p_order ->> 'user_id'), '') IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'PRINTING_ORDER_USER_MISMATCH' USING ERRCODE = '42501';
  END IF;

  v_id := nullif(btrim(p_order ->> 'id'), '');
  IF v_id IS NULL OR length(v_id) > 128 THEN
    RAISE EXCEPTION 'INVALID_PRINTING_ORDER_ID';
  END IF;

  IF COALESCE(p_order ->> 'quantity', '') !~ '^[0-9]{1,3}$' THEN
    RAISE EXCEPTION 'INVALID_PRINTING_QUANTITY';
  END IF;
  v_quantity := (p_order ->> 'quantity')::integer;
  IF v_quantity < 1 OR v_quantity > 100 THEN
    RAISE EXCEPTION 'PRINTING_QUANTITY_OUT_OF_RANGE';
  END IF;

  IF COALESCE(p_order ->> 'estimated_price', '') !~ '^[0-9]+(\.[0-9]+)?$' THEN
    RAISE EXCEPTION 'INVALID_PRINTING_ESTIMATE';
  END IF;
  v_estimated_price := (p_order ->> 'estimated_price')::numeric;
  IF v_estimated_price < 0 OR v_estimated_price > 100000000 THEN
    RAISE EXCEPTION 'PRINTING_ESTIMATE_OUT_OF_RANGE';
  END IF;

  v_finish := COALESCE(p_order ->> 'finish', '');
  IF v_finish NOT IN ('rough', 'premium') THEN
    RAISE EXCEPTION 'INVALID_PRINTING_FINISH';
  END IF;

  v_dimensions := p_order -> 'dimensions';
  IF jsonb_typeof(v_dimensions) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'INVALID_PRINTING_DIMENSIONS';
  END IF;

  IF nullif(btrim(p_order ->> 'material'), '') IS NULL
     OR nullif(btrim(p_order ->> 'customer_name'), '') IS NULL
     OR nullif(btrim(p_order ->> 'customer_email'), '') IS NULL
     OR nullif(btrim(p_order ->> 'original_file_name'), '') IS NULL THEN
    RAISE EXCEPTION 'PRINTING_ORDER_REQUIRED_FIELDS_MISSING';
  END IF;

  v_phone := NULLIF(left(btrim(COALESCE(p_order ->> 'customer_phone', '')), 32), '');
  IF v_phone IS NOT NULL AND (
    v_phone !~ '^[+()0-9 .-]{7,32}$'
    OR length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 7
    OR length(regexp_replace(v_phone, '[^0-9]', '', 'g')) > 15
  ) THEN
    RAISE EXCEPTION 'INVALID_CUSTOMER_PHONE';
  END IF;

  INSERT INTO public.printing_orders (
    id,
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    original_file_name,
    storage_path,
    material,
    finish,
    quantity,
    dimensions,
    volume_cm3,
    estimated_weight_grams,
    estimated_print_time_minutes,
    estimate,
    estimated_price,
    final_price,
    status,
    payment_status,
    admin_notes,
    customer_notes,
    created_at,
    updated_at
  ) VALUES (
    v_id,
    v_uid,
    left(btrim(p_order ->> 'customer_name'), 160),
    left(lower(btrim(p_order ->> 'customer_email')), 320),
    v_phone,
    left(btrim(p_order ->> 'original_file_name'), 255),
    '',
    left(btrim(p_order ->> 'material'), 80),
    v_finish,
    v_quantity,
    v_dimensions,
    NULLIF(p_order ->> 'volume_cm3', '')::numeric,
    NULLIF(p_order ->> 'estimated_weight_grams', '')::numeric,
    NULLIF(p_order ->> 'estimated_print_time_minutes', '')::numeric,
    CASE
      WHEN p_order -> 'estimate' IS NULL OR p_order -> 'estimate' = 'null'::jsonb
      THEN NULL
      ELSE p_order -> 'estimate'
    END,
    v_estimated_price,
    NULL,
    'pending',
    'unpaid',
    '',
    left(COALESCE(p_order ->> 'customer_notes', ''), 5000),
    now(),
    now()
  );

  RETURN v_id;
END;
$function$;

COMMIT;
