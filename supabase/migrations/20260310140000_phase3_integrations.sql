-- Fase 3: Integraciones y Normalización de Señales
-- Estas tablas funcionarán como el almacén asíncrono para mantener la experiencia de Zentra Control ligera.

-- 1. Tabla de Integraciones (Credenciales de conexión por Tenant)
CREATE TABLE public.tenant_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('shopify', 'meta', 'ga4')),
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store API Keys, Access Tokens or Shop URLs
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'syncing')),
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, provider)
);

-- Habilitar RLS en integraciones (altamente sensible)
ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_integrations_select"
    ON public.tenant_integrations FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "tenant_integrations_insert"
    ON public.tenant_integrations FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "tenant_integrations_update"
    ON public.tenant_integrations FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND role = 'admin'));


-- 2. Tabla de Señales Diarias Normalizadas (Business Daily Metrics)
-- Aquí agregamos las métricas fusionadas de Shopify, Meta y GA4 para el Overview y Reportes rápidos.
CREATE TABLE public.business_daily_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Señales de Shopify
    gross_sales NUMERIC DEFAULT 0,
    net_sales NUMERIC DEFAULT 0,
    orders_count INT DEFAULT 0,
    total_returns INT DEFAULT 0,
    refunds_amount NUMERIC DEFAULT 0,
    
    -- Señales de Meta/GA4
    ad_spend NUMERIC DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    sessions INT DEFAULT 0,
    conversions INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, metric_date)
);

ALTER TABLE public.business_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics_select"
    ON public.business_daily_metrics FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));


-- 3. Cache de Productos de Shopify (para el listado de Top Products y Ventas/Devoluciones)
CREATE TABLE public.shopify_products_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL, -- ID original de Shopify
    title TEXT NOT NULL,
    type TEXT,
    price NUMERIC DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    stock INT DEFAULT 0,
    image_url TEXT,
    
    -- Métricas móviles (calculadas diariamente o de los últimos 30 días)
    sales_30d INT DEFAULT 0,
    views_30d INT DEFAULT 0,
    returns_30d INT DEFAULT 0,
    
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, product_id)
);

ALTER TABLE public.shopify_products_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_cache_select"
    ON public.shopify_products_cache FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));


-- 4. Cache de Campañas de Marketing (Meta Ads / GA4)
CREATE TABLE public.active_campaigns_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL, -- ID nativo en Meta/GA4
    name TEXT NOT NULL,
    platform TEXT NOT NULL, -- Ej: Meta Ads, Google Ads
    status TEXT NOT NULL,
    
    -- Señales de rendimiento móvil
    spend NUMERIC DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    roas NUMERIC DEFAULT 0,
    cpa NUMERIC DEFAULT 0,
    
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, campaign_id)
);

ALTER TABLE public.active_campaigns_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_cache_select"
    ON public.active_campaigns_cache FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
