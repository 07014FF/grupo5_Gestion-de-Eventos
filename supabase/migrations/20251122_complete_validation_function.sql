-- Función RPC COMPLETA para validar tickets
-- Hace TODO en un solo paso: busca, valida, marca como usado, registra validación

CREATE OR REPLACE FUNCTION public.complete_ticket_validation(
  p_ticket_code TEXT,
  p_event_id UUID,
  p_validator_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasa RLS
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
  v_purchase RECORD;
  v_event RECORD;
  v_existing_validation RECORD;
  v_result JSON;
BEGIN
  -- 1. Buscar el ticket
  SELECT * INTO v_ticket
  FROM tickets
  WHERE ticket_code = p_ticket_code
    AND event_id = p_event_id;

  -- Si no existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'status', 'invalid',
      'message', 'Ticket no encontrado o código inválido'
    );
  END IF;

  -- 2. Obtener datos de purchase
  SELECT * INTO v_purchase
  FROM purchases
  WHERE id = v_ticket.purchase_id;

  -- 3. Verificar que el pago esté completado
  IF v_purchase.payment_status != 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'status', 'cancelled',
      'message', 'El pago de este ticket no ha sido completado'
    );
  END IF;

  -- 4. Verificar si ya fue validado
  IF v_ticket.status = 'used' THEN
    -- Buscar validación anterior
    SELECT tv.*, u.email as validator_email INTO v_existing_validation
    FROM ticket_validations tv
    LEFT JOIN users u ON tv.validated_by = u.id
    WHERE tv.ticket_id = v_ticket.id
    ORDER BY tv.validated_at DESC
    LIMIT 1;

    RETURN json_build_object(
      'success', false,
      'status', 'already_used',
      'message', 'Este ticket ya fue utilizado',
      'validated_at', v_existing_validation.validated_at,
      'validated_by', v_existing_validation.validator_email
    );
  END IF;

  -- 5. Obtener datos del evento
  SELECT * INTO v_event
  FROM events
  WHERE id = v_ticket.event_id;

  -- 6. REGISTRAR LA VALIDACIÓN (todo en una transacción)
  BEGIN
    -- Insertar validación
    INSERT INTO ticket_validations (ticket_id, event_id, validated_by, validated_at)
    VALUES (v_ticket.id, p_event_id, p_validator_id, NOW());

    -- Marcar ticket como usado
    UPDATE tickets
    SET status = 'used',
        used_at = NOW(),
        validated_by = p_validator_id
    WHERE id = v_ticket.id;

  EXCEPTION WHEN OTHERS THEN
    -- Si falla, hacer rollback y devolver error
    RAISE EXCEPTION 'Error al registrar validación: %', SQLERRM;
  END;

  -- 7. Construir resultado exitoso
  v_result := json_build_object(
    'success', true,
    'status', 'valid',
    'message', 'Ticket válido - Entrada permitida',
    'ticket', json_build_object(
      'id', v_ticket.id,
      'code', v_ticket.ticket_code,
      'eventId', v_ticket.event_id,
      'eventTitle', v_event.title,
      'eventDate', v_event.date,
      'eventLocation', v_event.location,
      'userId', v_purchase.user_id,
      'userName', v_purchase.user_name,
      'userEmail', v_purchase.user_email,
      'ticketType', v_ticket.ticket_type,
      'quantity', v_ticket.quantity,
      'totalAmount', v_purchase.total_amount,
      'purchaseDate', v_purchase.created_at,
      'paymentStatus', v_purchase.payment_status
    )
  );

  RETURN v_result;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.complete_ticket_validation(TEXT, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.complete_ticket_validation IS 'Validación completa de ticket en un solo paso - bypasa RLS';
