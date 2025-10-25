/**
 * Supabase Edge Function: Payment Webhook Handler
 * Receives payment confirmations from Wompi and updates purchase status
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-event-checksum',
};

interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      amount_in_cents: number;
      reference: string; // Our payment intent ID
      customer_email: string;
      currency: string;
      payment_method_type: string;
      redirect_url: string;
      status: string; // APPROVED, DECLINED, PENDING, etc.
      status_message: string | null;
      created_at: string;
      finalized_at: string | null;
    };
  };
  sent_at: string;
  timestamp: number;
  signature: {
    checksum: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Wompi event secret for signature verification
    const wompiEventSecret = Deno.env.get('WOMPI_EVENT_SECRET');

    // Parse webhook payload
    const payload: WompiWebhookEvent = await req.json();
    console.log('📥 Received webhook:', payload.event);

    // Verify signature (important for security!)
    const checksum = req.headers.get('x-event-checksum');
    if (wompiEventSecret && checksum) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(payload) + wompiEventSecret);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex !== checksum) {
        console.error('❌ Invalid signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle transaction.updated event
    if (payload.event === 'transaction.updated') {
      const transaction = payload.data.transaction;
      const paymentIntentId = transaction.reference;

      console.log(`📝 Processing transaction ${transaction.id} - Status: ${transaction.status}`);

      // Map Wompi status to our PaymentStatus
      let paymentStatus = 'pending';
      if (transaction.status === 'APPROVED') {
        paymentStatus = 'completed';
      } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
        paymentStatus = 'failed';
      } else if (transaction.status === 'VOIDED') {
        paymentStatus = 'cancelled';
      }

      // Find purchase by payment intent ID (stored in payment_transaction_id or search by metadata)
      // First, try to find by transaction_id
      let { data: purchase, error: findError } = await supabase
        .from('purchases')
        .select('*')
        .eq('payment_transaction_id', transaction.id)
        .single();

      // If not found, might be a new transaction - search by reference in metadata
      if (!purchase) {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('*')
          .contains('payment_metadata', { paymentId: paymentIntentId });

        purchase = purchases && purchases.length > 0 ? purchases[0] : null;
      }

      if (!purchase) {
        console.error(`❌ Purchase not found for transaction ${transaction.id}`);
        return new Response(
          JSON.stringify({ error: 'Purchase not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update purchase with payment confirmation
      const { error: updateError } = await supabase
        .from('purchases')
        .update({
          payment_status: paymentStatus,
          payment_transaction_id: transaction.id,
          payment_completed_at: transaction.finalized_at || new Date().toISOString(),
          payment_metadata: {
            ...purchase.payment_metadata,
            wompi_status: transaction.status,
            wompi_message: transaction.status_message,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', purchase.id);

      if (updateError) {
        console.error('❌ Failed to update purchase:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update purchase', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If payment was approved, activate tickets
      if (paymentStatus === 'completed') {
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({ status: 'active' })
          .eq('purchase_id', purchase.id);

        if (ticketError) {
          console.error('❌ Failed to activate tickets:', ticketError);
        } else {
          console.log('✅ Tickets activated for purchase:', purchase.id);
        }
      }

      // If payment failed, cancel tickets
      if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({ status: 'cancelled' })
          .eq('purchase_id', purchase.id);

        if (ticketError) {
          console.error('❌ Failed to cancel tickets:', ticketError);
        } else {
          console.log('🚫 Tickets cancelled for purchase:', purchase.id);
        }
      }

      console.log(`✅ Purchase ${purchase.id} updated to status: ${paymentStatus}`);

      return new Response(
        JSON.stringify({ success: true, purchaseId: purchase.id, status: paymentStatus }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown event type
    console.log(`⚠️ Unknown event type: ${payload.event}`);
    return new Response(
      JSON.stringify({ message: 'Event received but not processed', event: payload.event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
