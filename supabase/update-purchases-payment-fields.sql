-- ============================================================================
-- Update Purchases Table with Payment Fields
-- ============================================================================
-- This migration adds payment-specific fields to track transaction details

-- Add payment tracking columns
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'mock',
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Add index for faster lookups by transaction ID
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id
ON public.purchases(payment_transaction_id);

-- Add index for payment status queries
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status
ON public.purchases(payment_status);

-- Update existing records to have default gateway
UPDATE public.purchases
SET payment_gateway = 'mock'
WHERE payment_gateway IS NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.purchases.payment_gateway IS 'Payment gateway used: mock, wompi, stripe, mercadopago';
COMMENT ON COLUMN public.purchases.payment_transaction_id IS 'Transaction ID from payment gateway';
COMMENT ON COLUMN public.purchases.payment_receipt_url IS 'URL to payment receipt/invoice';
COMMENT ON COLUMN public.purchases.payment_metadata IS 'Additional payment data from gateway';
COMMENT ON COLUMN public.purchases.payment_completed_at IS 'Timestamp when payment was confirmed';

COMMIT;
