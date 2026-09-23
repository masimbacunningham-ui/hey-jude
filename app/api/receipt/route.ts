import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({error:"AI receipt scanning is not configured yet. Add OPENAI_API_KEY in your deployment settings."},{status:503});

  const form = await request.formData();
  const file = form.get("receipt");
  if (!(file instanceof File)) return NextResponse.json({error:"No receipt image received."},{status:400});
  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mime = file.type || "image/jpeg";

  const prompt = `Read this financial receipt and return ONLY valid JSON with these fields:
amount (number or null), description (merchant or main description), category (one of Groceries, Fuel, Restaurant, Household, Utilities, Transport, Building, Farm, Poultry, Other), transaction_date (YYYY-MM-DD or null), currency (3-letter code or null), project (use "Zimbabwe" only if the receipt clearly relates to a Zimbabwe project, otherwise null), confidence (0-1).
Do not invent missing values.`;

  const r = await fetch("https://api.openai.com/v1/responses", {
    method:"POST",
    headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      input:[{role:"user",content:[
        {type:"input_text",text:prompt},
        {type:"input_image",image_url:`data:${mime};base64,${base64}`}
      ]}],
      text:{format:{type:"json_object"}}
    })
  });
  if (!r.ok) return NextResponse.json({error:`AI receipt scan failed (${r.status}).`},{status:502});
  const data = await r.json();
  const raw = data.output_text || "";
  try { return NextResponse.json({receipt:JSON.parse(raw)}); }
  catch { return NextResponse.json({error:"The AI returned an unreadable receipt result. Enter it manually."},{status:422}); }
}