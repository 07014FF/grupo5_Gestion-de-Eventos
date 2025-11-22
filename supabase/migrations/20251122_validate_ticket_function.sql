-- Función RPC para validar tickets (bypasa RLS)
-- Esto permite a los validadores ver cualquier ticket

CREATE OR REPLACE FUNCTION public.validate_ticket_by_code(
  p_ticket_code TEXT,
  p_event_id UUID,
  p_validator_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos de owner, bypasa RLS
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
  v_purchase RECORD;
  v_event RECORD;
  v_result JSON;
BEGIN
  -- Buscar el ticket
  SELECT * INTO v_ticket
  FROM tickets
  WHERE ticket_code = p_ticket_code
    AND event_id = p_event_id;

  -- Si no existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'found', false,
      'message', 'Ticket no encontrado'
    );
  END IF;

  -- Obtener datos de purchase
  SELECT * INTO v_purchase
  FROM purchases
  WHERE id = v_ticket.purchase_id;

  -- Obtener datos de evento
  SELECT * INTO v_event
  FROM events
  WHERE id = v_ticket.event_id;

  -- Construir resultado
  v_result := json_build_object(
    'found', true,
    'ticket', json_build_object(
      'id', v_ticket.id,
      'ticket_code', v_ticket.ticket_code,
      'event_id', v_ticket.event_id,
      'user_id', v_ticket.user_id,
      'status', v_ticket.status,
      'ticket_type', v_ticket.ticket_type,
      'price', v_ticket.price,
      'quantity', v_ticket.quantity,
      'qr_code_data', v_ticket.qr_code_data,
      'created_at', v_ticket.created_at,
      'used_at', v_ticket.used_at,
      'validated_by', v_ticket.validated_by
    ),
    'purchase', json_build_object(
      'id', v_purchase.id,
      'user_id', v_purchase.user_id,
      'user_name', v_purchase.user_name,
      'user_email', v_purchase.user_email,
      'payment_status', v_purchase.payment_status,
      'total_amount', v_purchase.total_amount,
      'created_at', v_purchase.created_at
    ),
    'event', json_build_object(
      'id', v_event.id,
      'title', v_event.title,
      'date', v_event.date,
      'location', v_event.location
    )
  );

  RETURN v_result;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.validate_ticket_by_code(TEXT, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.validate_ticket_by_code IS 'Valida un ticket por código, bypaseando RLS para validadores';
