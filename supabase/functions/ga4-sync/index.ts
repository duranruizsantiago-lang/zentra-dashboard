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

    // 1. Fetch credentials
    const { data: integration, error: intError } = await supabaseClient
      .from('tenant_integrations')
      .select('credentials')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'ga4')
      .single();

    if (intError || !integration || !integration.credentials) {
      throw new Error("GA4 Integration not found or missing credentials.");
    }

    const { property_id, access_token } = integration.credentials;
    if (!property_id || !access_token) {
      throw new Error("Invalid GA4 credentials: property_id and access_token required.");
    }

    console.log(`[GA4 Sync] Ingesting for tenant ${tenant_id} from property ${property_id}`);
    const ga4ApiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runReport`;

    // 2. Fetch Report (Last 30 days Sessions, Engagement, Conversions)
    const ga4Res = await fetch(ga4ApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'bounceRate' }]
      })
    });

    if (!ga4Res.ok) {
      const errText = await ga4Res.text();
      console.error(`GA4 API Error: ${errText}`);
      throw new Error(`GA4 API failed: ${ga4Res.statusText}`);
    }

    const ga4Data = await ga4Res.json();
    const rows = ga4Data.rows || [];

    let totalSessions = 0;

    if (rows.length > 0) {
      totalSessions = parseInt(rows[0].metricValues[0].value || '0');
    }

    // 3. Update Business Daily Metrics for Sessions globally for today (Simulated basic aggregation)
    const dateObj = new Date();
    const today = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // Basic structural update - Production requires detailed RPC or time-series insertions
    await supabaseClient.from('business_daily_metrics')
      .update({ sessions: totalSessions }) // Simplified assignment for architecture demo
      .match({ tenant_id: tenant_id, metric_date: today });

    // Update Sync State
    await supabaseClient
      .from('tenant_integrations')
      .update({ last_sync_at: new Date().toISOString(), status: 'active' })
      .match({ tenant_id: tenant_id, provider: 'ga4' });

    return new Response(JSON.stringify({ success: true, sessions: totalSessions }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error("GA4 Sync Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
