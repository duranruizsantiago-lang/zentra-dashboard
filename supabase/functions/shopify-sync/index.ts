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
    if (!tenant_id) {
      throw new Error("tenant_id is required");
    }

    // 1. Fetch credentials from DB securely
    const { data: integration, error: intError } = await supabaseClient
      .from('tenant_integrations')
      .select('credentials')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'shopify')
      .single();

    if (intError || !integration || !integration.credentials) {
      throw new Error("Shopify integration not found or missing credentials.");
    }

    const { store_domain, access_token } = integration.credentials;
    if (!store_domain || !access_token) {
      throw new Error("Invalid Shopify credentials: store_domain and access_token required.");
    }

    console.log(`[Shopify Sync] Ingesting for tenant ${tenant_id} from ${store_domain}`);

    const shopifyApiUrl = `https://${store_domain}/admin/api/2024-01`;

    // 2. Fetch Orders (Max 250 recent for simplistic sync, production requires pagination/webhooks)
    const ordersRes = await fetch(`${shopifyApiUrl}/orders.json?status=any&limit=250`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': access_token
      }
    });

    if (!ordersRes.ok) {
      const errText = await ordersRes.text();
      console.error(`Shopify Orders API Error: ${errText}`);
      throw new Error(`Shopify Orders API failed: ${ordersRes.statusText}`);
    }

    const ordersData = await ordersRes.json();
    const orders = ordersData.orders || [];

    // Aggregate Orders by Date
    const ordersByDate: Record<string, { gross: number, net: number, count: number, returns: number, refunds: number }> = {};

    orders.forEach((o: any) => {
      // Date format YYYY-MM-DD
      const d = o.created_at.split('T')[0];
      if (!ordersByDate[d]) ordersByDate[d] = { gross: 0, net: 0, count: 0, returns: 0, refunds: 0 };

      const subtotal = parseFloat(o.subtotal_price || '0');
      const total = parseFloat(o.total_price || '0');

      ordersByDate[d].gross += subtotal;
      ordersByDate[d].net += total;
      ordersByDate[d].count += 1;

      // Simplistic refund detection
      if (o.financial_status === "refunded" || o.financial_status === "partially_refunded") {
        ordersByDate[d].returns += 1;
        // Note: Precise refund calculation requires iterating o.refunds
        const totalRefund = o.refunds?.reduce((a: number, curr: any) => {
          const amt = curr.transactions?.filter((t: any) => t.kind === 'refund' && t.status === 'success').reduce((b: number, tx: any) => b + parseFloat(tx.amount || '0'), 0) || 0;
          return a + amt;
        }, 0);
        ordersByDate[d].refunds += totalRefund || 0;
      }
    });

    // 3. Upsert Grouped Metrics
    for (const [date, metrics] of Object.entries(ordersByDate)) {
      await supabaseClient
        .from('business_daily_metrics')
        .upsert({
          tenant_id: tenant_id,
          metric_date: date,
          gross_sales: metrics.gross,
          net_sales: metrics.net,
          orders_count: metrics.count,
          total_returns: metrics.returns,
          refunds_amount: metrics.refunds
        }, { onConflict: 'tenant_id,metric_date' });
    }

    // 4. Update last sync time
    await supabaseClient
      .from('tenant_integrations')
      .update({ last_sync_at: new Date().toISOString(), status: 'active' })
      .match({ tenant_id: tenant_id, provider: 'shopify' });

    return new Response(JSON.stringify({ success: true, count: orders.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Shopify Sync Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
