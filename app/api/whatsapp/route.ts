import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mupfyayteoldumljgguu.supabase.co';
const supabaseAnonKey = 'sb_publishable_tvzTzSsQ8rsMHP6esPI1pg_r9_L4g6n';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const incomingMsg = formData.get('Body')?.toString() || '';
    const mediaUrl = formData.get('MediaUrl0')?.toString() || null;

    const lower = incomingMsg.toLowerCase();
    const amtMatch = incomingMsg.match(/(\d+(\.\d+)?)/);
    const amount = amtMatch ? parseFloat(amtMatch[1]) : 0;

    if (amount === 0 && !mediaUrl) {
      return new Response(
        `<Response><Message>Hi from Jude! I couldn't find an amount in your message. Try sending something like: "Spar R150 groceries"</Message></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    let category = 'Household';
    if (lower.includes('farm') || lower.includes('fencing') || lower.includes('pipe') || lower.includes('borehole')) {
      category = 'Phase 3: Civil & Residential Infrastructure';
    }

    let paidFrom = 'Paisa Account';
    if (lower.includes('absa')) paidFrom = 'Absa Account';
    else if (lower.includes('lynne')) paidFrom = "Lynne's Mukuru Account";
    else if (lower.includes('savings') || lower.includes('joint')) paidFrom = 'Your Mukuru Account (Joint Savings)';

    const payload = {
      household_id: 'default-household',
      record_type: 'transaction',
      type: 'expense',
      category: category,
      amount: amount,
      currency: 'ZAR',
      description: incomingMsg + (mediaUrl ? ' [Receipt Attached]' : ''),
      paid_from: paidFrom
    };

    const { error } = await supabase.from('transactions').insert([payload]);

    if (error) {
      throw new Error(error.message);
    }

    const twimlResponse = `<Response><Message>✅ Captured via WhatsApp!\n• Desc: ${incomingMsg}\n• Amount: R${amount.toLocaleString()}\n• Account: ${paidFrom}</Message></Response>`;
    return new Response(twimlResponse, { headers: { 'Content-Type': 'text/xml' } });
  } catch (err: any) {
    return new Response(
      `<Response><Message>❌ Error recording transaction: ${err.message}</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
}