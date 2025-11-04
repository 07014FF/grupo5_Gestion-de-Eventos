-- ========================================
-- ÍNDICES DE OPTIMIZACIÓN
-- ========================================
-- Este archivo contiene todos los índices personalizados para optimizar consultas

-- ========================================
-- ÍNDICES: users
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

COMMENT ON INDEX idx_users_email IS 'Índice para búsquedas rápidas por email';
COMMENT ON INDEX idx_users_role IS 'Índice para filtrar usuarios por rol';

-- ========================================
-- ÍNDICES: events
-- ========================================
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_student_price ON public.events(student_price);
CREATE INDEX IF NOT EXISTS idx_events_general_price ON public.events(general_price);

COMMENT ON INDEX idx_events_date IS 'Índice para búsquedas y ordenamiento por fecha';
COMMENT ON INDEX idx_events_status IS 'Índice para filtrar eventos por estado';
COMMENT ON INDEX idx_events_category IS 'Índice para filtrar eventos por categoría';
COMMENT ON INDEX idx_events_created_by IS 'Índice para consultas de eventos creados por usuario';

-- ========================================
-- ÍNDICES: purchases
-- ========================================
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_event_id ON public.purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON public.purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON public.purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_gateway ON public.purchases(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_transaction_id ON public.purchases(payment_transaction_id) WHERE payment_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_payment_completed_at ON public.purchases(payment_completed_at DESC) WHERE payment_completed_at IS NOT NULL;

COMMENT ON INDEX idx_purchases_user_id IS 'Índice para consultas de compras por usuario';
COMMENT ON INDEX idx_purchases_event_id IS 'Índice para consultas de compras por evento';
COMMENT ON INDEX idx_purchases_payment_status IS 'Índice para filtrar compras por estado de pago';
COMMENT ON INDEX idx_purchases_transaction_id IS 'Índice para búsquedas por ID de transacción';
COMMENT ON INDEX idx_purchases_created_at IS 'Índice para ordenamiento por fecha de creación descendente';
COMMENT ON INDEX idx_purchases_payment_gateway IS 'Índice para filtrar por pasarela de pago';
COMMENT ON INDEX idx_purchases_payment_transaction_id IS 'Índice parcial para transacciones con ID de pago';
COMMENT ON INDEX idx_purchases_payment_completed_at IS 'Índice parcial para pagos completados';

-- ========================================
-- ÍNDICES: tickets
-- ========================================
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_purchase_id ON public.tickets(purchase_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets(ticket_code);

COMMENT ON INDEX idx_tickets_user_id IS 'Índice para consultas de tickets por usuario';
COMMENT ON INDEX idx_tickets_event_id IS 'Índice para consultas de tickets por evento';
COMMENT ON INDEX idx_tickets_purchase_id IS 'Índice para consultas de tickets por compra';
COMMENT ON INDEX idx_tickets_status IS 'Índice para filtrar tickets por estado';
COMMENT ON INDEX idx_tickets_ticket_code IS 'Índice para búsquedas rápidas por código de ticket';

-- ========================================
-- ÍNDICES: validations
-- ========================================
CREATE INDEX IF NOT EXISTS idx_validations_ticket_id ON public.validations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_validations_validated_by ON public.validations(validated_by);
CREATE INDEX IF NOT EXISTS idx_validations_created_at ON public.validations(created_at DESC);

COMMENT ON INDEX idx_validations_ticket_id IS 'Índice para consultas de validaciones por ticket';
COMMENT ON INDEX idx_validations_validated_by IS 'Índice para consultas de validaciones por validador';
COMMENT ON INDEX idx_validations_created_at IS 'Índice para ordenamiento por fecha de validación descendente';
