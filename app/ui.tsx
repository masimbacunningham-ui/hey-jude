"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Tab = "home" | "capture" | "transactions" | "zimbabwe" | "assistant";
type Person = { id: string; name: string };
type Tx = {
  id: string; type: "income" | "expense"; amount: number; description: string;
  category: string; paid_by: string | null; account_name: string | null;
  project: string | null; transaction_date: string; created_at: string;
};
type Household = { id: string; name: string; join_code: string };

const money = (n:number, currency="ZAR") =>
  new Intl.NumberFormat("en-ZA", { style:"currency", currency, maximumFractionDigits:2 }).format(n);

function monthRange() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const start = d >= 25 ? new Date(y,m,25) : new Date(y,m-1,25);
  const end = new Date(start.getFullYear(), start.getMonth()+1, 24);
  return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) };
}

export function AppShell() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [household, setHousehold] = useState<Household|null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [projects, setProjects] = useState<any[]>([]); // <--- Add this line here!
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authMode, setAuthMode] = useState<"signin"|"signup">("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session);
      if (data.session) loadHousehold(data.session.user.id);
      else setLoading(false);
    });
    const {data: listener} = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadHousehold(s.user.id);
      else { setHousehold(null); setTxs([]); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
async function createHousehold(name: string) {
  const { data, error } = await supabase.rpc("create_household", { name });
  if (error) return setMessage(error.message);
  setMessage("Household created. Share the join code with Lynn");
}

async function loadHousehold(userId: string) {
  setLoading(true);
  const { data: member } = await supabase.from("household_member").select("household_id").eq("user_id", userId).limit(1).maybeSingle();
  if (!member) { setLoading(false); return; }

  const { data: h } = await supabase.from("households").select("*").eq("id", member.household_id).single();
  setHousehold(h);

  const { data: projs } = await supabase.from("projects").select("*").eq("household_id", member.household_id);
  setProjects(projs || []);

const { data: t } = await supabase.from("transactions").select(`
  *,
  profiles:profile_id (full_name)
`)
.eq("household_id", member.household_id)
.order("date", { ascending: false });

  setLoading(false);
}
  async function addTransaction(input:Partial<Tx> & { receiptFile?: File | null }) {
    if (!household) return;
    let receipt_path: string | null = null;
    if (input.receiptFile) {
      const safeName = input.receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      receipt_path = `${household.id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage.from("receipts").upload(receipt_path, input.receiptFile, { upsert:false });
      if (upload.error) return setMessage(`Receipt upload failed: ${upload.error.message}`);
    }
    const {error} = await supabase.from("transactions").insert({
      household_id: household.id,
      type: input.type || "expense",
      amount: Number(input.amount || 0),
      description: input.description || "Untitled",
      category: input.category || "Other",
      paid_by: input.paid_by || session.user.id,
      account_name: input.account_name || null,
      project: input.project || null,
      transaction_date: input.transaction_date || new Date().toISOString().slice(0,10),
      receipt_path
    });
    if (error) setMessage(error.message);
    else { setMessage("Saved."); await loadHousehold(session.user.id); setTab("transactions"); }
  }
const joinHousehold = async (inviteCode: string) => {
    // Add your join logic here or use a placeholder
    console.log("Joining household with code:", inviteCode);
  };


  if (!session) return <AuthScreen supabase={supabase} mode={authMode} setMode={setAuthMode} />;
  if (loading) return <div className="center"><div className="spinner"/><p>Loading Hey Jude…</p></div>;
  if (!household) return <SetupScreen onCreate={createHousehold} onJoin={joinHousehold} message={message} />;

  return (
    <div className="app">
      <header className="topbar">
        <div><div className="brand">Hey Jude</div><div className="sub">{household.name}</div></div>
        <button className="iconBtn" onClick={async()=>{await supabase.auth.signOut();}}>↪</button>
      </header>

      <main className="content">
        {message && <button className="notice" onClick={()=>setMessage("")}>{message} ×</button>}
       {tab==="capture" && <Capture people={people} projects={projects} onSave={addTransaction}/>}
     
        {tab==="transactions" && <Transactions txs={txs} people={people}/>}
        {tab==="zimbabwe" && <Zimbabwe txs={txs} onSave={addTransaction}/>}
        {tab==="assistant" && <Assistant txs={txs} household={household}/>}
      </main>

      <nav className="bottomNav">
        <Nav active={tab==="home"} onClick={()=>setTab("home")} icon="⌂" label="Home"/>
        <Nav active={tab==="capture"} onClick={()=>setTab("capture")} icon="＋" label="Capture"/>
        <Nav active={tab==="transactions"} onClick={()=>setTab("transactions")} icon="▤" label="Money"/>
        <Nav active={tab==="zimbabwe"} onClick={()=>setTab("zimbabwe")} icon="🇿🇼" label="Zimbabwe"/>
        <Nav active={tab==="assistant"} onClick={()=>setTab("assistant")} icon="✦" label="Ask Jude"/>
      </nav>
    </div>
  );
}

function Nav({active,onClick,icon,label}:{active:boolean,onClick:()=>void,icon:string,label:string}) {
  return <button className={active?"navItem active":"navItem"} onClick={onClick}><span>{icon}</span><small>{label}</small></button>
}

function AuthScreen({supabase,mode,setMode}:{supabase:any,mode:"signin"|"signup",setMode:(m:"signin"|"signup")=>void}) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState(""); const [msg,setMsg]=useState("");
  async function submit(e:any) {
    e.preventDefault(); setMsg("Working…");
    if(mode==="signup") {
      const {error}=await supabase.auth.signUp({email,password,options:{data:{first_name:name}}});
      setMsg(error?.message || "Check your email to confirm your account.");
    } else {
      const {error}=await supabase.auth.signInWithPassword({email,password});
      setMsg(error?.message || "");
    }
  }
  return <div className="auth">
    <div className="logoMark">HJ</div>
    <h1>Hey Jude</h1><p className="tagline">One household. One financial truth.</p>
    <form className="card form" onSubmit={submit}>
      {mode==="signup" && <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required/>}
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required/>
      <button className="primary" type="submit">{mode==="signin"?"Sign in":"Create account"}</button>
      {msg && <p className="small">{msg}</p>}
      <button type="button" className="linkBtn" onClick={()=>setMode(mode==="signin"?"signup":"signin")}>
        {mode==="signin"?"Create an account":"Already have an account? Sign in"}
      </button>
    </form>
  </div>
}

function SetupScreen({onCreate,onJoin,message}:{onCreate:(n:string)=>void,onJoin:(c:string)=>void,message:string}) {
  const [name,setName]=useState("Cunningham & Lynne"); const [code,setCode]=useState("");
  return <div className="auth">
    <div className="logoMark">HJ</div><h1>Set up your household</h1><p className="tagline">Create it once, then connect the second phone.</p>
    <div className="card form">
      <h3>Create household</h3><input value={name} onChange={e=>setName(e.target.value)} />
      <button className="primary" onClick={()=>onCreate(name)}>Create household</button>
      <div className="divider">OR</div>
      <h3>Join existing household</h3><input placeholder="8-character join code" value={code} onChange={e=>setCode(e.target.value)} />
      <button className="secondary" onClick={()=>onJoin(code)}>Join household</button>
      {message && <p className="small">{message}</p>}
    </div>
  </div>
}

function Dashboard({txs,people,household}:{txs:Tx[],people:Person[],household:Household}) {
  const {start,end}=monthRange();
  const current=txs.filter(t=>t.transaction_date>=start && t.transaction_date<=end);
  const income=current.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const spending=current.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const project=current.filter(t=>t.project==="Zimbabwe").reduce((s,t)=>s+t.amount,0);
  const byPerson=people.map(p=>({name:p.name,income:current.filter(t=>t.paid_by===p.id&&t.type==="income").reduce((s,t)=>s+t.amount,0),paid:current.filter(t=>t.paid_by===p.id&&t.type==="expense").reduce((s,t)=>s+t.amount,0)}));
  return <div>
    <div className="hero"><div><span className="eyebrow">FINANCIAL MONTH</span><h2>{start.slice(5).replace("-","/")} → {end.slice(5).replace("-","/")}</h2><p>Household money, without guesswork.</p></div><div className="heroIcon">HJ</div></div>
    <div className="stats">
      <Stat label="Income" value={money(income)} tone="good"/><Stat label="Spent" value={money(spending)} tone="warn"/><Stat label="Remaining" value={money(income-spending)} tone="neutral"/>
    </div>
    <section className="section"><div className="sectionHead"><h3>Contributions</h3><span>this month</span></div>
      <div className="card">
        {byPerson.map(p=><div className="personRow" key={p.name}><div><b>{p.name}</b><small>Income {money(p.income)} · Paid {money(p.paid)}</small></div><strong>{money(p.income-p.paid)}</strong></div>)}
        {!byPerson.length && <p className="empty">Add household members to see the split.</p>}
      </div>
    </section>
    <section className="section"><div className="sectionHead"><h3>Zimbabwe project</h3><span>all tagged spending</span></div>
      <div className="projectCard"><div><b>{money(project)}</b><small>Spent this month</small></div><div className="progress"><i style={{width:`${Math.min(project/20000*100,100)}%`}}/></div></div>
    </section>
    <section className="section"><div className="sectionHead"><h3>Recent activity</h3></div>
      <div className="card">{txs.slice(0,5).map(t=><TxRow key={t.id} t={t}/>)}</div>
    </section>
  </div>
}

function Stat({label,value,tone}:{label:string,value:string,tone:string}) { return <div className={`stat ${tone}`}><small>{label}</small><b>{value}</b></div> }
function TxRow({ t }: { t: any }) {
  return (
    <div className="tx flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{t.description || t.category}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span>{t.transaction_date}</span>
            {t.project && (
              <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-semibold">
                {t.project}
              </span>
            )}
            {t.profiles?.full_name && (
              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300">
                {t.profiles.full_name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={`font-semibold ${t.type === "income" ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>
        {t.type === "income" ? "+" : "-"}{money(t.amount)}
      </div>
    </div>
  );
}


  function Capture({ people, projects = [], onSave }: { people: Person[], projects: any[], onSave: (x: Partial<Tx>) => void }) {
  const [form, setForm] = useState<any>({ type: "expense", amount: "", category: "Groceries", description: "", project: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function scan(f: File) {
    setFile(f); setPreview(URL.createObjectURL(f)); setBusy(true);
    const fd = new FormData(); fd.append("receipt", f);
    try {
      const r = await fetch("/api/receipt", {method: "POST", body: fd}); const data = await r.json();
      if (data.receipt) setForm((x: any) => ({...x, ...data.receipt, amount: data.receipt.amount ?? ""}));
      else if (data.error) alert(data.error);
    } catch { alert("Receipt scan failed. You can enter it manually."); }
    setBusy(false);
  }

  return (
    <div className="card p-4 space-y-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Log Transaction</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500">Type</label>
          <select 
            className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            value={form.type} 
            onChange={e => setForm({...form, type: e.target.value})}
          >
            <option value="expense">Expense (-)</option>
            <option value="income">Income (+)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500">Project Link</label>
          <select 
            className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            value={form.project} 
            onChange={e => setForm({...form, project: e.target.value})}
          >
            <option value="">None (Household)</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Amount</label>
        <input 
          type="number" 
          placeholder="0.00" 
          className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          value={form.amount} 
          onChange={e => setForm({...form, amount: e.target.value})} 
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Category</label>
        <select 
          className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          value={form.category} 
          onChange={e => setForm({...form, category: e.target.value})}
        >
          <option value="Groceries">Groceries</option>
          <option value="Utilities">Utilities</option>
          <option value="Transport">Transport</option>
          <option value="Farming & Operations">Farming & Operations</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Description (Optional)</label>
        <input 
          type="text" 
          placeholder="e.g. Solar inverter & batteries" 
          className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          value={form.description} 
          onChange={e => setForm({...form, description: e.target.value})} 
        />
      </div>

      <button 
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        onClick={() => onSave(form)}
      >
        Add Transaction
      </button>
    </div>
  );
}
  function speak() {
    const SR=(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!SR) return alert("Voice entry is not supported by this browser. Use Safari/Chrome on a supported iPhone.");
    const recognition=new SR(); recognition.lang="en-ZA"; recognition.interimResults=false; recognition.maxAlternatives=1;
    recognition.onstart=()=>setListening(true);
    recognition.onend=()=>setListening(false);
    recognition.onerror=()=>setListening(false);
    recognition.onresult=(event:any)=>{
      const text=event.results[0][0].transcript;
      const amountMatch=text.replace(/,/g,"").match(/(?:r|rand|zar)?\s*(\d+(?:\.\d{1,2})?)/i);
      const amount=amountMatch ? Number(amountMatch[1]) : "";
      setForm((x:any)=>({...x, amount:x.amount||amount, description:x.description||text}));
    };
    recognition.start();
  
  return <div>
    <div className="pageTitle"><h2>Capture money</h2><p>Receipt first. Voice or manual entry when there is no receipt.</p></div>
    <div className="captureGrid">
      <button className="captureTile" onClick={()=>input.current?.click()}><span>📷</span><b>Scan receipt</b><small>AI extracts the details</small></button>
      <button className="captureTile" onClick={speak}><span>{listening?"🔴":"🎙️"}</span><b>{listening?"Listening…":"Speak it"}</b><small>“Paid R450 for fuel”</small></button>
    </div>
    <input ref={input} hidden type="file" accept="image/*" capture="environment" onChange={e=>e.target.files?.[0]&&scan(e.target.files[0])}/>
    {preview && <img className="receiptPreview" src={preview} alt="Receipt preview"/>}
    <div className="card form">
      {busy && <div className="aiLine"><span className="pulse"/> AI is reading the receipt…</div>}
      <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="expense">Expense</option><option value="income">Income</option></select>
      <input inputMode="decimal" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
      <input placeholder="Description / merchant" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})}/>
      <input placeholder="Category" value={form.category||""} onChange={e=>setForm({...form,category:e.target.value})}/>
      <select value={form.project||""} onChange={e=>setForm({...form,project:e.target.value})}><option value="">Household</option><option value="Zimbabwe">🇿🇼 Zimbabwe project</option></select>
      <input placeholder="Account / cash / wallet" value={form.account_name||""} onChange={e=>setForm({...form,account_name:e.target.value})}/>
      <button className="primary" disabled={!form.amount} onClick={()=>onSave({...form,receiptFile:file})}>Save transaction</button>
    </div>
  </div>
  
function Transactions({txs}:{txs:Tx[],people:Person[]}) {
  const [q,setQ]=useState("");
  const filtered=txs.filter(t=>`${t.description} ${t.category} ${t.account_name||""} ${t.project||""}`.toLowerCase().includes(q.toLowerCase()));
  return <div><div className="pageTitle"><h2>Money</h2><p>Every transaction in one shared record.</p></div><input className="search" placeholder="Search transactions…" value={q} onChange={e=>setQ(e.target.value)}/><div className="card">{filtered.map(t=><TxRow key={t.id} t={t}/>)}</div></div>
}

function Zimbabwe({txs,onSave}:{txs:Tx[],onSave:(x:Partial<Tx>)=>void}) {
  const [amount,setAmount]=useState(""); const [desc,setDesc]=useState(""); const [cat,setCat]=useState("House");
  const total=txs.filter(t=>t.project==="Zimbabwe").reduce((s,t)=>s+(t.type==="expense"?t.amount:0),0);
  return <div><div className="pageTitle"><h2>🇿🇼 Zimbabwe</h2><p>Keep the relocation/build project separate from household spending.</p></div>
    <div className="projectHero"><span>Project spend</span><b>{money(total)}</b><small>Target can be configured later</small></div>
    <div className="card form"><h3>Log project spending</h3><input inputMode="decimal" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)}/><input placeholder="What was it for?" value={desc} onChange={e=>setDesc(e.target.value)}/><select value={cat} onChange={e=>setCat(e.target.value)}>{["House","Fencing","Farm","Poultry","Greenhouses","Borehole / Water","Equipment","Other"].map(x=><option key={x}>{x}</option>)}</select><button className="primary" disabled={!amount||!desc} onClick={()=>{onSave({type:"expense",amount:Number(amount),description:desc,category:cat,project:"Zimbabwe"});setAmount("");setDesc("")}}>Add to Zimbabwe project</button></div>
    <div className="card">{txs.filter(t=>t.project==="Zimbabwe").slice(0,20).map(t=><TxRow key={t.id} t={t}/>)}</div>
  </div>
}

