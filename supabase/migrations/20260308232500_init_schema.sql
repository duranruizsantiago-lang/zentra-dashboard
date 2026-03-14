-- 1. Crear la tabla de Empresas (Tenants)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear la tabla que relaciona Usuarios con sus Empresas
CREATE TABLE public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'viewer')) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, user_id)
);

-- 3. Crear la tabla del Action Tracker (Core actual)
CREATE TABLE public.action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    area TEXT DEFAULT 'General',
    status TEXT CHECK (status IN ('pending', 'in-progress', 'completed')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ACTIVAR LA SEGURIDAD (Row Level Security)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- 5. Crear las Políticas (Nadie puede espiar datos de otra empresa)
-- Políticas para tenant_users (el usuario solo puede ver si pertenece al tenant)
CREATE POLICY "Users view own tenant association" ON public.tenant_users
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para tenants
CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid())
    );

-- Políticas para action_items (Aislamiento Total del Tracker)
CREATE POLICY "Users can fully manage their tenant action items" ON public.action_items
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid())
    );
