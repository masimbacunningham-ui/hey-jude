
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Account {
  id: string;
  account_name: string;
  name?: string;
  owner: string;
  balance: number;
  currency: string;
}

interface Project {
  id: string;
  project_name: string;
  target_budget: number;
  currency: string;
}

interface Transaction {
  id: number;
  account_id: string;
  project_id?: string | null;
  type: string;
  transaction_type?: string;
  amount: number;
  description: string;
  category?: string;
  created_at: string;
}

interface Loan {
  id: string;
  loan_name: string;
  total_amount: number;
  paid_amount: number;
  currency: string;
}

const CATEGORIES = [
  'Groceries',
  'Transport & Fuel',
  'Utilities & Airtime',
  'Rent & Housing',
  'Dining & Leisure',
  'Savings & Transfer',
  'Debt & Loans',
  // Mahusekwa Farm Project Categories
  'Infrastructure & Construction',
  'Protected Agriculture (Greenhouses)',
  'Livestock & Piggery/Poultry',
  'Off-Grid Utilities (Solar & Water)',
  'Labor & Management',
  'General'
];

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [actionType, setActionType] = useState<'standard' | 'transfer'>('standard');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Loan Payment State
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);
  const [loanPaymentAmount, setLoanPaymentAmount] = useState('');
  const [loanPaymentAccountId, setLoanPaymentAccountId] = useState<string>('');

  // Add New Loan Form State
  const [showAddLoanForm, setShowAddLoanForm] = useState(false);
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanTotal, setNewLoanTotal] = useState('');
  const [newLoanPaid, setNewLoanPaid] = useState('');

  // Fetch Data
  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('accounts').select('*');
    if (!error && data) {
      setAccounts(data);
      if (data.length > 0) {
        if (!selectedAccountId) setSelectedAccountId(data[0].id);
        if (!destinationAccountId && data.length > 1) setDestinationAccountId(data[1].id);
        if (!loanPaymentAccountId) setLoanPaymentAccountId(data[0].id);
      }
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*');
    if (!error && data) {
      setProjects(data);
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransactions(data);
    }
  };

  const fetchLoans = async () => {
    const { data, error } = await supabase.from('loans').select('*');
    if (!error && data) {
      setLoans(data);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAccounts(), fetchProjects(), fetchTransactions(), fetchLoans()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit Transaction or Transfer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !amount) return;

    setSubmitting(true);

    if (actionType === 'transfer') {
      if (!destinationAccountId || selectedAccountId === destinationAccountId) {
        alert('Please select a different destination account for the transfer.');
        setSubmitting(false);
        return;
      }

      const transferAmount = parseFloat(amount);
      const sourceAcc = accounts.find(a => a.id === selectedAccountId);
      const destAcc = accounts.find(a => a.id === destinationAccountId);
      const transferDesc = description || `Transfer from ${sourceAcc?.account_name || sourceAcc?.name} to ${destAcc?.account_name || destAcc?.name}`;

      const { error: err1 } = await supabase.from('transactions').insert([
        {
          account_id: selectedAccountId,
          type: 'expense',
          amount: transferAmount,
          category: 'Savings & Transfer',
          description: transferDesc,
        },
      ]);

      const { error: err2 } = await supabase.from('transactions').insert([
        {
          account_id: destinationAccountId,
          type: 'income',
          amount: transferAmount,
          category: 'Savings & Transfer',
          description: transferDesc,
        },
      ]);

      if (err1 || err2) {
        alert('Error completing transfer: ' + (err1?.message || err2?.message));
      } else {
        setAmount('');
        setDescription('');
        await loadData();
      }
    } else {
      const { error } = await supabase.from('transactions').insert([
        {
          account_id: selectedAccountId,
          project_id: selectedProjectId === 'none' ? null : selectedProjectId,
          type,
          amount: parseFloat(amount),
          category,
          description,
        },
      ]);

      if (!error) {
        setAmount('');
        setDescription('');
        setCategory(CATEGORIES[0]);
        setSelectedProjectId('none');
        await loadData();
      } else {
        alert('Error saving transaction: ' + error.message);
      }
    }

    setSubmitting(false);
  };

  // Handle Creating a New Loan
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoanName || !newLoanTotal) return;

    const { error } = await supabase.from('loans').insert([
      {
        loan_name: newLoanName,
        total_amount: parseFloat(newLoanTotal),
        paid_amount: newLoanPaid ? parseFloat(newLoanPaid) : 0,
        currency: 'ZAR',
      },
    ]);

    if (error) {
      alert('Error creating loan: ' + error.message);
    } else {
      setNewLoanName('');
      setNewLoanTotal('');
      setNewLoanPaid('');
      setShowAddLoanForm(false);
      await fetchLoans();
    }
  };

  // Handle Loan Payment
  const handleLoanPayment = async (loan: Loan) => {
    const payment = parseFloat(loanPaymentAmount);
    if (!payment || payment <= 0) return;

    const newPaidAmount = Number(loan.paid_amount) + payment;

    const { error: loanError } = await supabase
      .from('loans')
      .update({ paid_amount: newPaidAmount })
      .eq('id', loan.id);

    if (loanError) {
      alert('Error updating loan: ' + loanError.message);
      return;
    }

    const { error: txError } = await supabase.from('transactions').insert([
      {
        account_id: loanPaymentAccountId || accounts[0]?.id,
        type: 'expense',
        amount: payment,
        category: 'Debt & Loans',
        description: `Loan payment for ${loan.loan_name}`,
      },
    ]);

    if (txError) {
      alert('Loan updated, but error logging transaction: ' + txError.message);
    }

    setPayingLoanId(null);
    setLoanPaymentAmount('');
    await loadData();
  };

  const getAccountName = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? (acc.account_name || acc.name) : 'Account';
  };

  const getProjectName = (id: string | null | undefined) => {
    if (!id) return null;
    const proj = projects.find((p) => p.id === id);
    return proj ? proj.project_name : null;
  };

  // Monthly Summary Calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.created_at);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const totalMonthlyIncome = monthlyTransactions
    .filter(tx => (tx.type || tx.transaction_type) === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalMonthlyExpenses = monthlyTransactions
    .filter(tx => (tx.type || tx.transaction_type) === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const netMonthlyCashflow = totalMonthlyIncome - totalMonthlyExpenses;

  // Project Totals Calculation
  const mahusekwaProject = projects.find(p => p.project_name.toLowerCase().includes('mahusekwa'));
  const mahusekwaSpent = transactions
    .filter(tx => tx.project_id === mahusekwaProject?.id && (tx.type || tx.transaction_type) === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const mahusekwaBudget = mahusekwaProject ? Number(mahusekwaProject.target_budget) : 0;
  const mahusekwaProgress = mahusekwaBudget > 0 ? Math.min(100, Math.round((mahusekwaSpent / mahusekwaBudget) * 100)) : 0;

  const filteredTransactions = selectedCategoryFilter === 'All'
    ? transactions
    : transactions.filter(tx => (tx.category || 'General') === selectedCategoryFilter);

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 font-sans">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Hey Jude</h1>
        <p className="text-gray-600">Shared Household & Farm Financial Assistant</p>
      </header>

      {/* Monthly Summary Bar */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-xl shadow-md space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-blue-100">Monthly Summary ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-blue-800">
          <div>
            <p className="text-xs text-blue-300 font-medium uppercase tracking-wider">Income</p>
            <p className="text-lg font-bold text-emerald-400">+ ZAR {totalMonthlyIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-300 font-medium uppercase tracking-wider">Expenses</p>
            <p className="text-lg font-bold text-rose-400">- ZAR {totalMonthlyExpenses.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-300 font-medium uppercase tracking-wider">Net Cashflow</p>
            <p className={`text-lg font-bold ${netMonthlyCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netMonthlyCashflow >= 0 ? '+' : ''} ZAR {netMonthlyCashflow.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      {/* Mahusekwa Farm Project Tracker */}
      {mahusekwaProject && (
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">🌱 {mahusekwaProject.project_name}</h2>
              <p className="text-xs text-gray-500">Capital Expenditure & Development Tracking</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Budget: {mahusekwaProject.currency} {mahusekwaBudget.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 font-medium">Spent: {mahusekwaProject.currency} {mahusekwaSpent.toLocaleString()} ({mahusekwaProgress}%)</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${mahusekwaProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Remaining Budget: {mahusekwaProject.currency} {Math.max(0, mahusekwaBudget - mahusekwaSpent).toLocaleString()}</span>
            <span>{mahusekwaProgress}% Utilized</span>
          </div>
        </section>
      )}

      {/* Live Account Balances Card */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Live Account Balances</h2>
        {loading ? (
          <p className="text-gray-500">Loading accounts...</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {accounts.map((acc) => (
              <div key={acc.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{acc.account_name || acc.name}</p>
                  <p className="text-xs text-gray-500">{acc.owner}</p>
                </div>
                <span className="font-bold text-emerald-600">
                  {acc.currency} {Number(acc.balance).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Debt & Loan Tracker Card */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Debts & Loans Tracker</h2>
          <button
            type="button"
            onClick={() => setShowAddLoanForm(!showAddLoanForm)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {showAddLoanForm ? 'Cancel' : '+ Add Loan'}
          </button>
        </div>

        {showAddLoanForm && (
          <form onSubmit={handleCreateLoan} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
            <h3 className="text-sm font-semibold text-indigo-900">Add New Loan / Debt</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Loan Name (e.g. Car Finance)</label>
              <input
                type="text"
                placeholder="Car Finance"
                value={newLoanName}
                onChange={(e) => setNewLoanName(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Loan Amount (ZAR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150000"
                  value={newLoanTotal}
                  onChange={(e) => setNewLoanTotal(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Already Paid So Far (ZAR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newLoanPaid}
                  onChange={(e) => setNewLoanPaid(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
            >
              Save Loan
            </button>
          </form>
        )}

        {loans.length === 0 ? (
          <p className="text-gray-500 text-sm py-2">No active loans tracked.</p>
        ) : (
          <div className="space-y-6">
            {loans.map((loan) => {
              const total = Number(loan.total_amount);
              const paid = Number(loan.paid_amount);
              const remaining = Math.max(0, total - paid);
              const progressPercent = Math.min(100, Math.round((paid / total) * 100));

              return (
                <div key={loan.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{loan.loan_name}</h3>
                      <p className="text-xs text-gray-500">Total Loan: {loan.currency} {total.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-600">Left: {loan.currency} {remaining.toLocaleString()}</p>
                      <p className="text-xs text-emerald-600 font-medium">Paid: {loan.currency} {paid.toLocaleString()} ({progressPercent}%)</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  {payingLoanId === loan.id ? (
                    <div className="pt-3 border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Payment Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={loanPaymentAmount}
                            onChange={(e) => setLoanPaymentAmount(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Pay From Account</label>
                          <select
                            value={loanPaymentAccountId}
                            onChange={(e) => setLoanPaymentAccountId(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                          >
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.account_name || acc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleLoanPayment(loan)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                        >
                          Confirm & Pay
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayingLoanId(null)}
                          className="px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPayingLoanId(loan.id);
                          setLoanPaymentAmount('');
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        + Log Loan Payment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Transaction & Transfer Form */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h2 className="text-xl font-semibold text-gray-800">
            {actionType === 'standard' ? 'Log Transaction' : 'Account Transfer'}
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-lg text-sm">
            <button
              type="button"
              onClick={() => setActionType('standard')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${actionType === 'standard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Income / Expense
            </button>
            <button
              type="button"
              onClick={() => setActionType('transfer')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${actionType === 'transfer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Transfer
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {actionType === 'standard' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_name || acc.name} ({acc.owner})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Link (Optional)</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                  >
                    <option value="none">None (Household)</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.project_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                  >
                    <option value="expense">Expense (-)</option>
                    <option value="income">Income (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ZAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_name || acc.name} ({acc.owner})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_name || acc.name} ({acc.owner})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Amount (ZAR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder={actionType === 'standard' ? "e.g. Greenhouse shade netting & poles" : "e.g. Monthly savings allocation"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Processing...' : (actionType === 'standard' ? 'Add Transaction' : 'Complete Transfer')}
          </button>
        </form>
      </section>

      {/* Recent Transactions Feed with Category Filter */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategoryFilter === 'All'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No transactions found for this category.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((tx) => {
              const txType = tx.type || tx.transaction_type;
              const isIncome = txType === 'income';
              const projName = getProjectName(tx.project_id);
              return (
                <div key={tx.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.description ? tx.description : (tx.category || 'General')}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                        {tx.category || 'General'}
                      </span> 
                      {projName && (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                          🌱 {projName}
                        </span>
                      )}
                      <span>• {getAccountName(tx.account_id)} • {new Date(tx.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <span className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'} ZAR {Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
