BEGIN;

-- Identify whether a payment session belongs to a product
-- checkout or a 3D-printing quotation.
ALTER TABLE public.payment_sessions
    ADD COLUMN IF NOT EXISTS payment_type text
        NOT NULL DEFAULT 'product',
    ADD COLUMN IF NOT EXISTS printing_order_id text;

-- Store the Razorpay order that actually paid a printing quote. This makes
-- webhook retries idempotent and distinguishes duplicate captured payments.
ALTER TABLE public.printing_orders
    ADD COLUMN IF NOT EXISTS paid_razorpay_order_id text;

-- Allow only supported payment types.
DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.payment_sessions'::regclass
          AND conname = 'payment_sessions_payment_type_check'
    ) THEN
        ALTER TABLE public.payment_sessions
            ADD CONSTRAINT payment_sessions_payment_type_check
            CHECK (payment_type IN ('product', 'printing'))
            NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.payment_sessions'::regclass
          AND conname = 'payment_sessions_printing_order_consistency_check'
    ) THEN
        ALTER TABLE public.payment_sessions
            ADD CONSTRAINT
                payment_sessions_printing_order_consistency_check
            CHECK (
                (payment_type = 'product'
                    AND printing_order_id IS NULL)
                OR
                (payment_type = 'printing'
                    AND printing_order_id IS NOT NULL)
            )
            NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.payment_sessions'::regclass
          AND conname = 'payment_sessions_printing_order_id_fkey'
    ) THEN
        ALTER TABLE public.payment_sessions
            ADD CONSTRAINT payment_sessions_printing_order_id_fkey
            FOREIGN KEY (printing_order_id)
            REFERENCES public.printing_orders(id)
            ON DELETE RESTRICT
            NOT VALID;
    END IF;
END;
$migration$;

-- Validate constraints after they have been created.
ALTER TABLE public.payment_sessions
    VALIDATE CONSTRAINT payment_sessions_payment_type_check;

ALTER TABLE public.payment_sessions
    VALIDATE CONSTRAINT
        payment_sessions_printing_order_consistency_check;

ALTER TABLE public.payment_sessions
    VALIDATE CONSTRAINT payment_sessions_printing_order_id_fkey;

-- Find payment sessions belonging to a printing request efficiently.
CREATE INDEX IF NOT EXISTS
    payment_sessions_printing_order_id_idx
ON public.payment_sessions (printing_order_id)
WHERE printing_order_id IS NOT NULL;

-- One Razorpay order may settle at most one printing quote.
CREATE UNIQUE INDEX IF NOT EXISTS
    printing_orders_paid_razorpay_order_id_uidx
ON public.printing_orders (paid_razorpay_order_id)
WHERE paid_razorpay_order_id IS NOT NULL;

COMMIT;
