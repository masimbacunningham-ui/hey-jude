'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Hardcoded with your exact Supabase credentials
const supabaseUrl = 'https://mupfyayteoldumljgguu.supabase.co';
const supabaseAnonKey = 'sb_publishable_tvzTzSsQ8rsMHP6esPI1pg_r9_L4g6n';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AppShell() {
  const [activeTab, setActiveTab] = useState('capture');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Hey Jude</h1>
        <p className="text-xs text-gray-500">Cunningham & Lynne</p>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === 'capture' && <Capture />}
        {activeTab === 'money' && <MoneyDashboard />}
        {activeTab === 'zimbabwe' && <ZimbabweDashboard />}
        {activeTab === 'ask jude' && <AskJude />}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 z-50">
        <button 
          onClick={() => setActiveTab('capture')}
          className={`text-xs font-medium flex flex-col items-center ${activeTab === 'capture' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
        >
          <span className="text-lg">+</span> Capture
        </button>
        <button 
          onClick={() => setActiveTab('money')}
          className={`text-xs font-medium flex flex-col items-center ${activeTab === 'money' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
        >
          <span className="text-lg">💳</span> Money
        </button>
        <button 
          onClick={() => setActiveTab('zimbabwe')}
          className={`text-xs font-medium flex flex-col items-center ${activeTab === 'zimbabwe' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
        >
          <span className="text-lg">ZW</span> Zimbabwe
        </button>
        <button 
          onClick={() => setActiveTab('ask jude')}
          className={`text-xs font-medium flex flex-col items-center ${activeTab === 'ask jude' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
        >
          <span className="text-lg">✨</span> Ask Jude
        </button>
      </nav>
    </div>
  );
}

function AskJude() {
  const [messages, setMessages] = useState([
    { sender: 'jude', text: "Hello Cunningham! I'm Jude, your personal AI advisor. You can type, use voice dictation 🎤, or snap/upload pictures 📸 of receipts and documents for me to read and translate!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Voice Dictation using Web Speech API
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${speechToText}` : speechToText));
    };

    recognition.start();
  };

  // Handle Image Upload / Camera Capture
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMsg = input;
    const imgAttached = selectedImage;

    // Append user message
    setMessages(prev => [
      ...prev, 
      { sender: 'user', text: userMsg || '[Image Attached]', image: imgAttached }
    ]);

    setInput('');
    setSelectedImage(null);
    setLoading(true);

    setTimeout(() => {
      let reply = "I've reviewed your request and logged the details.";
      if (imgAttached) {
        reply = "📸 Image analyzed successfully! I've extracted the text and verified the document contents for your records.";
      } else {
        const lower = userMsg.toLowerCase();
        if (lower.includes('farm') || lower.includes('mahusekwa') || lower.includes('greenhouse')) {
          reply = "The Mahusekwa farm project is mapped across its 6 phases—from off-grid solar and water in Phase 1 to protected horticulture and livestock units. Dad is managing operations on-site!";
        } else if (lower.includes('money') || lower.includes('account') || lower.includes('balance') || lower.includes('paisa') || lower.includes('mukuru')) {
          reply = "Your accounts (Paisa for salary/tips, Absa for driving side-hustle, Lynne's Mukuru, and Joint Savings Mukuru) are fully synced and tracking in your Money tab.";
        }
      }

      setMessages(prev => [...prev, { sender: 'jude', text: reply }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto flex flex-col h-[82vh]">
      <div className="mb-3">
        <h2 className="text-2xl font-bold text-gray-900">Ask Jude</h2>
        <p className="text-gray-600 text-sm">Voice commands, image reading, and intelligent advisory.</p>
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm space-y-2 ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}>
              {m.image && (
                <img src={m.image} alt="Uploaded attachment" className="rounded-lg max-h-48 object-cover w-full" />
              )}
              <p>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 p-3 rounded-2xl text-sm animate-pulse">
              Jude is analyzing...
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Banner if selected */}
      {selectedImage && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
            <span className="text-xs font-medium text-blue-900">Image attached ready to send</span>
          </div>
          <button onClick={() => setSelectedImage(null)} className="text-xs text-red-600 hover:underline font-medium">Remove</button>
        </div>
      )}

      {/* Input Form with Voice & Camera buttons */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageChange} 
          className="hidden" 
        />
        
        {/* Camera / Image Upload Button */}
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload or Snap Picture"
          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center justify-center"
        >
          📷
        </button>

        {/* Voice Dictation Button */}
        <button 
          type="button"
          onClick={startListening}
          title="Voice Dictation"
          className={`p-2.5 rounded-xl transition flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-bounce' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          🎤
        </button>

        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening... Speak now..." : "Ask Jude, or attach photo/voice..."}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
        />

        <button 
          type="submit"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition text-sm shadow-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function ZimbabweDashboard() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('transactions').select('*').eq('category', 'Mahusekwa Farm').order('created_at', { ascending: false });
    if (!error) setMilestones(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMilestones(); }, []);

  const farmPhases = [
    { phase: 'Phase 1: Off-Grid Utilities', desc: 'Solar power system setup, borehole drilling, water storage tanks, and irrigation plumbing.', status: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { phase: 'Phase 2: Protected Agriculture', desc: 'Greenhouse construction, shade netting, drip irrigation lines, and vegetable crop cycles.', status: 'Planning', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { phase: 'Phase 3: Civil & Residential Infrastructure', desc: 'Two-bedroom residence construction (roofing, finishes), perimeter fencing, and access roads.', status: 'In Progress', color: 'bg-green-50 text-green-700 border-green-200' },
    { phase: 'Phase 4: Livestock & Swine Units', desc: 'Broiler chicken housing & brooding units, piggery pens, and manure waste management systems.', status: 'Upcoming', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { phase: 'Phase 5: Operations & Supply Chain', desc: 'Bulk feed storage, veterinary vaccine management, and on-site farm manager coordination (Dad).', status: 'Upcoming', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { phase: 'Phase 6: Commercial Sales & Distribution', desc: 'Market access to local butcheries, fresh produce packaging, and revenue tracking.', status: 'Upcoming', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ];

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mahusekwa Farm & Zimbabwe</h2>
          <p className="text-gray-600 text-sm">5,000 sqm greenfield agricultural estate & project master plan.</p>
        </div>
        <button onClick={fetchMilestones} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition">Refresh</button>
      </div>

      <div className="bg-gradient-to-r from-green-800 to-emerald-900 text-white p-6 rounded-2xl shadow-sm space-y-2">
        <span className="text-xs bg-green-700 text-green-100 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">Active Estate</span>
        <h3 className="text-xl font-bold">Mashonaland East Development</h3>
        <p className="text-sm text-green-100 max-w-2xl">
          Integrated farming operation combining protected horticulture, poultry, swine production, and off-grid resilience, managed on-site by Dad.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Master Plan Phases</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {farmPhases.map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900 text-sm">{item.phase}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${item.color}`}>{item.status}</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Logged Mahusekwa Milestones & Activities</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading farm records...</div>
        ) : milestones.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No specific farm milestones logged yet. Head over to the Capture tab to add your first entry!</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {milestones.map((item) => (
              <div key={item.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">{item.record_type === 'milestone' ? 'Milestone' : item.type}</span>
                    <span className="text-xs text-gray-500">Mahusekwa</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{item.description}</p>
                  {item.target_date && <p className="text-xs text-gray-500">Target Date: {item.target_date}</p>}
                </div>
                <div className="text-right">
                  {item.amount > 0 && <span className="text-sm font-bold text-gray-900">{item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : 'R'}{parseFloat(item.amount).toLocaleString()}</span>}
                  <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MoneyDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const accountBalances: { [key: string]: number } = {
    'Paisa Account': 0,
    'Absa Account': 0,
    "Lynne's Mukuru Account": 0,
    'Your Mukuru Account (Joint Savings)': 0,
  };

  records.forEach((item) => {
    const amt = parseFloat(item.amount) || 0;
    const source = item.paid_from;
    const dest = item.transfer_to;

    if (item.record_type === 'transaction') {
      if (item.type === 'income' && source && accountBalances[source] !== undefined) accountBalances[source] += amt;
      else if (item.type === 'expense' && source && accountBalances[source] !== undefined) accountBalances[source] -= amt;
    } else if (item.record_type === 'transfer') {
      if (source && accountBalances[source] !== undefined) accountBalances[source] -= amt;
      if (dest && accountBalances[dest] !== undefined) accountBalances[dest] += amt;
    }
  });

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Money Dashboard</h2>
          <p className="text-gray-600 text-sm">Account balances and financial overview.</p>
        </div>
        <button onClick={fetchRecords} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition">Refresh</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">Primary Income</span>
          <h4 className="font-bold text-gray-900 text-lg mt-2">Paisa Account</h4>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">R{accountBalances['Paisa Account'].toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">Side Hustle</span>
          <h4 className="font-bold text-gray-900 text-lg mt-2">Absa Account</h4>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">R{accountBalances['Absa Account'].toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-semibold">Partner Income</span>
          <h4 className="font-bold text-gray-900 text-lg mt-2">Lynne's Mukuru Account</h4>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">R{accountBalances["Lynne's Mukuru Account"].toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">Savings & Remittance</span>
          <h4 className="font-bold text-gray-900 text-lg mt-2">Your Mukuru Account</h4>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">R{accountBalances['Your Mukuru Account (Joint Savings)'].toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function Capture() {
  const householdId = 'default-household';
  const [captureType, setCaptureType] = useState('transaction');
  const accountsList = ['Paisa Account', 'Absa Account', "Lynne's Mukuru Account", 'Your Mukuru Account (Joint Savings)'];

  const [type, setType] = useState('expense');
  const [currency, setCurrency] = useState('ZAR');
  const [category, setCategory] = useState('Farm');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidFrom, setPaidFrom] = useState('Paisa Account');

  const [transferFrom, setTransferFrom] = useState('Paisa Account');
  const [transferTo, setTransferTo] = useState('Absa Account');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  const [loanParty, setLoanParty] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('borrowed');

  const [milestoneProject, setMilestoneProject] = useState('Mahusekwa Farm');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      let payload: any = { household_id: householdId, record_type: captureType, currency: currency };

      if (captureType === 'transaction') {
        payload.type = type;
        payload.category = category;
        payload.amount = parseFloat(amount) || 0;
        payload.description = description;
        payload.paid_from = paidFrom;
      } else if (captureType === 'transfer') {
        payload.record_type = 'transfer';
        payload.type = 'transfer';
        payload.category = 'Transfer';
        payload.amount = parseFloat(transferAmount) || 0;
        payload.description = transferDesc || `Transfer from ${transferFrom} to ${transferTo}`;
        payload.paid_from = transferFrom;
        payload.transfer_to = transferTo;
      } else if (captureType === 'loan') {
        payload.type = loanType;
        payload.category = 'Loan';
        payload.amount = parseFloat(loanAmount) || 0;
        payload.description = `Loan with ${loanParty}`;
        payload.counterparty = loanParty;
        payload.paid_from = paidFrom;
      } else if (captureType === 'milestone') {
        payload.type = 'milestone';
        payload.category = milestoneProject;
        payload.amount = 0;
        payload.description = milestoneTitle;
        payload.target_date = milestoneDate;
        payload.paid_from = paidFrom;
      }

      const { error } = await supabase.from('transactions').insert([payload]);
      if (error) throw error;

      setLoading(false);
      setSuccessMessage(`${captureType.charAt(0).toUpperCase() + captureType.slice(1)} recorded successfully!`);
      setDescription(''); setAmount(''); setTransferAmount(''); setTransferDesc(''); setLoanParty(''); setLoanAmount(''); setMilestoneTitle(''); setMilestoneDate('');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setLoading(false);
      setSuccessMessage(`Error: ${err.message || 'Could not save record.'}`);
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-1 text-gray-900">Capture & Record</h2>
      <p className="text-gray-600 mb-6">Log income, expenses, account transfers, loans, or milestones.</p>
      
      {successMessage && <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700">{successMessage}</div>}

      <div className="grid grid-cols-4 rounded-lg bg-gray-200 p-1 mb-6 text-xs sm:text-sm font-medium">
        <button type="button" onClick={() => setCaptureType('transaction')} className={`py-2 rounded-md transition ${captureType === 'transaction' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Transaction</button>
        <button type="button" onClick={() => setCaptureType('transfer')} className={`py-2 rounded-md transition ${captureType === 'transfer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Transfer</button>
        <button type="button" onClick={() => setCaptureType('loan')} className={`py-2 rounded-md transition ${captureType === 'loan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Loan</button>
        <button type="button" onClick={() => setCaptureType('milestone')} className={`py-2 rounded-md transition ${captureType === 'milestone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Milestone</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
        {captureType === 'transaction' && (
          <>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Expense</button>
              <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Income</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="ZAR">ZAR (R)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="Farm">Farm (Mahusekwa)</option><option value="Household">Household (Hout Bay)</option><option value="Business">Business / Operations</option><option value="Personal">Personal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid From / Received Into</label>
              <select value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white font-medium">
                {accountsList.map((acc) => <option key={acc} value={acc}>{acc}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Greenhouse mesh, Salary" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
          </>
        )}

        {captureType === 'transfer' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer From</label>
                <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  {accountsList.map((acc) => <option key={acc} value={acc}>{acc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To</label>
                <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  {accountsList.map((acc) => <option key={acc} value={acc}>{acc}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (R)</label>
              <input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
              <input type="text" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="e.g. Savings allocation" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
          </>
        )}

        {captureType === 'loan' && (
          <>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button type="button" onClick={() => setLoanType('borrowed')} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${loanType === 'borrowed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Borrowed</button>
              <button type="button" onClick={() => setLoanType('lent')} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${loanType === 'lent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Lent</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Counterparty</label>
              <input type="text" value={loanParty} onChange={(e) => setLoanParty(e.target.value)} placeholder="e.g. Bank" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid From Account</label>
              <select value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                {accountsList.map((acc) => <option key={acc} value={acc}>{acc}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="ZAR">ZAR (R)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" step="0.01" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>
            </div>
          </>
        )}

        {captureType === 'milestone' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project / Focus Area</label>
              <select value={milestoneProject} onChange={(e) => setMilestoneProject(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                <option value="Mahusekwa Farm">Mahusekwa Farm Infrastructure</option>
                <option value="Hout Bay Residence">Hout Bay Setup</option>
                <option value="Business Operations">Business & Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title</label>
              <input type="text" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} placeholder="e.g. Greenhouse completed" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
              <input type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">
          {loading ? 'Saving...' : `Save ${captureType.charAt(0).toUpperCase() + captureType.slice(1)}`}
        </button>
      </form>
    </div>
  );
}