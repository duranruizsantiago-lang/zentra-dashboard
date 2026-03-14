import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tenant_id } = await req.json();
    if (!tenant_id) throw new Error("tenant_id is required");

    // 1. Fetch credentials from DB securely (Requires Ad Account ID + Access Token)
    const { data: integration, error: intError } = await supabaseClient
      .from('tenant_integrations')
      .select('credentials')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'meta')
      .single();

    if (intError || !integration || !integration.credentials) {
      throw new Error("Meta Integration not found or missing credentials.");
    }

    const { ad_account_id, access_token } = integration.credentials;
    if (!ad_account_id || !access_token) {
      throw new Error("Invalid Meta credentials: ad_account_id and access_token required.");
    }

    console.log(`[Meta Sync] Ingesting for tenant ${tenant_id} from ${ad_account_id}`);
    const metaApiUrl = `https://graph.facebook.com/v18.0/${ad_account_id}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks,actions&date_preset=last_30d&access_token=${access_token}`;

    // 2. Fetch Insights from Facebook Graph API
    const metaRes = await fetch(metaApiUrl, { method: 'GET' });

    if (!metaRes.ok) {
      const errText = await metaRes.text();
      console.error(`Meta Ads API Error: ${errText}`);
      throw new Error(`Meta API failed: ${metaRes.statusText}`);
    }

    const metaData = await metaRes.json();
    const campaigns = metaData.data || [];

    // 3. Upsert Active Campaigns Cache
    const campaignInserts = campaigns.map((c: any) => {
      // Find purchases in actions array
      const purchases = c.actions?.find((a: any) => a.action_type === 'purchase')?.value || '0';
      return {
        tenant_id: tenant_id,
        campaign_id: c.campaign_id,
        name: c.campaign_name,
        platform: 'Meta',
        status: 'active',
        spend: parseFloat(c.spend || '0'),
        impressions: parseInt(c.impressions || '0'),
        clicks: parseInt(c.clicks || '0'),
        conversions: parseInt(purchases),
        roas: parseFloat(c.spend) > 0 ? (parseFloat(purchases) || 0) / parseFloat(c.spend) : 0,
        cpa: parseInt(purchases) > 0 ? parseFloat(c.spend) / parseInt(purchases) : 0
      };
    });

    if (campaignInserts.length > 0) {
      await supabaseClient.from('active_campaigns_cache').upsert(campaignInserts, { onConflict: 'tenant_id,campaign_id' });
    }

    // 4. Update Business Daily Metrics for Spend globally for today (Simulated aggregation)
    const totalSpend = campaignInserts.reduce((a: number, c: any) => a + c.spend, 0);
    const dateObj = new Date();
    const today = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // In production, we would map insights by date_start/date_stop. For Pilot, we just update today's ad_spend
    await supabaseClient.rpc('increment_daily_metric', {
      t_id: tenant_id,
      m_date: today,
      new_spend: totalSpend
    }).catch(e => console.log("RPC Error (Fallback to basic update required in prod)", e));

    // Update Sync State
    await supabaseClient
      .from('tenant_integrations')
      .update({ last_sync_at: new Date().toISOString(), status: 'active' })
      .match({ tenant_id: tenant_id, provider: 'meta' });

    return new Response(JSON.stringify({ success: true, count: campaigns.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error("Meta Sync Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
