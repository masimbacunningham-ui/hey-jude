'use client';

import { useState, useEffect } from 'react';
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
        {activeTab === 'zimbabwe' && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">Mahusekwa Farm & Zimbabwe</h2>
            <p className="text-gray-600">Farm infrastructure and project updates.</p>
          </div>
        )}
        {activeTab === 'ask jude' && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">Ask Jude</h2>
            <p className="text-gray-600">Your AI assistant and advisor.</p>
          </div>
        )}
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
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Calculate balances per account based on transactions & transfers
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
      if (item.type === 'income' && source && accountBalances[source] !== undefined) {
        accountBalances[source] += amt;
      } else if (item.type === 'expense' && source && accountBalances[source] !== undefined) {
        accountBalances[source] -= amt;
      }
    } else if (item.record_type === 'transfer') {
      if (source && accountBalances[source] !== undefined) {
        accountBalances[source] -= amt;
      }
      if (dest && accountBalances[dest] !== undefined) {
        accountBalances[dest] += amt;
      }
    } else if (item.record_type === 'loan') {
      // If a loan expense was paid from an account, deduct it
      if (item.type === 'borrowed' && source && accountBalances[source] !== undefined) {
        accountBalances[source] += amt; // Cash in from loan
      }
    }
  });

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Money Dashboard</h2>
          <p className="text-gray-600 text-sm">Account balances and financial overview.</p>
        </div>
        <button 
          onClick={fetchRecords} 
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Account Balances Overview */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Managed Accounts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">Primary Income</span>
            <h4 className="font-bold text-gray-900 text-lg mt-2">Paisa Account</h4>
            <p className="text-xs text-gray-500 mb-3">Salary & Tips</p>
            <p className="text-2xl font-extrabold text-gray-900">R{accountBalances['Paisa Account'].toLocaleString()}</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">Side Hustle</span>
            <h4 className="font-bold text-gray-900 text-lg mt-2">Absa Account</h4>
            <p className="text-xs text-gray-500 mb-3">Driving Income & Liquidity</p>
            <p className="text-2xl font-extrabold text-gray-900">R{accountBalances['Absa Account'].toLocaleString()}</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-semibold">Partner Income</span>
            <h4 className="font-bold text-gray-900 text-lg mt-2">Lynne's Mukuru Account</h4>
            <p className="text-xs text-gray-500 mb-3">Lynne's Income & Remittance</p>
            <p className="text-2xl font-extrabold text-gray-900">R{accountBalances["Lynne's Mukuru Account"].toLocaleString()}</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">Savings & Remittance</span>
            <h4 className="font-bold text-gray-900 text-lg mt-2">Your Mukuru Account</h4>
            <p className="text-xs text-gray-500 mb-3">Joint Savings & Cross-Border</p>
            <p className="text-2xl font-extrabold text-gray-900">R{accountBalances['Your Mukuru Account (Joint Savings)'].toLocaleString()}</p>
          </div>

        </div>
      </div>

      {/* Recent Records Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Recent Activity & Logs</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading financial records...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No records found yet. Head over to the Capture tab to add your first entry!</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((item) => (
              <div key={item.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${item.record_type === 'transfer' ? 'bg-blue-100 text-blue-700' : item.record_type === 'loan' ? 'bg-purple-100 text-purple-700' : item.type === 'income' ? 'bg-green-100 text-green-750' : 'bg-amber-100 text-amber-800'}`}>
                      {item.record_type === 'transfer' ? 'Transfer' : item.record_type === 'loan' ? `Loan (${item.type})` : item.type}
                    </span>
                    <span className="text-xs text-gray-500 uppercase">{item.category}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{item.description}</p>
                  <p className="text-xs text-gray-500">
                    {item.record_type === 'transfer' ? `From ${item.paid_from} ➔ To ${item.transfer_to}` : `Paid from: ${item.paid_from || 'General'}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${item.type === 'income' || item.record_type === 'transfer' ? 'text-green-600' : 'text-gray-900'}`}>
                    {item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : 'R'}{parseFloat(item.amount || 0).toLocaleString()}
                  </span>
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

function Capture() {
  const householdId = 'default-household';
  const [captureType, setCaptureType] = useState('transaction');

  const accountsList = [
    'Paisa Account',
    'Absa Account',
    "Lynne's Mukuru Account",
    'Your Mukuru Account (Joint Savings)',
  ];

  const [type, setType] = useState('expense');
  const [currency, setCurrency] = useState('ZAR');
  const [category, setCategory] = useState('Farm');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidFrom, setPaidFrom] = useState('Paisa Account');

  // Transfer specific state
  const [transferFrom, setTransferFrom] = useState('Paisa Account');
  const [transferTo, setTransferTo] = useState('Absa Account');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  // Loan specific state
  const [loanParty, setLoanParty] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('borrowed');

  // Milestone specific state
  const [milestoneProject, setMilestoneProject] = useState('Mahusekwa Farm');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getCurrencySymbol = (curr: string) => {
    if (curr === 'USD') return '$';
    if (curr === 'EUR') return '€';
    return 'R';
  };

  // Auto-assign default account when transaction type changes
  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'income') {
      setPaidFrom('Paisa Account'); // Default salary & tips
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      let payload: any = {
        household_id: householdId,
        record_type: captureType,
        currency: currency,
      };

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
      
      setDescription('');
      setAmount('');
      setTransferAmount('');
      setTransferDesc('');
      setLoanParty('');
      setLoanAmount('');
      setMilestoneTitle('');
      setMilestoneDate('');

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Error saving to Supabase:', err);
      setLoading(false);
      setSuccessMessage(`Error: ${err.message || 'Could not save record.'}`);
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-1 text-gray-900">Capture & Record</h2>
      <p className="text-gray-600 mb-6">Log income, expenses, account transfers, loans, or milestones.</p>
      
      {successMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${successMessage.startsWith('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {successMessage}
        </div>
      )}

      {/* Capture Type Selector Tabs */}
      <div className="grid grid-cols-4 rounded-lg bg-gray-200 p-1 mb-6 text-xs sm:text-sm font-medium">
        <button
          type="button"
          onClick={() => setCaptureType('transaction')}
          className={`py-2 rounded-md transition ${captureType === 'transaction' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
        >
          Transaction
        </button>
        <button
          type="button"
          onClick={() => setCaptureType('transfer')}
          className={`py-2 rounded-md transition ${captureType === 'transfer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
        >
          Transfer
        </button>
        <button
          type="button"
          onClick={() => setCaptureType('loan')}
          className={`py-2 rounded-md transition ${captureType === 'loan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
        >
          Loan
        </button>
        <button
          type="button"
          onClick={() => setCaptureType('milestone')}
          className={`py-2 rounded-md transition ${captureType === 'milestone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
        >
          Milestone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
        
        {captureType === 'transaction' && (
          <>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                Income (Salary / Tips / Side Hustle)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="ZAR">ZAR (R)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="Farm">Farm (Mahusekwa)</option>
                  <option value="Household">Household (Hout Bay)</option>
                  <option value="Business">Business / Operations</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid From / Received Into Account</label>
              <select 
                value={paidFrom} 
                onChange={(e) => setPaidFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white font-medium"
              >
                {accountsList.map((acc) => (
                  <option key={acc} value={acc}>{acc} {acc.includes('Paisa') ? '(Salary/Tips)' : acc.includes('Absa') ? '(Driving/Side Hustle)' : acc.includes("Lynne") ? "(Lynne's Income)" : '(Joint Savings)'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly Salary, Driving tips, Greenhouse mesh" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({getCurrencySymbol(currency)})</label>
              <input 
                type="number" 
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" 
              />
            </div>
          </>
        )}

        {captureType === 'transfer' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer From</label>
                <select 
                  value={transferFrom} 
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  {accountsList.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To</label>
                <select 
                  value={transferTo} 
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  {accountsList.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (R)</label>
              <input 
                type="number" 
                step="0.01"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.00" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note / Reference (Optional)</label>
              <input 
                type="text" 
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
                placeholder="e.g. Monthly savings contribution" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" 
              />
            </div>
          </>
        )}

        {captureType === 'loan' && (
          <>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setLoanType('borrowed')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${loanType === 'borrowed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                Borrowed / Liability
              </button>
              <button
                type="button"
                onClick={() => setLoanType('lent')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${loanType === 'lent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                Lent / Receivable
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Counterparty (Lender / Borrower)</label>
              <input 
                type="text" 
                value={loanParty}
                onChange={(e) => setLoanParty(e.target.value)}
                placeholder="e.g. Bank, Partner" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid From / Routed Through Account</label>
              <select 
                value={paidFrom} 
                onChange={(e) => setPaidFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                {accountsList.map((acc) => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="ZAR">ZAR (R)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="0.00" 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" 
                />
              </div>
            </div>
          </>
        )}

        {captureType === 'milestone' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project / Focus Area</label>
              <select 
                value={milestoneProject} 
                onChange={(e) => setMilestoneProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="Mahusekwa Farm">Mahusekwa Farm Infrastructure</option>
                <option value="Hout Bay Residence">Hout Bay Setup</option>
                <option value="Business Operations">Business & Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title</label>
              <input 
                type="text" 
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="e.g. Greenhouse structure completed" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
              <input 
                type="date" 
                value={milestoneDate}
                onChange={(e) => setMilestoneDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" 
              />
            </div>
          </>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
        >
          {loading ? 'Saving...' : `Save ${captureType.charAt(0).toUpperCase() + captureType.slice(1)}`}
        </button>
      </form>
    </div>
  );
}