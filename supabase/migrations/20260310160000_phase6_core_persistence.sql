-- Fase 6: Persistencia del Core y Settings B2B
-- Esta migración mueve el estado de la UI (Checklists, preferencias) que antes vivía en localStorage
-- a una tabla persistente y aislada en Supabase bajo RLS para cada Tenant.

CREATE TABLE public.tenant_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, setting_key)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad Multi-Tenant
CREATE POLICY "tenant_settings_select"
    ON public.tenant_settings FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "tenant_settings_insert"
    ON public.tenant_settings FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "tenant_settings_update"
    ON public.tenant_settings FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "tenant_settings_delete"
    ON public.tenant_settings FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
