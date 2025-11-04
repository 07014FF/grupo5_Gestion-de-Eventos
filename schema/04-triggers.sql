-- ========================================
-- TRIGGERS DEL SISTEMA
-- ========================================
-- Este archivo contiene todos los triggers del sistema

-- ========================================
-- TRIGGERS: updated_at automático
-- ========================================

-- Trigger para users
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TRIGGER update_users_updated_at ON public.users IS 'Actualiza automáticamente updated_at en users';

-- Trigger para events
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TRIGGER update_events_updated_at ON public.events IS 'Actualiza automáticamente updated_at en events';

-- Trigger para purchases
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TRIGGER update_purchases_updated_at ON public.purchases IS 'Actualiza automáticamente updated_at en purchases';

-- Trigger para tickets
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TRIGGER update_tickets_updated_at ON public.tickets IS 'Actualiza automáticamente updated_at en tickets';

-- ========================================
-- TRIGGERS: Control de tickets disponibles
-- ========================================

-- Trigger para decrementar tickets disponibles
DROP TRIGGER IF EXISTS trigger_decrement_tickets ON public.tickets;
CREATE TRIGGER trigger_decrement_tickets
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_available_tickets();

COMMENT ON TRIGGER trigger_decrement_tickets ON public.tickets IS 'Decrementa available_tickets al crear un nuevo ticket';

-- Trigger para incrementar tickets disponibles
DROP TRIGGER IF EXISTS trigger_increment_tickets ON public.tickets;
CREATE TRIGGER trigger_increment_tickets
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_available_tickets();

COMMENT ON TRIGGER trigger_increment_tickets ON public.tickets IS 'Incrementa available_tickets al cancelar un ticket';

-- ========================================
-- TRIGGERS: Control de timestamps de pago
-- ========================================

-- Trigger para actualizar payment_completed_at
DROP TRIGGER IF EXISTS trigger_update_payment_completed_at ON public.purchases;
CREATE TRIGGER trigger_update_payment_completed_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_completed_at();

COMMENT ON TRIGGER trigger_update_payment_completed_at ON public.purchases IS 'Actualiza payment_completed_at cuando el pago se completa';
