import { supabase } from './supabaseClient';
import { logError } from './analyticsService';


export async function getTenantIntegrations(tenantId) {
    if (!tenantId) return [];
    try {
        const { data, error } = await supabase
            .from('tenant_integrations')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching integrations:", err);
        return [];
    }
}

// Required credential fields per provider
const REQUIRED_CREDENTIALS = {
    shopify: ['store_domain', 'access_token'],
    meta: ['ad_account_id', 'access_token'],
    ga4: ['property_id', 'credentials_json'],
};

/**
 * Saves an integration and optionally triggers sync.
 * Returns: { success: boolean, data?: object, error?: string, phase?: string }
 * Phases: 'credential_validation' | 'persistence' | 'edge_function' | 'sync_error'
 */
export async function saveIntegration(tenantId, provider, credentials) {
    if (!tenantId) return { success: false, error: 'Tenant no identificado.', phase: 'credential_validation' };

    // Phase 1: Validate credentials structure
    const requiredFields = REQUIRED_CREDENTIALS[provider] || [];
    const missingFields = requiredFields.filter(f => !credentials || !credentials[f]);
    if (missingFields.length > 0) {
        const msg = `Credenciales incompletas para ${provider}: faltan ${missingFields.join(', ')}`;
        console.warn(`[Integrations] ${msg}`);
        logError('IntegrationsService: credential_validation', msg, { tenantId, provider, missingFields });
        return { success: false, error: msg, phase: 'credential_validation' };
    }

    // Phase 2: Persist to DB
    let savedData;
    try {
        const { data, error } = await supabase
            .from('tenant_integrations')
            .upsert({
                tenant_id: tenantId,
                provider,
                credentials,
                status: 'syncing',
                error_message: null,
                last_sync_at: new Date().toISOString()
            }, { onConflict: 'tenant_id,provider' })
            .select()
            .single();

        if (error) throw error;
        savedData = data;
    } catch (err) {
        const msg = `Error al guardar la integración en base de datos: ${err.message}`;
        console.error(`[Integrations] Phase:persistence — ${msg}`);
        logError('IntegrationsService: persistence', err.message, { tenantId, provider });
        return { success: false, error: msg, phase: 'persistence' };
    }

    // Phase 3: Trigger sync via Edge Function
    try {
        if (provider === 'shopify') {
            await syncShopifyExternal(tenantId);
        } else if (provider === 'meta') {
            await syncMetaExternal(tenantId);
        } else if (provider === 'ga4') {
            await syncGA4External(tenantId);
        }
        // Mark as active after successful sync
        await supabase.from('tenant_integrations').update({ status: 'active', error_message: null }).match({ tenant_id: tenantId, provider });
        return { success: true, data: savedData };
    } catch (err) {
        const isEdgeFunctionMissing = err.message?.includes('404') || err.message?.includes('FunctionsHttpError') || err.message?.includes('Edge Function');
        const phase = isEdgeFunctionMissing ? 'edge_function' : 'sync_error';
        const userMsg = isEdgeFunctionMissing
            ? `La función de sincronización de ${provider} no está disponible en este entorno. La integración quedó guardada y se sincronizará cuando el servicio esté activo.`
            : `Error durante la sincronización con ${provider}: ${err.message}`;

        console.error(`[Integrations] Phase:${phase} — ${err.message}`);
        logError(`IntegrationsService: ${phase}`, err.message, { tenantId, provider });

        // Still mark as saved but with warning status
        await supabase.from('tenant_integrations').update({
            status: isEdgeFunctionMissing ? 'pending' : 'error',
            error_message: err.message
        }).match({ tenant_id: tenantId, provider }).catch(() => {});

        // If Edge Function is missing, it's a soft success (credentials saved, sync deferred)
        if (isEdgeFunctionMissing) {
            return { success: true, data: savedData, error: userMsg, phase };
        }
        return { success: false, error: userMsg, phase };
    }
}

export async function disconnectIntegration(tenantId, provider) {
    if (!tenantId) return false;
    try {
        const { error } = await supabase
            .from('tenant_integrations')
            .delete()
            .match({ tenant_id: tenantId, provider });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error disconnecting integration:", err);
        logError('IntegrationsService: disconnect', err.message, { tenantId, provider });
        return false;
    }
}

// =========================================================================
// =========================================================================
// Sincronización Real (Edge Functions) y Simulada
// =========================================================================

async function syncShopifyExternal(tenantId) {
    console.log(`[Integrations] Ejecutando Shopify Sync Real vía Edge Function para tenant ${tenantId}...`);
    try {
        const { data, error } = await supabase.functions.invoke('shopify-sync', {
            body: { tenant_id: tenantId }
        });

        if (error) throw error;
        console.log("[Integrations] Shopify Edge Function finalizó con éxito:", data);
        return true;
    } catch (err) {
        console.error("[Integrations] Shopify Edge Function falló:", err);
        logError('Shopify Sync', err.message, { tenantId });
        await supabase.from('tenant_integrations').update({ status: 'error', error_message: err.message }).match({ tenant_id: tenantId, provider: 'shopify' });
        throw err;
    }
}

async function syncMetaExternal(tenantId) {
    console.log(`[Integrations] Ejecutando Meta Ads Sync Real vía Edge Function para tenant ${tenantId}...`);
    try {
        const { data, error } = await supabase.functions.invoke('meta-ads-sync', {
            body: { tenant_id: tenantId }
        });

        if (error) throw error;
        console.log("[Integrations] Meta Ads Edge Function finalizó con éxito:", data);
        return true;
    } catch (err) {
        console.error("[Integrations] Meta Ads Edge Function falló:", err);
        logError('Meta Sync', err.message, { tenantId });
        await supabase.from('tenant_integrations').update({ status: 'error', error_message: err.message }).match({ tenant_id: tenantId, provider: 'meta' });
        throw err;
    }
}

async function syncGA4External(tenantId) {
    console.log(`[Integrations] Ejecutando GA4 Sync Real vía Edge Function para tenant ${tenantId}...`);
    try {
        const { data, error } = await supabase.functions.invoke('ga4-sync', {
            body: { tenant_id: tenantId }
        });

        if (error) throw error;
        console.log("[Integrations] GA4 Edge Function finalizó con éxito:", data);
        return true;
    } catch (err) {
        console.error("[Integrations] GA4 Edge Function falló:", err);
        logError('GA4 Sync', err.message, { tenantId });
        await supabase.from('tenant_integrations').update({ status: 'error', error_message: err.message }).match({ tenant_id: tenantId, provider: 'ga4' });
        throw err;
    }
}
