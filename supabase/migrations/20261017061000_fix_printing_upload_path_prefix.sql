
BEGIN;

CREATE OR REPLACE FUNCTION public.complete_printing_order_upload(
    p_order_id text,
    p_storage_path text,
    p_original_file_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'storage', 'pg_temp'
AS $function$
DECLARE
    v_uid text := NULLIF(auth.jwt() ->> 'sub', '');
    v_path text := NULLIF(BTRIM(p_storage_path), '');
    v_file_name text := NULLIF(BTRIM(p_original_file_name), '');
    v_order_id text := NULLIF(BTRIM(p_order_id), '');
    v_segments text[];
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'
            USING ERRCODE = '42501';
    END IF;

    IF v_order_id IS NULL
       OR v_path IS NULL
       OR v_file_name IS NULL
       OR LENGTH(v_order_id) > 128
       OR LENGTH(v_path) > 1024
       OR LENGTH(v_file_name) > 255
       OR v_path LIKE '%://%'
       OR LEFT(v_path, 1) = '/'
       OR POSITION('..' IN v_path) > 0
       OR POSITION(CHR(92) IN v_path) > 0
       OR POSITION('/' IN v_file_name) > 0
       OR POSITION(CHR(92) IN v_file_name) > 0
    THEN
        RAISE EXCEPTION 'INVALID_PRINTING_UPLOAD_METADATA';
    END IF;

    v_segments := STRING_TO_ARRAY(v_path, '/');

    /*
     * Current format:
     * printing/FIREBASE_UID/ORDER_ID/FILE_NAME
     *
     * Legacy format:
     * FIREBASE_UID/ORDER_ID/FILE_NAME
     *
     * Both formats require the authenticated UID and exact order ID.
     */
    IF NOT (
        (
            ARRAY_LENGTH(v_segments, 1) = 4
            AND v_segments[1] = 'printing'
            AND v_segments[2] = v_uid
            AND v_segments[3] = v_order_id
            AND v_segments[4] <> ''
        )
        OR
        (
            ARRAY_LENGTH(v_segments, 1) = 3
            AND v_segments[1] = v_uid
            AND v_segments[2] = v_order_id
            AND v_segments[3] <> ''
        )
    ) THEN
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
        updated_at = NOW()
    WHERE id = v_order_id
      AND user_id = v_uid
      AND COALESCE(BTRIM(storage_path), '') = ''
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'PRINTING_ORDER_NOT_FOUND_OR_UPLOAD_ALREADY_FINALIZED'
            USING ERRCODE = '42501';
    END IF;
END;
$function$;

COMMIT;
