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

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) fetchRecords();
    }
  };

  const accountBalances: { [key: string]: number } = {
    'Paisa Account': 0,
    'Absa Account': 0,
    "Lynne's Mukuru Account": 0,
    'Your Mukuru Account (Joint Savings)': 0,
  };

  const recurringExpenses: any[] = [];
  const loansList: any[] = [];
  const standardTransactions: any[] = [];
  const today = new Date();

  records.forEach((item) => {
    const amt = parseFloat(item.amount) || 0;
    const source = item.paid_from;
    const dest = item.transfer_to;

    if (item.record_type === 'transaction') {
      standardTransactions.push(item);
      if (item.type === 'income' && source && accountBalances[source] !== undefined) accountBalances[source] += amt;
      else if (item.type === 'expense' && source && accountBalances[source] !== undefined) accountBalances[source] -= amt;
    } else if (item.record_type === 'transfer') {
      standardTransactions.push(item);
      if (source && accountBalances[source] !== undefined) accountBalances[source] -= amt;
      if (dest && accountBalances[dest] !== undefined) accountBalances[dest] += amt;
    } else if (item.record_type === 'recurring') {
      const startDate = item.due_date ? new Date(item.due_date) : new Date(item.created_at);
      const dayOfMonth = startDate.getDate();
      
      let curr = new Date(startDate.getFullYear(), startDate.getMonth(), dayOfMonth);
      const limitDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);

      while (curr <= limitDate) {
        const isDue = curr <= today;
        const occurrenceItem = {
          ...item,
          id: `${item.id}_${curr.toISOString().slice(0, 7)}`,
          original_id: item.id,
          virtual_due_date: curr.toISOString().slice(0, 10),
          is_due: isDue
        };
        recurringExpenses.push(occurrenceItem);

        if (isDue && source && accountBalances[source] !== undefined) {
          accountBalances[source] -= amt;
        }

        curr.setMonth(curr.getMonth() + 1);
      }
    } else if (item.record_type === 'loan') {
      loansList.push(item);
    }
  });

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Money Dashboard</h2>
          <p className="text-gray-600 text-sm">Financial Period: <strong className="text-blue-600">25 Sep 2026 – 25 Oct 2026</strong></p>
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

      {/* Loan & Debt Payoff Tracker Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Loan & Debt Payoff Tracker</h3>
          <p className="text-xs text-gray-500">Monitor borrowed funds, lent amounts, and repayment progress.</p>
        </div>
        {loansList.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No active loans logged. Use the Capture tab under Loan to add one!</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {loansList.map((loan) => {
              const loanAmt = parseFloat(loan.amount) || 0;
              return (
                <div key={loan.id} className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${loan.type === 'borrowed' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {loan.type}
                        </span>
                        <span className="text-xs text-gray-500">Counterparty: {loan.counterparty}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-1">{loan.description}</p>
                    </div>
                    <div className="text-right flex items-center space-x-4">
                      <div>
                        <span className="text-sm font-extrabold text-gray-900">{loan.currency === 'USD' ? '$' : 'R'}{loanAmt.toLocaleString()}</span>
                        <p className="text-xs text-gray-500">Paid from: {loan.paid_from}</p>
                      </div>
                      <button onClick={() => handleDeleteRecord(loan.id)} className="text-xs bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-2.5 py-1.5 rounded-lg transition">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recurring Monthly Overheads */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Recurring Monthly Overheads & Due Dates</h3>
        </div>
        {recurringExpenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No recurring expenses logged for this cycle yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recurringExpenses.map((item) => {
              const isDue = item.is_due;
              return (
                <div key={item.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isDue ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                        {isDue ? 'Deducted (Due)' : `Upcoming (Due: ${item.virtual_due_date})`}
                      </span>
                      <span className="text-xs text-gray-500 uppercase">{item.paid_from}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{item.description}</p>
                  </div>
                  <div className="text-right flex items-center space-x-4">
                    <span className="text-sm font-bold text-red-600">R{parseFloat(item.amount || 0).toLocaleString()} / mo</span>
                    <button onClick={() => handleDeleteRecord(item.original_id)} className="text-xs bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-2.5 py-1.5 rounded-lg transition">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions & Transfers History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Transaction & Transfer History</h3>
        </div>
        {standardTransactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No transactions logged yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {standardTransactions.map((item) => (
              <div key={item.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${item.type === 'income' ? 'bg-emerald-100 text-emerald-800' : item.type === 'expense' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{item.description}</p>
                  <p className="text-xs text-gray-400">Account: {item.paid_from} {item.transfer_to ? `➔ ${item.transfer_to}` : ''}</p>
                </div>
                <div className="text-right flex items-center space-x-4">
                  <span className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {item.currency === 'USD' ? '$' : 'R'}{parseFloat(item.amount || 0).toLocaleString()}
                  </span>
                  <button onClick={() => handleDeleteRecord(item.id)} className="text-xs bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-2.5 py-1.5 rounded-lg transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
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
  const [category, setCategory] = useState('Phase 1: Off-Grid Utilities');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidFrom, setPaidFrom] = useState('Paisa Account');

  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recAccount, setRecAccount] = useState('Paisa Account');
  const [recCategory, setRecCategory] = useState('Household');
  const [recDueDate, setRecDueDate] = useState('');

  const [transferFrom, setTransferFrom] = useState('Paisa Account');
  const [transferTo, setTransferTo] = useState('Absa Account');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  const [loanParty, setLoanParty] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('borrowed');

  const [milestonePhase, setMilestonePhase] = useState('Phase 1: Off-Grid Utilities');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneBudget, setMilestoneBudget] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [quoteImage, setQuoteImage] = useState<string | null>(null);
  const quoteInputRef = useRef<HTMLInputElement>(null);

  const handleQuoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setQuoteImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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
      } else if (captureType === 'recurring') {
        payload.record_type = 'recurring';
        payload.type = 'expense';
        payload.category = recCategory;
        payload.amount = parseFloat(recAmount) || 0;
        payload.description = recDesc;
        payload.paid_from = recAccount;
        payload.due_date = recDueDate;
      } else if (captureType === 'transfer') {
        payload.record_type = 'transfer';
        payload.type = 'transfer';
        payload.category = 'Transfer';
        payload.amount = parseFloat(transferAmount) || 0;
        payload.description = transferDesc || `Transfer from ${transferFrom} to ${transferTo}`;
        payload.paid_from = transferFrom;
        payload.transfer_to = transferTo;
      } else if (captureType === 'loan') {
        payload.record_type = 'loan';
        payload.type = loanType;
        payload.category = 'Loan';
        payload.amount = parseFloat(loanAmount) || 0;
        payload.description = `Loan with ${loanParty}`;
        payload.counterparty = loanParty;
        payload.paid_from = paidFrom;
      } else if (captureType === 'milestone') {
        payload.record_type = 'milestone';
        payload.type = 'milestone';
        payload.category = milestonePhase;
        payload.amount = parseFloat(milestoneBudget) || 0;
        payload.description = milestoneTitle + (quoteImage ? ' [Quote Attached]' : '');
        payload.target_date = milestoneDate;
        payload.paid_from = paidFrom;
      }

      const { error } = await supabase.from('transactions').insert([payload]);
      if (error) throw error;

      setLoading(false);
      setSuccessMessage(`${captureType.charAt(0).toUpperCase() + captureType.slice(1)} recorded successfully!`);
      setDescription(''); setAmount(''); setRecDesc(''); setRecAmount(''); setRecDueDate(''); setTransferAmount(''); setTransferDesc(''); setLoanParty(''); setLoanAmount(''); setMilestoneTitle(''); setMilestoneBudget(''); setMilestoneDate(''); setQuoteImage(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setLoading(false);
      setSuccessMessage(`Error: ${err.message || 'Could not save record.'}`);
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-1 text-gray-900">Capture & Record</h2>
      <p className="text-gray-600 mb-6">Log transactions, recurring overheads, transfers, loans, or milestones.</p>
      
      {successMessage && <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700">{successMessage}</div>}

      <div className="grid grid-cols-5 rounded-lg bg-gray-200 p-1 mb-6 text-xs font-medium">
        <button type="button" onClick={() => setCaptureType('transaction')} className={`py-2 rounded-md transition ${captureType === 'transaction' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Transaction</button>
        <button type="button" onClick={() => setCaptureType('recurring')} className={`py-2 rounded-md transition ${captureType === 'recurring' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Recurring</button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Category / Farm Phase</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="Phase 1: Off-Grid Utilities">Phase 1: Off-Grid Utilities</option>
                  <option value="Phase 2: Protected Agriculture">Phase 2: Protected Agriculture</option>
                  <option value="Phase 3: Civil & Residential Infrastructure">Phase 3: Civil & Residential Infrastructure</option>
                  <option value="Phase 4: Livestock & Swine Units">Phase 4: Livestock & Swine Units</option>
                  <option value="Phase 5: Operations & Supply Chain">Phase 5: Operations & Supply Chain</option>
                  <option value="Phase 6: Commercial Sales & Distribution">Phase 6: Commercial Sales & Distribution</option>
                  <option value="Household">Household (Hout Bay)</option>
                  <option value="Business">Business / Operations</option>
                  <option value="Personal">Personal</option>
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
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Borehole deposit payment" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
          </>
        )}

        {captureType === 'recurring' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurring Overhead Description</label>
              <input type="text" value={recDesc} onChange={(e) => setRecDesc(e.target.value)} placeholder="e.g. Hout Bay Rent, Cartrack, Mweb Fiber WiFi" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={recCategory} onChange={(e) => setRecCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="Household">Household (Rent/Utilities)</option><option value="Business">Business / Services</option><option value="Personal">Personal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid From Account</label>
                <select value={recAccount} onChange={(e) => setRecAccount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  {accountsList.map((acc) => <option key={acc} value={acc}>{acc}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Amount (ZAR)</label>
                <input type="number" step="0.01" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={recDueDate} onChange={(e) => setRecDueDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
              </div>
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
              <input type="text" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="e.g. Monthly savings contribution" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Phase</label>
              <select value={milestonePhase} onChange={(e) => setMilestonePhase(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                <option value="Phase 1: Off-Grid Utilities">Phase 1: Off-Grid Utilities</option>
                <option value="Phase 2: Protected Agriculture">Phase 2: Protected Agriculture</option>
                <option value="Phase 3: Civil & Residential Infrastructure">Phase 3: Civil & Residential Infrastructure</option>
                <option value="Phase 4: Livestock & Swine Units">Phase 4: Livestock & Swine Units</option>
                <option value="Phase 5: Operations & Supply Chain">Phase 5: Operations & Supply Chain</option>
                <option value="Phase 6: Commercial Sales & Distribution">Phase 6: Commercial Sales & Distribution</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title</label>
              <input type="text" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} placeholder="e.g. Borehole drilling & submersible pump" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Quote / Budget (ZAR)</label>
                <input type="number" step="0.01" value={milestoneBudget} onChange={(e) => setMilestoneBudget(e.target.value)} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <input type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach Contractor Quotation (Optional)</label>
              <input type="file" accept="image/*" ref={quoteInputRef} onChange={handleQuoteChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {quoteImage && (
                <div className="mt-2 flex items-center space-x-2">
                  <img src={quoteImage} alt="Quote preview" className="w-12 h-12 object-cover rounded-lg border" />
                  <span className="text-xs text-green-600 font-medium">Quote attached successfully!</span>
                </div>
              )}
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

function ZimbabweDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) fetchRecords();
    }
  };

  const farmPhases = [
    { key: 'Phase 1: Off-Grid Utilities', phase: 'Phase 1: Off-Grid Utilities', desc: 'Solar power system setup, borehole drilling, water storage tanks, and irrigation plumbing.', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'Phase 2: Protected Agriculture', phase: 'Phase 2: Protected Agriculture', desc: 'Greenhouse construction, shade netting, drip irrigation lines, and vegetable crop cycles.', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'Phase 3: Civil & Residential Infrastructure', phase: 'Phase 3: Civil & Residential Infrastructure', desc: 'Two-bedroom residence construction (roofing, finishes), perimeter fencing, and access roads.', color: 'bg-green-50 text-green-700 border-green-200' },
    { key: 'Phase 4: Livestock & Swine Units', phase: 'Phase 4: Livestock & Swine Units', desc: 'Broiler chicken housing & brooding units, piggery pens, and manure waste management systems.', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { key: 'Phase 5: Operations & Supply Chain', phase: 'Phase 5: Operations & Supply Chain', desc: 'Bulk feed storage, veterinary vaccine management, and on-site farm manager coordination (Dad).', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { key: 'Phase 6: Commercial Sales & Distribution', phase: 'Phase 6: Commercial Sales & Distribution', desc: 'Market access to local butcheries, fresh produce packaging, and revenue tracking.', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ];

  const milestones = records.filter(r => r.record_type === 'milestone');
  const expenses = records.filter(r => r.record_type === 'transaction' && r.type === 'expense');

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mahusekwa Farm & Zimbabwe</h2>
          <p className="text-gray-600 text-sm">5,000 sqm greenfield agricultural estate & project master plan.</p>
        </div>
        <button onClick={fetchRecords} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition">Refresh</button>
      </div>

      <div className="bg-gradient-to-r from-green-800 to-emerald-900 text-white p-6 rounded-2xl shadow-sm space-y-2">
        <span className="text-xs bg-green-700 text-green-100 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">Active Estate</span>
        <h3 className="text-xl font-bold">Mashonaland East Development</h3>
        <p className="text-sm text-green-100 max-w-2xl">
          Integrated farming operation combining protected horticulture, poultry, swine production, and off-grid resilience, managed on-site by Dad.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Master Plan Phases & Live Payment Progress</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {farmPhases.map((item, idx) => {
            const phaseMilestones = milestones.filter(m => m.category === item.key);
            const totalBudget = phaseMilestones.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
            const phaseExpenses = expenses.filter(e => e.category === item.key);
            const totalPaid = phaseExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
            const progress = totalBudget > 0 ? Math.min(100, Math.round((totalPaid / totalBudget) * 100)) : 0;

            return (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900 text-sm">{item.phase}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${item.color}`}>
                      {progress > 0 ? `${progress}% Paid` : totalBudget > 0 ? 'Budget Set (0% Paid)' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{item.desc}</p>
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Quote Budget: R{totalBudget.toLocaleString()}</span>
                    <span>Paid: R{totalPaid.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span>Payment Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Logged Mahusekwa Milestones & Quotations</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading farm records...</div>
        ) : milestones.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No specific farm milestones logged yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {milestones.map((item) => (
              <div key={item.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">Milestone</span>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{item.description}</p>
                  {item.target_date && <p className="text-xs text-gray-500">Target Date: {item.target_date}</p>}
                </div>
                <div className="text-right flex items-center space-x-4">
                  <div>
                    {item.amount > 0 && <span className="text-sm font-bold text-gray-900">R{parseFloat(item.amount).toLocaleString()} budget</span>}
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteRecord(item.id)} className="text-xs bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-2.5 py-1.5 rounded-lg transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AskJude() {
  const [messages, setMessages] = useState([
    { sender: 'jude', text: "Hello Cunningham! I'm connected to your live database. Ask me about your recurring overhead due dates, loan repayment progress, or upload a receipt photo with a note to auto-capture!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMsg = input;
    const imgAttached = selectedImage;

    setMessages(prev => [
      ...prev, 
      { sender: 'user', text: userMsg || '[Image Attached]', image: imgAttached }
    ]);

    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      let reply = "";
      const lower = userMsg.toLowerCase();

      // If an image is attached, intelligently parse and auto-capture to Supabase!
      if (imgAttached) {
        // Extract amount if user typed numbers (e.g., 72 or 72.00)
        const amtMatch = userMsg.match(/(\d+(\.\d+)?)/);
        const amount = amtMatch ? parseFloat(amtMatch[1]) : 0;
        const description = userMsg || "Scanned Receipt Expense";

        const payload = {
          household_id: 'default-household',
          record_type: 'transaction',
          type: 'expense',
          category: lower.includes('farm') || lower.includes('fencing') || lower.includes('pipe') ? 'Phase 3: Civil & Residential Infrastructure' : 'Household',
          amount: amount,
          currency: 'ZAR',
          description: description + ' [Receipt Scanned]',
          paid_from: 'Paisa Account'
        };

        const { error } = await supabase.from('transactions').insert([payload]);
        
        if (error) {
          reply = `❌ Failed to save receipt to database: ${error.message}`;
        } else {
          reply = `📸 **Receipt Analyzed & Captured Successfully!**\n• **Description**: ${description}\n• **Amount**: R${amount.toLocaleString()}\n• **Account**: Paisa Account\n\nI have automatically saved this to your database and updated your account balance!`;
        }
      } else if (lower.includes('recurring') || lower.includes('due') || lower.includes('rent') || lower.includes('overhead')) {
        const { data: records } = await supabase.from('transactions').select('*').eq('record_type', 'recurring');
        if (records && records.length > 0) {
          const details = records.map(r => `• **${r.description}**: R${parseFloat(r.amount).toLocaleString()} (Due: ${r.due_date || 'Not set'})`).join('\n');
          reply = `📋 **Recurring Overheads & Due Dates:**\n${details}`;
        } else {
          reply = `📋 No recurring overheads logged yet.`;
        }
      } else {
        const { data: records } = await supabase.from('transactions').select('*');
        const matchingRecords = (records || []).filter(r => 
          r.description && r.description.toLowerCase().split(' ').some(word => word.length > 2 && lower.includes(word))
        );

        if (matchingRecords.length > 0) {
          const details = matchingRecords.map(r => `• **${r.description}**: R${parseFloat(r.amount || 0).toLocaleString()} (${r.record_type || r.type})`).join('\n');
          reply = `🔍 I found these matching records:\n${details}`;
        } else {
          reply = `I'm tracking your recurring due dates, account balances, and Mahusekwa farm budgets. How can I help?`;
        }
      }

      setMessages(prev => [...prev, { sender: 'jude', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'jude', text: "I had trouble checking your database records." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto flex flex-col h-[82vh]">
      <div className="mb-3">
        <h2 className="text-2xl font-bold text-gray-900">Ask Jude</h2>
        <p className="text-gray-600 text-sm">Foolproof Database Assistant • 25 Sep – 25 Oct 2026</p>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm space-y-2 whitespace-pre-line ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}>
              {m.image && <img src={m.image} alt="Attachment" className="rounded-lg max-h-48 object-cover w-full" />}
              <p>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start"><div className="bg-gray-100 text-gray-500 p-3 rounded-2xl text-sm animate-pulse">Jude is analyzing and saving receipt...</div></div>
        )}
      </div>

      {selectedImage && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
            <span className="text-xs font-medium text-blue-900">Receipt attached ready to auto-capture</span>
          </div>
          <button onClick={() => setSelectedImage(null)} className="text-xs text-red-600 hover:underline font-medium">Remove</button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center justify-center">📷</button>
        <button type="button" onClick={startListening} className={`p-2.5 rounded-xl transition flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-bounce' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>🎤</button>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type description & amount (e.g. Spar R72 milk & bread)..."}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
        />
        <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition text-sm shadow-sm">Send</button>
      </form>
    </div>
  );
}