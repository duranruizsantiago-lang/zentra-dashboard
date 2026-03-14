-- Fase 7: Telemetría Técnica y de Negocio (Observabilidad)
-- Almacén estandarizado para logs técnicos de pilot adopters y telemetría de errores asíncronos.

CREATE TABLE IF NOT EXISTS public.pilot_events_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_uid TEXT NOT NULL,
    event_name TEXT NOT NULL,
    url TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos de Inserción Abiertos (para la UI no autenticada en ciertos flujos crudos, pero preferible con RLS)
ALTER TABLE public.pilot_events_log ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar su propio log (Telemetría UI frontend)
CREATE POLICY "events_log_insert"
    ON public.pilot_events_log FOR INSERT
    WITH CHECK (true);

-- Solo los Super Admins o roles de sistema pueden leer logs técnicos
CREATE POLICY "events_log_select"
    ON public.pilot_events_log FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.tenant_users WHERE role = 'system_admin'
    ));
