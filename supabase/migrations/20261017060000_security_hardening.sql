BEGIN;

-- 1. Remove unnecessary privileges from authenticated cart users.
REVOKE TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.carts
FROM authenticated;


-- 2. Set a controlled search path for stock reservation.
ALTER FUNCTION public.reserve_payment_stock(text)
SET search_path = pg_catalog, public, pg_temp;


-- 3. Enforce ownership when finalizing customer STL uploads.
CREATE OR REPLACE FUNCTION public.complete_printing_order_upload(
    p_order_id text,
    p_storage_path text,
    p_original_file_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public, auth, storage, pg_temp
AS $function$
DECLARE
    v_uid text := nullif(auth.jwt() ->> 'sub', '');
    v_path text := nullif(btrim(p_storage_path), '');
    v_file_name text := nullif(btrim(p_original_file_name), '');
    v_order_id text := nullif(btrim(p_order_id), '');
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'
            USING ERRCODE = '42501';
    END IF;

    IF v_order_id IS NULL
       OR v_path IS NULL
       OR v_file_name IS NULL
       OR length(v_order_id) > 128
       OR length(v_path) > 1024
       OR length(v_file_name) > 255
       OR v_path LIKE '%://%'
       OR left(v_path, 1) = '/'
       OR position('..' in v_path) > 0
       OR position(chr(92) in v_path) > 0
       OR position('/' in v_file_name) > 0
       OR position(chr(92) in v_file_name) > 0
    THEN
        RAISE EXCEPTION 'INVALID_PRINTING_UPLOAD_METADATA';
    END IF;

    -- Required path: FIREBASE_UID/PRINTING_ORDER_ID/FILE_NAME
    IF split_part(v_path, '/', 1) IS DISTINCT FROM v_uid
       OR split_part(v_path, '/', 2) IS DISTINCT FROM v_order_id
    THEN
        RAISE EXCEPTION 'PRINTING_UPLOAD_PATH_OWNERSHIP_MISMATCH'
            USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM storage.objects AS o
        WHERE o.bucket_id = '3d-print-files'
          AND o.name = v_path
    ) THEN
        RAISE EXCEPTION 'PRINTING_FILE_NOT_FOUND_IN_PRIVATE_STORAGE';
    END IF;

    UPDATE public.printing_orders
    SET
        storage_path = v_path,
        original_file_name = v_file_name,
        updated_at = now()
    WHERE id = v_order_id
      AND user_id = v_uid
      AND COALESCE(btrim(storage_path), '') = ''
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'PRINTING_ORDER_NOT_FOUND_OR_UPLOAD_ALREADY_FINALIZED'
            USING ERRCODE = '42501';
    END IF;
END;
$function$;


-- 4. Add product stock and price integrity constraints if missing.
DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.products'::regclass
          AND conname = 'products_stock_nonnegative_check'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_stock_nonnegative_check
        CHECK (stock IS NOT NULL AND stock >= 0)
        NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.products'::regclass
          AND conname = 'products_price_nonnegative_check'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_price_nonnegative_check
        CHECK (price IS NOT NULL AND price >= 0)
        NOT VALID;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.products'::regclass
          AND conname = 'products_stock_nonnegative_check'
          AND NOT convalidated
    ) THEN
        ALTER TABLE public.products
        VALIDATE CONSTRAINT products_stock_nonnegative_check;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.products'::regclass
          AND conname = 'products_price_nonnegative_check'
          AND NOT convalidated
    ) THEN
        ALTER TABLE public.products
        VALIDATE CONSTRAINT products_price_nonnegative_check;
    END IF;
END;
$migration$;


-- 5. Prevent duplicate non-empty product slugs.
CREATE UNIQUE INDEX IF NOT EXISTS
    products_slug_normalized_unique_idx
ON public.products (lower(btrim(slug)))
WHERE slug IS NOT NULL
  AND btrim(slug) <> '';


-- 6. Protect historical order items from orphaned product references.
DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.order_items'::regclass
          AND conname = 'order_items_product_id_fkey'
    ) THEN
        ALTER TABLE public.order_items
        ADD CONSTRAINT order_items_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES public.products (id)
        ON DELETE RESTRICT
        NOT VALID;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.order_items'::regclass
          AND conname = 'order_items_product_id_fkey'
          AND NOT convalidated
    ) THEN
        ALTER TABLE public.order_items
        VALIDATE CONSTRAINT order_items_product_id_fkey;
    END IF;
END;
$migration$;

COMMIT;