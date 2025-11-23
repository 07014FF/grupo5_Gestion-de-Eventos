-- ============================================================================
-- CORRECCIÓN: Función de validación usando la tabla CORRECTA (validations)
-- Reemplaza la función anterior que usaba ticket_validations (tabla incorrecta)
-- ============================================================================

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
  -- ========================================================================
  -- 1. BUSCAR EL TICKET (con verificación explícita)
  -- ========================================================================
  SELECT * INTO v_ticket
  FROM tickets
  WHERE ticket_code = p_ticket_code
    AND event_id = p_event_id;

  -- Si no existe, retornar JSON limpio (evita P0001)
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'status', 'invalid',
      'message', 'Ticket no encontrado en el sistema'
    );
  END IF;

  -- ========================================================================
  -- 2. OBTENER DATOS DE PURCHASE
  -- ========================================================================
  SELECT * INTO v_purchase
  FROM purchases
  WHERE id = v_ticket.purchase_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'status', 'invalid',
      'message', 'Compra asociada al ticket no encontrada'
    );
  END IF;

  -- ========================================================================
  -- 3. VERIFICAR QUE EL PAGO ESTÉ COMPLETADO
  -- ========================================================================
  IF v_purchase.payment_status != 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'status', 'cancelled',
      'message', 'El pago de este ticket no ha sido completado'
    );
  END IF;

  -- ========================================================================
  -- 4. VERIFICAR SI YA FUE VALIDADO
  -- ========================================================================
  IF v_ticket.status = 'used' THEN
    -- Buscar validación anterior en la tabla CORRECTA (validations)
    SELECT v.*, u.email as validator_email INTO v_existing_validation
    FROM validations v
    LEFT JOIN users u ON v.validated_by = u.id
    WHERE v.ticket_id = v_ticket.id
      AND v.validation_result = 'valid'
    ORDER BY v.created_at DESC
    LIMIT 1;

    RETURN json_build_object(
      'success', false,
      'status', 'already_used',
      'message', 'Este ticket ya fue utilizado',
      'validated_at', v_existing_validation.created_at,
      'validated_by', v_existing_validation.validator_email
    );
  END IF;

  -- ========================================================================
  -- 5. OBTENER DATOS DEL EVENTO
  -- ========================================================================
  SELECT * INTO v_event
  FROM events
  WHERE id = v_ticket.event_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'status', 'invalid',
      'message', 'Evento no encontrado'
    );
  END IF;

  -- ========================================================================
  -- 6. REGISTRAR LA VALIDACIÓN (tabla CORRECTA: validations)
  -- ========================================================================
  BEGIN
    -- Insertar en la tabla CORRECTA: public.validations
    INSERT INTO validations (
      ticket_id,
      validated_by,
      validation_result,
      validation_message,
      created_at
    ) VALUES (
      v_ticket.id,              -- ID del ticket (no del purchase)
      p_validator_id,           -- ID del validador
      'valid',                  -- Resultado: valid
      'Ticket válido - Entrada permitida',
      NOW()
    );

    -- Marcar ticket como usado
    UPDATE tickets
    SET status = 'used',
        used_at = NOW(),
        validated_by = p_validator_id,
        updated_at = NOW()
    WHERE id = v_ticket.id;

  EXCEPTION WHEN OTHERS THEN
    -- Si falla, hacer rollback y devolver error detallado
    RETURN json_build_object(
      'success', false,
      'status', 'error',
      'message', 'Error al registrar validación: ' || SQLERRM
    );
  END;

  -- ========================================================================
  -- 7. CONSTRUIR RESULTADO EXITOSO
  -- ========================================================================
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

-- ========================================================================
-- PERMISOS
-- ========================================================================
GRANT EXECUTE ON FUNCTION public.complete_ticket_validation(TEXT, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.complete_ticket_validation IS
  'Validación completa de ticket en un solo paso - usa tabla CORRECTA (validations) - bypasa RLS';
