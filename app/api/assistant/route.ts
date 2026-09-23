import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({error:"AI assistant is not configured yet. Add OPENAI_API_KEY in your deployment settings."},{status:503});
  const {question,household,transactions=[]} = await request.json();

  const prompt = `You are Hey Jude, a neutral household financial assistant for ${household}.
Answer ONLY from the supplied transaction data. Do not invent balances, transactions, people, dates or conclusions.
Use South African rand (ZAR) formatting when currency is not specified.
The household financial month runs from the 25th through the 24th.
If the data is insufficient, say exactly what is missing.
Question: ${question}

Transaction data:
${JSON.stringify(transactions)}`;

  const r=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",input:prompt})
  });
  if(!r.ok) return NextResponse.json({error:`AI assistant failed (${r.status}).`},{status:502});
  const data=await r.json();
  return NextResponse.json({answer:data.output_text||"I couldn't produce an answer."});
}