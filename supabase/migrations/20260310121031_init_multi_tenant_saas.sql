-- 1. Crear tabla recommendations
CREATE TABLE public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    "desc" TEXT,
    area TEXT,
    impact TEXT,
    effort TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla alerts
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
    title TEXT NOT NULL,
    "desc" TEXT,
    action_link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('semanal', 'mensual', 'anual')) DEFAULT 'mensual',
    status TEXT DEFAULT 'listo',
    size TEXT,
    report_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Crear tabla audit_scores
CREATE TABLE public.audit_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    overall_score INTEGER NOT NULL,
    revenue_score INTEGER NOT NULL,
    operations_score INTEGER NOT NULL,
    customer_score INTEGER NOT NULL,
    marketing_score INTEGER NOT NULL,
    score_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Activar Seguridad RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_scores ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Aislamiento (Multi-Tenant)
CREATE POLICY "Users can fully manage their tenant recommendations" ON public.recommendations
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can fully manage their tenant alerts" ON public.alerts
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can fully manage their tenant reports" ON public.reports
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can fully manage their tenant audit scores" ON public.audit_scores
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
