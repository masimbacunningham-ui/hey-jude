'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mupfyayteoldumljgguu.supabase.co';
const supabaseAnonKey = 'sb_publishable_tvzTzSsQ8rsMHP6esPI1pg_r9_L4g6n';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'zimbabwe' | 'capture' | 'askjude'>('home');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Phase Progress State for Milestone Tracking
  const [phaseProgress, setPhaseProgress] = useState<{ [key: number]: number }>({
    1: 100, // Phase 1: Site Acquisition & Survey
    2: 75,  // Phase 2: Perimeter & Security Infrastructure
    3: 45,  // Phase 3: Residential & Utilities Setup
    4: 15,  // Phase 4: Greenhouse Tunnels & Horticulture
    5: 0,   // Phase 5: Poultry & Broiler Units
    6: 0    // Phase 6: Piggery & Integrated Swine Production
  });

  // Capture Form State
  const [recordType, setRecordType] = useState<'transaction' | 'loan'>('transaction');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('Household');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [description, setDescription] = useState('');
  const [paidFrom, setPaidFrom] = useState('Paisa Account');
  const [loanType, setLoanType] = useState<'borrowed' | 'lent'>('borrowed');
  const [counterparty, setCounterparty] = useState('');

  // Ask Jude State
  const [askInput, setAskInput] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'jude'; text: string }[]>([
    { sender: 'jude', text: "Hello! I'm Jude, your executive financial assistant. Ask me anything about your cash flow, account balances, or Mahusekwa farm development." }
  ]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecords(data);
    }
    setLoading(false);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) {
      alert('Please fill in the amount and description.');
      return;
    }

    const payload = {
      household_id: 'default-household',
      record_type: recordType,
      type: recordType === 'loan' ? (loanType === 'borrowed' ? 'income' : 'expense') : type,
      category: recordType === 'loan' ? 'Loan' : category,
      amount: parseFloat(amount),
      currency: currency,
      description: description,
      paid_from: paidFrom,
      counterparty: recordType === 'loan' ? counterparty : null,
      repaid_amount: recordType === 'loan' ? 0 : null
    };

    const { error } = await supabase.from('transactions').insert([payload]);

    if (!error) {
      alert('Successfully recorded!');
      setAmount('');
      setDescription('');
      setCounterparty('');
      fetchRecords();
      setActiveTab('dashboard');
    } else {
      alert('Error saving record: ' + error.message);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      fetchRecords();
    } else {
      alert('Error deleting: ' + error.message);
    }
  };

  const handleAskJude = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;

    const userQuery = askInput;
    setChatLog((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setAskInput('');

    const lower = userQuery.toLowerCase();
    let responseText = "I've processed your query across your financial records.";

    if (lower.includes('fuel') || lower.includes('petrol')) {
      const totalFuel = records
        .filter(r => r.description?.toLowerCase().includes('fuel') || r.description?.toLowerCase().includes('petrol'))
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      responseText = `Your total recorded fuel expenses amount to R${totalFuel.toLocaleString()}.`;
    } else if (lower.includes('coffee')) {
      const totalCoffee = records
        .filter(r => r.description?.toLowerCase().includes('coffee'))
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      responseText = `Your total recorded coffee spend is R${totalCoffee.toLocaleString()}.`;
    } else if (lower.includes('farm') || lower.includes('mahusekwa')) {
      const farmSpend = records
        .filter(r => r.category?.toLowerCase().includes('infrastructure') || r.description?.toLowerCase().includes('farm'))
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      responseText = `Total capital allocated toward the Mahusekwa farm development is R${farmSpend.toLocaleString()}.`;
    } else {
      responseText = `I analyzed your query: "${userQuery}". You currently have ${records.length} items logged in your ledger.`;
    }

    setChatLog((prev) => [...prev, { sender: 'jude', text: responseText }]);
  };

  const updatePhaseProgress = (phaseNum: number) => {
    const val = prompt(`Enter progress percentage for Phase ${phaseNum} (0 to 100):`, phaseProgress[phaseNum].toString());
    if (val === null) return;
    const num = parseInt(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setPhaseProgress(prev => ({ ...prev, [phaseNum]: num }));
    } else {
      alert("Please enter a valid number between 0 and 100.");
    }
  };

  const loansList = records.filter(r => r.record_type === 'loan');
  const transactionsList = records.filter(r => r.record_type === 'transaction');

  const totalExpenses = transactionsList
    .filter(r => r.type === 'expense')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const totalInflows = transactionsList
    .filter(r => r.type === 'income')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const farmOverhead = transactionsList
    .filter(r => r.category?.includes('Infrastructure') || r.category?.includes('Farm'))
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const householdLiving = transactionsList
    .filter(r => r.category === 'Household' || r.category === 'Groceries')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  // Calculate Live Account Balances
  const accountsList = ['Paisa Account', 'Absa Account', "Lynne's Mukuru Account", 'Your Mukuru Account (Joint Savings)'];
  const accountBalances = accountsList.map(accName => {
    const accTxs = transactionsList.filter(t => t.paid_from === accName);
    const balance = accTxs.reduce((sum, t) => {
      const val = parseFloat(t.amount) || 0;
      return t.type === 'income' ? sum + val : sum - val;
    }, 0);
    return { name: accName, balance };
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white font-extrabold w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm">
              HJ
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Hey Jude</h1>
              <p className="text-xs text-gray-500">Executive Financial Intelligence</p>
            </div>
          </div>
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'home' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Money Dashboard
            </button>
            <button
              onClick={() => setActiveTab('zimbabwe')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'zimbabwe' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Mahusekwa / Zim
            </button>
            <button
              onClick={() => setActiveTab('capture')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'capture' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Capture Entry
            </button>
            <button
              onClick={() => setActiveTab('askjude')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'askjude' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Ask Jude
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-black">Welcome back, Cunningham</h2>
              <p className="text-blue-100 mt-2 text-sm max-w-2xl">
                Your executive financial hub and Mahusekwa farm development command center. Track your cash flows, manage loan repayments, and oversee off-grid infrastructure seamlessly.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-1">Money Dashboard</h3>
                <p className="text-xs text-gray-500 mb-4">View account balances, ledger history, and active loan repayment progress bars.</p>
                <button onClick={() => setActiveTab('dashboard')} className="text-xs bg-blue-50 text-blue-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-blue-100 transition">Open Dashboard →</button>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-1">Mahusekwa Farm Project</h3>
                <p className="text-xs text-gray-500 mb-4">Review agricultural capital allocations, the 6 development phases, and milestone tracking bars.</p>
                <button onClick={() => setActiveTab('zimbabwe')} className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition">View Zim Farm →</button>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-1">Ask Jude AI</h3>
                <p className="text-xs text-gray-500 mb-4">Query your transactions in plain language for instant financial intelligence.</p>
                <button onClick={() => setActiveTab('askjude')} className="text-xs bg-gray-100 text-gray-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-gray-200 transition">Start Chat →</button>
              </div>
            </div>
          </div>
        )}

        {/* MONEY DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Live Accounts Overview */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Account Balances</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {accountBalances.map((acc, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 truncate">{acc.name}</p>
                    <h4 className={`text-xl font-black mt-1 ${acc.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      R{acc.balance.toLocaleString()}
                    </h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Inflows</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1">R{totalInflows.toLocaleString()}</h3>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Outflows</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">R{totalExpenses.toLocaleString()}</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">25th-to-25th Billing Cycle</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Household Living</p>
                <h3 className="text-2xl font-black text-blue-600 mt-1">R{householdLiving.toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mt-1">Groceries, Utilities & Living</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mahusekwa Farm Dev</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">R{farmOverhead.toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mt-1">Phases 1–6 Infrastructure</p>
              </div>
            </div>

            {/* Loan & Debt Payoff Tracker Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">Loan & Debt Payoff Tracker</h3>
                  <p className="text-xs text-gray-500">Monitor borrowed funds, lent amounts, and partial repayment progress.</p>
                </div>
              </div>
              {loansList.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No active loans logged. Use the Capture tab to add a loan!</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {loansList.map((loan) => {
                    const totalLoanAmt = parseFloat(loan.amount) || 0;
                    const repaidAmt = parseFloat(loan.repaid_amount) || 0;
                    const remainingAmt = Math.max(0, totalLoanAmt - repaidAmt);
                    const progressPct = totalLoanAmt > 0 ? Math.min(100, Math.round((repaidAmt / totalLoanAmt) * 100)) : 0;

                    const handleAddRepayment = async () => {
                      const paymentStr = prompt(`Enter repayment amount for ${loan.description} (${loan.currency || 'ZAR'}):`, "100");
                      if (!paymentStr) return;
                      const paymentVal = parseFloat(paymentStr);
                      if (isNaN(paymentVal) || paymentVal <= 0) return;

                      const accountChoice = prompt("Which account was this paid from?\n1. Paisa Account\n2. Absa Account\n3. Lynne's Mukuru Account\n4. Your Mukuru Account (Joint Savings)", "Paisa Account");
                      if (!accountChoice) return;

                      let selectedAccount = "Paisa Account";
                      if (accountChoice === "2" || accountChoice.toLowerCase().includes("absa")) selectedAccount = "Absa Account";
                      else if (accountChoice === "3" || accountChoice.toLowerCase().includes("lynne")) selectedAccount = "Lynne's Mukuru Account";
                      else if (accountChoice === "4" || accountChoice.toLowerCase().includes("joint")) selectedAccount = "Your Mukuru Account (Joint Savings)";

                      const newRepaidTotal = repaidAmt + paymentVal;
                      
                      const { error } = await supabase
                        .from('transactions')
                        .update({ repaid_amount: newRepaidTotal })
                        .eq('id', loan.id);

                      await supabase.from('transactions').insert([{
                        household_id: 'default-household',
                        record_type: 'transaction',
                        type: 'expense',
                        category: 'Loan Repayment',
                        amount: paymentVal,
                        currency: loan.currency || 'ZAR',
                        description: `Repayment for ${loan.description} (${loan.counterparty})`,
                        paid_from: selectedAccount
                      }]);

                      if (!error) {
                        fetchRecords();
                      } else {
                        alert("Error updating repayment: " + error.message);
                      }
                    };

                    return (
                      <div key={loan.id} className="p-6 space-y-4">
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
                              <span className="text-sm font-extrabold text-gray-900">
                                Total: {loan.currency === 'EUR' ? '€' : loan.currency === 'USD' ? '$' : 'R'}{totalLoanAmt.toLocaleString()}
                              </span>
                              <p className="text-xs text-emerald-600 font-semibold">Repaid: {loan.currency === 'EUR' ? '€' : loan.currency === 'USD' ? '$' : 'R'}{repaidAmt.toLocaleString()}</p>
                            </div>
                            <button 
                              onClick={handleAddRepayment} 
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3.5 py-2 rounded-xl transition border border-emerald-200 shadow-sm"
                            >
                              + Log Repayment
                            </button>
                            <button onClick={() => handleDeleteRecord(loan.id)} className="text-xs bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-3 py-2 rounded-xl transition">Delete</button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-gray-600">
                            <span>Progress: {progressPct}% Paid Back</span>
                            <span>Remaining Balance: {loan.currency === 'EUR' ? '€' : loan.currency === 'USD' ? '$' : 'R'}{remainingAmt.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Ledger & Transaction History</h3>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading records...</div>
              ) : transactionsList.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No transactions logged yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Account</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {transactionsList.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-medium text-gray-900">{tx.description}</td>
                          <td className="px-6 py-4 text-gray-600">{tx.category}</td>
                          <td className="px-6 py-4 text-gray-600">{tx.paid_from}</td>
                          <td className={`px-6 py-4 font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {tx.type === 'income' ? '+' : '-'}{tx.currency === 'EUR' ? '€' : tx.currency === 'USD' ? '$' : 'R'}{parseFloat(tx.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteRecord(tx.id)} className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAHUSEKWA / ZIMBABWE TAB (Full 6 Phases & Milestone Progress Tracking) */}
        {activeTab === 'zimbabwe' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mahusekwa Farm Development (Mashonaland East)</h2>
                  <p className="text-sm text-gray-500">Greenfield agricultural plot operations (5,000 sqm), protected greenhouses, and livestock integration.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Project Phases & Milestone Progress Tracker</h3>
                  <span className="text-xs text-gray-500">Click "Update %" on any phase to adjust milestone completion</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { num: 1, title: "Site Acquisition & Survey", desc: "Plot demarcations, initial land clearing, and title verification on 5,000 sqm greenfield plot." },
                    { num: 2, title: "Perimeter & Security Infrastructure", desc: "Boundary fencing, secure gate installation, and vehicle access pathway development." },
                    { num: 3, title: "Residential & Utilities Setup", desc: "Two-bedroom residential building roofing and interior finishes, borehole water system, and solar power setup." },
                    { num: 4, title: "Greenhouse Tunnels & Horticulture", desc: "Protected greenhouse tunnel construction, drip irrigation systems, and commercial crop plantation." },
                    { num: 5, title: "Poultry & Broiler Units", desc: "Construction of broiler chicken housing, feeding systems, and bio-security protocols." },
                    { num: 6, title: "Piggery & Integrated Swine Production", desc: "Swine production pens, waste management integration, and full commercial scaling under farm management." }
                  ].map((phase) => {
                    const p = phaseProgress[phase.num];
                    return (
                      <div key={phase.num} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">Phase {phase.num}</span>
                            <button 
                              onClick={() => updatePhaseProgress(phase.num)}
                              className="text-xs bg-white hover:bg-gray-100 text-blue-600 font-semibold px-2.5 py-1 rounded-lg border border-gray-200 transition shadow-sm"
                            >
                              Update %
                            </button>
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm">{phase.title}</h4>
                          <p className="text-xs text-gray-600">{phase.desc}</p>
                        </div>

                        {/* Milestone Progress Bar */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                          <div className="flex justify-between text-xs font-semibold text-gray-600">
                            <span>Milestone Progress</span>
                            <span className="text-blue-600 font-bold">{p}% Completed</span>
                          </div>
                          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${p}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAPTURE TAB */}
        {activeTab === 'capture' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Capture New Financial Entry</h2>
            <form onSubmit={handleCreateRecord} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Record Type</label>
                  <select value={recordType} onChange={(e) => setRecordType(e.target.value as any)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                    <option value="transaction">Transaction (Expense/Income)</option>
                    <option value="loan">Loan / Borrowing</option>
                  </select>
                </div>
                {recordType === 'transaction' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Flow Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Loan Direction</label>
                    <select value={loanType} onChange={(e) => setLoanType(e.target.value as any)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                      <option value="borrowed">Borrowed Funds</option>
                      <option value="lent">Lent Out</option>
                    </select>
                  </div>
                )}
              </div>

              {recordType === 'transaction' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                    <option value="Household">Household Living</option>
                    <option value="Phase 3: Civil & Residential Infrastructure">Mahusekwa Farm Dev (Phase 3)</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Transport">Transport & Fuel</option>
                    <option value="Overheads">Recurring Overheads</option>
                    <option value="Personal">Personal / Tips</option>
                  </select>
                </div>
              )}

              {recordType === 'loan' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Counterparty (Lender / Borrower Name)</label>
                  <input type="text" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="e.g. Bank or Friend" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Amount</label>
                  <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                    <option value="ZAR">ZAR (R)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Fencing wire and borehole pipes" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Account / Source</label>
                <select value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                  <option value="Paisa Account">Paisa Account</option>
                  <option value="Absa Account">Absa Account</option>
                  <option value="Lynne's Mukuru Account">Lynne's Mukuru Account</option>
                  <option value="Your Mukuru Account (Joint Savings)">Your Mukuru Account (Joint Savings)</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition">
                Save Record
              </button>
            </form>
          </div>
        )}

        {/* ASK JUDE TAB */}
        {activeTab === 'askjude' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[650px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center space-x-3">
              <div className="bg-blue-600 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                HJ
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Ask Jude Intelligence</h3>
                <p className="text-xs text-gray-500">Natural language reasoning across your ledger and loans</p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatLog.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAskJude} className="p-4 border-t border-gray-100 bg-white flex space-x-3">
              <input
                type="text"
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                placeholder="Ask e.g. 'What is my total fuel spend?' or 'Show farm expenses'"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm">
                Ask
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}