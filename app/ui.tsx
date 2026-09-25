'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Connect directly to Supabase so it's always ready
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
  // audio or speech helper placeholder
}

function Home({ supabase, householdId }: { supabase: any; householdId: string }) {
  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Home Dashboard</h2>
      <p className="text-gray-600">Welcome to your operational overview.</p>
    </div>
  );
}

function Capture() {
  const householdId = 'default-household';
  const [captureType, setCaptureType] = useState('transaction'); // 'transaction' | 'loan' | 'milestone'

  // Transaction states
  const [type, setType] = useState('expense');
  const [currency, setCurrency] = useState('ZAR');
  const [category, setCategory] = useState('Farm');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Loan states
  const [loanParty, setLoanParty] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('borrowed'); // 'borrowed' | 'lent'

  // Milestone states
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      const payload = {
        household_id: householdId || 'default-household',
        record_type: captureType,
        type: captureType === 'transaction' ? type : captureType === 'loan' ? loanType : 'milestone',
        category: captureType === 'transaction' ? category : captureType === 'milestone' ? milestoneProject : 'Loan',
        currency: currency,
        amount: captureType === 'transaction' ? parseFloat(amount) || 0 : captureType === 'loan' ? parseFloat(loanAmount) || 0 : 0,
        description: captureType === 'transaction' ? description : captureType === 'loan' ? `Loan with ${loanParty}` : milestoneTitle,
        counterparty: captureType === 'loan' ? loanParty : null,
        target_date: captureType === 'milestone' ? milestoneDate : null,
      };

      const { error } = await supabase.from('transactions').insert([payload]);

      if (error) throw error;

      setLoading(false);
      setSuccessMessage(`${captureType.charAt(0).toUpperCase() + captureType.slice(1)} saved to Supabase successfully!`);
      
      // Reset fields
      setDescription('');
      setAmount('');
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
      <p className="text-gray-600 mb-6">Log multi-currency financials (ZAR, USD, EUR), track loans, or record milestones.</p>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="flex rounded-lg bg-gray-200 p-1 mb-6">
        <button
          type="button"
          onClick={() => setCaptureType('transaction')}
          className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition ${captureType === 'transaction' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Transaction
        </button>
        <button
          type="button"
          onClick={() => setCaptureType('loan')}
          className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition ${captureType === 'loan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Loan Tracking
        </button>
        <button
          type="button"
          onClick={() => setCaptureType('milestone')}
          className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition ${captureType === 'milestone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Milestone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
        
        {/* TRANSACTION FORM FIELDS */}
        {captureType === 'transaction' && (
          <>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Income
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="Farm">Farm (Mahusekwa)</option>
                  <option value="Household">Household (Hout Bay)</option>
                  <option value="Business">Business / Operations</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Greenhouse mesh, broiler feed, fiber internet" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900" 
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900" 
              />
            </div>
          </>
        )}

        {/* LOAN TRACKING FORM FIELDS */}
        {captureType === 'loan' && (
          <>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setLoanType('borrowed')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${loanType === 'borrowed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Borrowed / Liability
              </button>
              <button
                type="button"
                onClick={() => setLoanType('lent')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${loanType === 'lent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
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
                placeholder="e.g. Bank, Vehicle Finance, Partner" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="ZAR">ZAR (R)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount ({getCurrencySymbol(currency)})</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="0.00" 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900" 
                />
              </div>
            </div>
          </>
        )}

        {/* MILESTONE FORM FIELDS */}
        {captureType === 'milestone' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project / Focus Area</label>
              <select 
                value={milestoneProject} 
                onChange={(e) => setMilestoneProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                placeholder="e.g. Greenhouse structure completed, Car loan milestone" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
              <input 
                type="date" 
                value={milestoneDate}
                onChange={(e) => setMilestoneDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" 
              />
            </div>
          </>
        )}

        {/* Submit Button */}
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

function Transactions({ supabase, householdId }: { supabase: any; householdId: string }) {
  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Transactions</h2>
      <p className="text-gray-600">Financial records will appear here.</p>
    </div>
  );
}

function Zimbabwe({ txs, onSave }: { txs: any[]; onSave: (x: any) => void }) {
  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Zimbabwe Project</h2>
      <p className="text-gray-600">Mahusekwa farm estate updates will appear here.</p>
    </div>
  );
}

function Assistant({ supabase, householdId }: { supabase: any; householdId: string }) {
  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Ask Jude</h2>
      <p className="text-gray-600">Your AI assistant interface will appear here.</p>
    </div>
  );
}

export default function AppShell({ supabase, householdId }: { supabase: any; householdId: string }) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hey Jude</h1>
          <p className="text-xs text-gray-500">Cunningham &amp; Lynne</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pb-12">
        {activeTab === 'home' && <Home supabase={supabase} householdId={householdId} />}
        {activeTab === 'capture' && <Capture supabase={supabase} householdId={householdId} />}
        {activeTab === 'transactions' && <Transactions supabase={supabase} householdId={householdId} />}
        {activeTab === 'zimbabwe' && <Zimbabwe txs={[]} onSave={() => {}} />}
        {activeTab === 'assistant' && <Assistant supabase={supabase} householdId={householdId} />}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-2 shadow-xl z-50">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-16 py-1 text-xs font-medium transition-colors ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <span className="text-base mb-0.5">🏠</span>
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('capture')}
          className={`flex flex-col items-center justify-center w-16 py-1 text-xs font-medium transition-colors ${activeTab === 'capture' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <span className="text-base mb-0.5">➕</span>
          <span>Capture</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center w-16 py-1 text-xs font-medium transition-colors ${activeTab === 'transactions' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <span className="text-base mb-0.5">💳</span>
          <span>Money</span>
        </button>
        <button
          onClick={() => setActiveTab('zimbabwe')}
          className={`flex flex-col items-center justify-center w-16 py-1 text-xs font-medium transition-colors ${activeTab === 'zimbabwe' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <span className="text-xs font-bold mb-0.5 px-1 bg-gray-100 rounded text-gray-700">ZW</span>
          <span>Zimbabwe</span>
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center justify-center w-16 py-1 text-xs font-medium transition-colors ${activeTab === 'assistant' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <span className="text-base mb-0.5">✨</span>
          <span>Ask Jude</span>
        </button>
      </nav>
    </div>
  );
}