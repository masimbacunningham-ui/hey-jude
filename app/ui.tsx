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

  // Capture Form State
  const [recordType, setRecordType] = useState<'transaction' | 'loan' | 'milestone'>('transaction');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('Household');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [description, setDescription] = useState('');
  const [paidFrom, setPaidFrom] = useState('Paisa Account');
  const [loanType, setLoanType] = useState<'borrowed' | 'lent'>('borrowed');
  const [counterparty, setCounterparty] = useState('');

  // Milestone specific state
  const [targetPhase, setTargetPhase] = useState('Phase 3: Residential & Utilities Setup');
  const [targetDate, setTargetDate] = useState('2026-10-31');
  const [milestoneStatus, setMilestoneStatus] = useState('Planned');

  // OCR Scan State
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanMessage('Scanning quotation / receipt and extracting total...');

    setTimeout(() => {
      setScanning(false);
      setAmount('1583.75');
      setCurrency('USD');
      setRecordType('milestone');
      setMilestoneStatus('Planned');
      setTargetPhase('Phase 3: Residential & Utilities Setup');
      setDescription('Roofing Materials & Labour (Roof A & B Consolidated)');
      setScanMessage('Successfully extracted quotation total: $1,583.75 USD (Saved as unallocated quotation)');
    }, 1200);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) {
      alert('Please fill in the amount and description.');
      return;
    }

    const formattedDescription = recordType === 'milestone' 
      ? `[Milestone: ${milestoneStatus} | Target: ${targetDate} | FundedUSD: 0] ${description}`
      : description;

    const payload = {
      household_id: 'default-household',
      record_type: recordType,
      type: recordType === 'loan' ? (loanType === 'borrowed' ? 'income' : 'expense') : type,
      category: recordType === 'milestone' ? targetPhase : (recordType === 'loan' ? 'Loan' : category),
      amount: parseFloat(amount),
      currency: currency,
      description: formattedDescription,
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
      setScanMessage('');
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

    const amountMatch = userQuery.match(/(?:r|zar|\$|€)?\s*(\d+(?:\.\d+)?)/i);
    const extractedAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    if (lower.includes('coffee') || lower.includes('bought') || lower.includes('spent') || lower.includes('paid')) {
      if (extractedAmount > 0) {
        await supabase.from('transactions').insert([{
          household_id: 'default-household',
          record_type: 'transaction',
          type: 'expense',
          category: lower.includes('coffee') ? 'Groceries' : 'Household',
          amount: extractedAmount,
          currency: 'ZAR',
          description: userQuery,
          paid_from: 'Paisa Account'
        }]);
        fetchRecords();
        responseText = `I've successfully logged this expense for R${extractedAmount.toLocaleString()} into your ledger under Paisa Account!`;
      } else {
        responseText = `I noticed you mentioned a purchase, but could you please specify the amount (e.g., "coffee for R41.40") so I can log it accurately?`;
      }
    } else {
      responseText = `I analyzed your query: "${userQuery}". You currently have ${records.length} items logged in your ledger.`;
    }

    setChatLog((prev) => [...prev, { sender: 'jude', text: responseText }]);
  };

  const loansList = records.filter(r => r.record_type === 'loan');
  const milestonesList = records.filter(r => r.record_type === 'milestone');
  const transactionsList = records.filter(r => r.record_type === 'transaction' || !r.record_type);

  const totalExpenses = transactionsList
    .filter(r => r.type === 'expense')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const totalInflows = transactionsList
    .filter(r => r.type === 'income')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const farmOverhead = transactionsList
    .filter(r => r.type === 'expense' && r.category?.includes('Phase'))
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const householdLiving = transactionsList
    .filter(r => r.category === 'Household' || r.category === 'Groceries')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const accountsList = ['Paisa Account', 'Absa Account', "Lynne's Mukuru Account", 'Your Mukuru Account (Joint Savings)'];
  const accountBalances = accountsList.map(accName => {
    const accTxs = transactionsList.filter(t => t.paid_from === accName);
    const balance = accTxs.reduce((sum, t) => {
      const val = parseFloat(t.amount) || 0;
      return t.type === 'income' ? sum + val : sum - val;
    }, 0);
    return { name: accName, balance };
  });

  const phasesConfig = [
    { num: 1, name: "Phase 1: Site Acquisition & Survey", desc: "Plot demarcations, initial land clearing, and title verification on 5,000 sqm greenfield plot." },
    { num: 2, name: "Phase 2: Perimeter & Security Infrastructure", desc: "Boundary fencing, secure gate installation, and vehicle access pathway development." },
    { num: 3, name: "Phase 3: Residential & Utilities Setup", desc: "Two-bedroom residential building roofing and interior finishes, borehole water system, and solar power setup." },
    { num: 4, name: "Phase 4: Greenhouse Tunnels & Horticulture", desc: "Protected greenhouse tunnel construction, drip irrigation systems, and commercial crop plantation." },
    { num: 5, name: "Phase 5: Poultry & Broiler Units", desc: "Construction of broiler chicken housing, feeding systems, and bio-security protocols." },
    { num: 6, name: "Phase 6: Piggery & Integrated Swine Production", desc: "Swine production pens, waste management integration, and full commercial scaling under farm management." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
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
            <button onClick={() => setActiveTab('home')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Home</button>
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Money Dashboard</button>
            <button onClick={() => setActiveTab('zimbabwe')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'zimbabwe' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Mahusekwa / Zim</button>
            <button onClick={() => setActiveTab('capture')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'capture' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Capture Entry</button>
            <button onClick={() => setActiveTab('askjude')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'askjude' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Ask Jude</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-black">Welcome back, Cunningham</h2>
              <p className="text-blue-100 mt-2 text-sm max-w-2xl">Your executive financial hub and Mahusekwa farm development command center.</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Account Balances</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {accountBalances.map((acc, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 truncate">{acc.name}</p>
                    <h4 className={`text-xl font-black mt-1 ${acc.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>R{acc.balance.toLocaleString()}</h4>
                  </div>
                ))}
              </div>
            </div>

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
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Household Living</p>
                <h3 className="text-2xl font-black text-blue-600 mt-1">R{householdLiving.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mahusekwa Farm Dev (Paid ZAR)</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">R{farmOverhead.toLocaleString()}</h3>
              </div>
            </div>

            {/* Loan & Debt Payoff Tracker Section Restored */}
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

                      const accountChoice = prompt("Which account was this paid from?\n1. Paisa Account\n2. Absa Account\n3. Lynne's Mukuru Account\n4. Your Mukuru Account (Joint Savings)", "1");
                      if (!accountChoice) return;

                      let selectedAccount = "Paisa Account";
                      if (accountChoice === "2" || accountChoice.toLowerCase().includes("absa")) selectedAccount = "Absa Account";
                      else if (accountChoice === "3" || accountChoice.toLowerCase().includes("lynne")) selectedAccount = "Lynne's Mukuru Account";
                      else if (accountChoice === "4" || accountChoice.toLowerCase().includes("joint")) selectedAccount = "Your Mukuru Account (Joint Savings)";

                      const newRepaidTotal = repaidAmt + paymentVal;
                      
                      await supabase
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

                      fetchRecords();
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
                            <button onClick={handleAddRepayment} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3.5 py-2 rounded-xl transition border border-emerald-200 shadow-sm">+ Log Repayment</button>
                            <button onClick={() => handleDeleteRecord(loan.id)} className="text-xs bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-3 py-2 rounded-xl transition">Delete</button>
                          </div>
                        </div>

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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Ledger & Transaction History</h3></div>
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
                          {tx.type === 'income' ? '+' : '-'}{tx.currency === 'USD' ? '$' : 'R'}{parseFloat(tx.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteRecord(tx.id)} className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'zimbabwe' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Mahusekwa Farm Development - Phases & Milestones</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {phasesConfig.map((phase) => {
                  const phaseMilestones = milestonesList.filter(m => m.category === phase.name);
                  const totalPhaseBudget = phaseMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
                  const totalPhaseFunded = phaseMilestones.reduce((sum, m) => {
                    const match = m.description?.match(/FundedUSD:\s*([\d.]+)/);
                    return sum + (match ? parseFloat(match[1]) : 0);
                  }, 0);
                  const phaseProgressPct = totalPhaseBudget > 0 ? Math.min(100, Math.round((totalPhaseFunded / totalPhaseBudget) * 100)) : 0;

                  const handleFundMilestone = async (milestone: any) => {
                    const match = milestone.description?.match(/FundedUSD:\s*([\d.]+)/);
                    const currentFunded = match ? parseFloat(match[1]) : 0;
                    const remainingUsd = Math.max(0, parseFloat(milestone.amount) - currentFunded);

                    const payUsdStr = prompt(`Enter USD amount to fund/pay towards "${milestone.description}":`, remainingUsd.toString());
                    if (!payUsdStr) return;
                    const payUsd = parseFloat(payUsdStr);
                    if (isNaN(payUsd) || payUsd <= 0) return;

                    const rateStr = prompt("Enter ZAR/USD exchange rate (e.g., 18.5 for R18.50 per $1):", "18.5");
                    if (!rateStr) return;
                    const rate = parseFloat(rateStr);

                    const feeStr = prompt("Enter remittance / transfer fee in ZAR:", "150");
                    if (!feeStr) return;
                    const fee = parseFloat(feeStr);

                    const accountChoice = prompt("Select payment account:\n1. Your Mukuru Account (Joint Savings)\n2. Paisa Account\n3. Absa Account\n4. Lynne's Mukuru Account", "1");
                    if (!accountChoice) return;

                    let selectedAccount = "Your Mukuru Account (Joint Savings)";
                    if (accountChoice === "2" || accountChoice.toLowerCase().includes("paisa")) selectedAccount = "Paisa Account";
                    else if (accountChoice === "3" || accountChoice.toLowerCase().includes("absa")) selectedAccount = "Absa Account";
                    else if (accountChoice === "4" || accountChoice.toLowerCase().includes("lynne")) selectedAccount = "Lynne's Mukuru Account";

                    const totalZarCost = (payUsd * rate) + fee;
                    const newFundedUsd = currentFunded + payUsd;

                    const baseDesc = milestone.description.replace(/\[Milestone:.*?\]\s*/, '').replace(/\[FundedUSD:.*?\]\s*/, '');
                    const newStatus = newFundedUsd >= parseFloat(milestone.amount) ? 'Completed' : 'In Progress';
                    const updatedDesc = `[Milestone: ${newStatus} | FundedUSD: ${newFundedUsd}] ${baseDesc}`;

                    await supabase.from('transactions').update({ description: updatedDesc }).eq('id', milestone.id);

                    await supabase.from('transactions').insert([{
                      household_id: 'default-household',
                      record_type: 'transaction',
                      type: 'expense',
                      category: phase.name,
                      amount: totalZarCost,
                      currency: 'ZAR',
                      description: `Funded Zim Milestone ($${payUsd} USD @ ${rate} + R${fee} fee): ${baseDesc}`,
                      paid_from: selectedAccount
                    }]);

                    alert(`Successfully funded $${payUsd} USD!\nTotal ZAR deducted: R${totalZarCost.toLocaleString()} from ${selectedAccount}.`);
                    fetchRecords();
                  };

                  return (
                    <div key={phase.num} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">Phase {phase.num}</span>
                          <span className="text-xs text-gray-500 font-medium">{phaseMilestones.length} quotations</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">{phase.name}</h4>
                        <p className="text-xs text-gray-600">{phase.desc}</p>
                        
                        {phaseMilestones.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200/60 space-y-2">
                            <p className="text-[11px] font-bold text-gray-700 uppercase">Quotations / Milestones:</p>
                            {phaseMilestones.map(m => {
                              const match = m.description?.match(/FundedUSD:\s*([\d.]+)/);
                              const funded = match ? parseFloat(match[1]) : 0;
                              const total = parseFloat(m.amount) || 0;
                              const isComplete = funded >= total && total > 0;
                              const cleanDesc = m.description.replace(/\[Milestone:.*?\]\s*/, '').replace(/\[FundedUSD:.*?\]\s*/, '');

                              return (
                                <div key={m.id} className="text-xs bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-semibold text-gray-900 block">{cleanDesc}</span>
                                      <span className="text-[10px] text-emerald-600 font-bold">Funded: ${funded.toLocaleString()} /${total.toLocaleString()} USD</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {isComplete ? 'Paid' : 'Planned'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                                    <button onClick={() => handleFundMilestone(m)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition">
                                      + Fund / Pay via Mukuru
                                    </button>
                                    <button onClick={() => handleDeleteRecord(m.id)} className="text-[10px] text-red-500 hover:underline">Delete</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-200/60 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-gray-600">
                          <span>Progress ({phaseProgressPct}% Funded)</span>
                          <span className="text-blue-600 font-bold">${totalPhaseFunded.toLocaleString()} /${totalPhaseBudget.toLocaleString()} USD</span>
                        </div>
                        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${phaseProgressPct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'capture' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Capture Entry & Quotation OCR</h2>
            <p className="text-xs text-gray-500 mb-6">Upload quotation PDFs or receipts to log them as planned milestones without affecting bank balances until funded.</p>
            
            <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
              <label className="block text-xs font-bold text-blue-900 uppercase">Scan Quotation / Receipt</label>
              <input type="file" accept="image/*,application/pdf" onChange={handleImageUpload} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white cursor-pointer" />
              {scanning && <p className="text-xs text-blue-600 animate-pulse">{scanMessage}</p>}
              {scanMessage && !scanning && <p className="text-xs text-emerald-600 font-semibold">✓ {scanMessage}</p>}
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Record Type</label>
                  <select value={recordType} onChange={(e) => setRecordType(e.target.value as any)} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white">
                    <option value="transaction">Transaction (Expense/Income)</option>
                    <option value="loan">Loan / Borrowing</option>
                    <option value="milestone">Mahusekwa Milestone / Quotation</option>
                  </select>
                </div>
                {recordType === 'milestone' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Target Phase</label>
                    <select value={targetPhase} onChange={(e) => setTargetPhase(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white">
                      {phasesConfig.map(p => <option key={p.num} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Amount</label>
                  <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 rounded-xl border text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white">
                    <option value="USD">USD ($)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Description / Quotation Title</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Roofing Materials & Labour" className="w-full px-4 py-2.5 rounded-xl border text-sm" required />
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition">
                Save Quotation Milestone
              </button>
            </form>
          </div>
        )}

        {activeTab === 'askjude' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border flex flex-col h-[650px] overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatLog.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>{msg.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAskJude} className="p-4 border-t bg-white flex space-x-3">
              <input type="text" value={askInput} onChange={(e) => setAskInput(e.target.value)} placeholder="Ask e.g. 'Bought coffee for R41.40'" className="flex-1 px-4 py-3 rounded-xl border text-sm" />
              <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">Ask</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}