function Assistant({txs,household}:{txs:Tx[],household:Household}) {
  const [q,setQ]=useState(""); const [answer,setAnswer]=useState(""); const [busy,setBusy]=useState(false);
  async function ask() {
    if(!q.trim()) return; setBusy(true); setAnswer("");
    const r=await fetch("/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q,household:household.name,transactions:txs.slice(0,200)})});
    const d=await r.json(); setAnswer(d.answer||d.error||"No answer."); setBusy(false);
  }
  const suggestions=["How much did we spend this month?","Who has paid what?","How much have we put into Zimbabwe?","What are our biggest expense categories?"];
  return <div><div className="pageTitle"><h2>Ask Jude</h2><p>Ask questions about the household record.</p></div><div className="suggestions">{suggestions.map(s=><button key={s} onClick={()=>setQ(s)}>{s}</button>)}</div><div className="card chat"><textarea placeholder="Ask anything about the recorded finances…" value={q} onChange={e=>setQ(e.target.value)}/><button className="primary" onClick={ask} disabled={busy||!q.trim()}>{busy?"Thinking…":"Ask Hey Jude"}</button>{answer&&<div className="answer"><b>Hey Jude</b><p>{answer}</p></div>}</div></div>
}
  }
export default AppShell;function Transactions({ supabase, householdId }: { supabase: any; householdId: string }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Transactions</h2>
      <p className="text-gray-600">Your transaction ledger will appear here.</p>
    </div>
  );
}function Zimbabwe({ supabase, householdId }: { supabase: any; householdId: string }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Zimbabwe Project</h2>
      <p className="text-gray-600">Mahusekwa farm estate and project updates will appear here.</p>
    </div>
  );
}function Home({ supabase, householdId }: { supabase: any; householdId: string }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Home Dashboard</h2>
      <p className="text-gray-600">Welcome to your operational overview.</p>
    </div>
  );
}

function Capture({ supabase, householdId }: { supabase: any; householdId: string }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Capture</h2>
      <p className="text-gray-600">Quick entry form will appear here.</p>
    </div>
  );
}

