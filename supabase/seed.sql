-- Create a Mock Master User using Supabase auth.users function equivalent or simply insert directly
-- 1. Create User in auth schema (Note: Supabase uses raw GoTrue locally, so we can insert directly into auth.users in dev mode)
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, aud, role,
    confirmation_token, email_change, email_change_token_new, recovery_token,
    created_at, updated_at, last_sign_in_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'admin@zentra.local',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated',
    '', '', '', '',
    now(), now(), now()
) ON CONFLICT DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000000', 'admin@zentra.local')::jsonb,
    'email',
    'admin@zentra.local',
    now(),
    now(),
    now()
) ON CONFLICT DO NOTHING;


-- 2. Create the first test Tenant
INSERT INTO public.tenants (id, name, domain)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Zentra Analytics Corp',
    'zentra.local'
) ON CONFLICT DO NOTHING;

-- 3. Link the user 'admin@zentra.local' to 'Zentra Analytics Corp' as 'owner'
INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'owner'
) ON CONFLICT DO NOTHING;

-- 4. Create some stub action items for the tracker
INSERT INTO public.action_items (tenant_id, title, area, status, priority, due_date)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Configurar dominio local Zentra', 'Infraestructura', 'completed', 'high', current_date - interval '1 day'),
    ('11111111-1111-1111-1111-111111111111', 'Implementar Auth Real de Supabase', 'Seguridad', 'in-progress', 'high', current_date),
    ('11111111-1111-1111-1111-111111111111', 'Revisar métricas de conversión semanales', 'Marketing', 'pending', 'medium', current_date + interval '2 days');

-- 5. Create some stub alerts
INSERT INTO public.alerts (tenant_id, type, severity, title, "desc", action_link)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'stock', 'high', 'Anillo Infinity casi agotado', 'Solo 3 unidades. Se agota en ~1.5 días al ritmo actual.', 'inventory'),
    ('11111111-1111-1111-1111-111111111111', 'campaign', 'medium', 'Campaña Rebajas Flash con ROAS bajo', 'ROAS 1.89 (objetivo: 3.0). Gasto 180€ con bajo retorno.', 'marketing');

-- 6. Create some stub recommendations
INSERT INTO public.recommendations (tenant_id, title, "desc", area, impact, effort, priority)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Reponer 2 productos de alta demanda', 'Anillo Infinity y Collar Plata tienen menos de 10 unidades pero venden 20+ al mes.', 'Operaciones', 'Protección de ingresos', 'Bajo', 'high'),
    ('11111111-1111-1111-1111-111111111111', 'Pausar campañas con ROAS < 2x', 'El ROAS general actual está siendo arrastrado por 2 campañas en Meta Ads.', 'Marketing', 'Reducción de costes', 'Bajo', 'medium');

-- 7. Create stub audit score
INSERT INTO public.audit_scores (tenant_id, overall_score, revenue_score, operations_score, customer_score, marketing_score)
VALUES
    ('11111111-1111-1111-1111-111111111111', 72, 85, 60, 75, 68);

-- 8. Create stub reports
INSERT INTO public.reports (tenant_id, name, type, size, report_date)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Reporte Mensual — Abril 2026', 'mensual', '2.4 MB', current_date),
    ('11111111-1111-1111-1111-111111111111', 'Reporte Semanal — Sem 1', 'semanal', '1.1 MB', current_date - interval '7 days');

