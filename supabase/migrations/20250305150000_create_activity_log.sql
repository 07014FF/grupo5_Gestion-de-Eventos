-- =====================================================
-- Tabla de Registro de Actividad (Activity Log)
-- =====================================================
-- Registra todas las acciones importantes del sistema
-- como cambios de roles, pagos, validaciones, etc.

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario que realizó la acción
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),

  -- Detalles de la acción
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,

  -- Descripción y metadatos
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- IP y contexto
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Comentarios
COMMENT ON TABLE public.activity_log IS 'Registro de todas las acciones importantes del sistema para auditoría';
COMMENT ON COLUMN public.activity_log.action IS 'Tipo de acción realizada (role_change, payment_completed, etc.)';
COMMENT ON COLUMN public.activity_log.metadata IS 'Información adicional en formato JSON';

-- Políticas RLS (Row Level Security)
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Los usuarios autenticados pueden ver sus propios logs
CREATE POLICY "Users can view their own activity logs"
  ON public.activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Solo admins y super_admins pueden ver todos los logs
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Todos los usuarios autenticados pueden insertar logs (para tracking)
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
