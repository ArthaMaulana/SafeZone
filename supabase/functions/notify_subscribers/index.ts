// supabase/functions/notify_subscribers/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { haversineDistance } from '../../../lib/geo.ts'; // Asumsi path ini bisa di-resolve oleh bundler

// Skema validasi untuk request body
const requestSchema = z.object({
  report_id: z.number().int().positive(),
});

// Header CORS untuk response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Sesuaikan di production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validasi Input
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: validation.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { report_id } = validation.data;

    // 2. Inisialisasi Supabase Client (membutuhkan akses admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Ambil data laporan yang baru dibuat
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('lat, lng, description, category')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      throw new Error(`Report not found or error fetching report: ${reportError?.message}`);
    }

    // 4. Ambil semua data subscriber
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, center_lat, center_lng, radius_m');

    if (subsError) {
      throw new Error(`Error fetching subscriptions: ${subsError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscribers to notify.');
      return new Response(JSON.stringify({ message: 'No subscribers to notify.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Filter subscriber yang relevan
    const subscribersToNotify = subscriptions.filter(sub => {
      const distance = haversineDistance(
        report.lat,
        report.lng,
        sub.center_lat,
        sub.center_lng
      );
      return distance <= sub.radius_m;
    });

    // 6. Kirim notifikasi (mock)
    // Di aplikasi nyata, di sini Anda akan memanggil layanan email (Postmark, SendGrid) atau Web Push.
    const notifications = subscribersToNotify.map(sub => {
      console.log(`MOCK: Notifying user ${sub.user_id} about a new '${report.category}' report.`);
      // return sendEmail(sub.user_id, report); // Contoh pemanggilan fungsi pengiriman email
      return { userId: sub.user_id, status: 'notified' };
    });

    return new Response(JSON.stringify({ 
      message: `Successfully processed report ${report_id}. Notified ${notifications.length} subscribers.`,
      notified_users: notifications
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
