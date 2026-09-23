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

interface Milestone {
  id: string;
  project_id: string;
  phase_name: string;
  sub_budget: number;
  currency: string;
}

interface Transaction {
  id: number;
  account_id: string;
  project_id?: string | null;
  milestone_id?: string | null;
  type: string;
  transaction_type?: string;
  amount: number;
  description: string;
  category?: string;
  exchange_rate?: number;
  remittance_fee?: number;
  created_at: string;
}

interface Loan {
  id: string;
  loan_name: string;
  total_amount: number;
  paid_amount: number;
  currency: string;
}

interface RecurringTransaction {
  id: string;
  account_id: string;
  project_id?: string | null;
  milestone_id?: string | null;
  type: string;
  amount: number;
  category: string;
  description: string;
  frequency: string;
  next_due_date: string;
  active: boolean;
}

const CATEGORIES = [
  'Groceries',
  'Transport & Fuel',
  'Utilities & Airtime',
  'Rent & Housing',
  'Dining & Leisure',
  'Savings & Transfer',
  'Debt & Loans',
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
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [actionType, setActionType] = useState<'standard' | 'transfer'>('standard');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('none');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Cross-Currency Loan Payment State with Remittance
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);
  const [loanPaymentLoanAmount, setLoanPaymentLoanAmount] = useState('');
  const [loanPaymentAccountAmount, setLoanPaymentAccountAmount] = useState('');
  const [loanPaymentFee, setLoanPaymentFee] = useState('');
  const [loanPaymentAccountId, setLoanPaymentAccountId] = useState<string>('');

  // Add New Loan Form State
  const [showAddLoanForm, setShowAddLoanForm] = useState(false);
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanTotal, setNewLoanTotal] = useState('');
  const [newLoanPaid, setNewLoanPaid] = useState('');
  const [newLoanCurrency, setNewLoanCurrency] = useState('EUR');

  // Add Recurring Standing Order Form State
  const [showAddRecurringForm, setShowAddRecurringForm] = useState(false);
  const [recDescription, setRecDescription] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState<'income' | 'expense'>('expense');
  const [recCategory, setRecCategory] = useState(CATEGORIES[0]);
  const [recAccountId, setRecAccountId] = useState('');
  const [recNextDate, setRecNextDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch Data
  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('accounts').select('*');
    if (!error && data) {
      setAccounts(data);
      if (data.length > 0) {
        if (!selectedAccountId) setSelectedAccountId(data[0].id);
        if (!destinationAccountId && data.length > 1) setDestinationAccountId(data[1].id);
        if (!loanPaymentAccountId) setLoanPaymentAccountId(data[0].id);
        if (!recAccountId) setRecAccountId(data[0].id);
      }
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*');
    if (!error && data) {
      setProjects(data);
    }
  };

  const fetchMilestones = async () => {
    const { data, error } = await supabase.from('project_milestones').select('*');
    if (!error && data) {
      setMilestones(data);
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

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

  const fetchRecurring = async () => {
    const { data, error } = await supabase.from('recurring_transactions').select('*');
    if (!error && data) {
      setRecurringList(data);
      checkAndProcessRecurring(data);
    }
  };

  // Automatic Standing Order Processing Engine
  const checkAndProcessRecurring = async (recurringItems: RecurringTransaction[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let processedAny = false;

    for (const item of recurringItems) {
      if (item.active && item.next_due_date <= todayStr) {
        // 1. Insert the due transaction
        const { error: txErr } = await supabase.from('transactions').insert([
          {
            account_id: item.account_id,
            project_id: item.project_id || null,
            milestone_id: item.milestone_id || null,
            type: item.type,
            amount: item.amount,
            category: item.category,
            description: `[Standing Order] ${item.description}`,
          },
        ]);

        if (!txErr) {
          // 2. Advance next due date by 1 month
          const currentDueDate = new Date(item.next_due_date);
          currentDueDate.setMonth(currentDueDate.getMonth() + 1);
          const nextDateStr = currentDueDate.toISOString().split('T')[0];

          await supabase
            .from('recurring_transactions')
            .update({ next_due_date: nextDateStr })
            .eq('id', item.id);

          processedAny = true;
        }
      }
    }

    if (processedAny) {
      fetchTransactions();
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAccounts(), 
      fetchProjects(), 
      fetchMilestones(), 
      fetchTransactions(), 
      fetchLoans(),
      fetchRecurring()
    ]);
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
          milestone_id: selectedMilestoneId === 'none' ? null : selectedMilestoneId,
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
        setSelectedMilestoneId('none');
        await loadData();
      } else {
        alert('Error saving transaction: ' + error.message);
      }
    }

    setSubmitting(false);
  };

  // Handle Creating a New Recurring Standing Order
  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recDescription || !recAmount || !recAccountId) return;

    const { error } = await supabase.from('recurring_transactions').insert([
      {
        account_id: recAccountId,
        type: recType,
        amount: parseFloat(recAmount),
        category: recCategory,
        description: recDescription,
        frequency: 'monthly',
        next_due_date: recNextDate,
        active: true,
      },
    ]);

    if (error) {
      alert('Error creating standing order: ' + error.message);
    } else {
      setRecDescription('');
      setRecAmount('');
      setShowAddRecurringForm(false);
      await fetchRecurring();
    }
  };

  // Toggle Standing Order Active Status
  const toggleRecurringActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('recurring_transactions')
      .update({ active: !currentStatus })
      .eq('id', id);

    if (!error) {
      await fetchRecurring();
    }
  };

  // Delete Standing Order
  const deleteRecurring = async (id: string) => {
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchRecurring();
    }
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
        currency: newLoanCurrency,
      },
    ]);

    if (error) {
      alert('Error creating loan: ' + error.message);
    } else {
      setNewLoanName('');
      setNewLoanTotal('');
      setNewLoanPaid('');
      setNewLoanCurrency('EUR');
      setShowAddLoanForm(false);
      await fetchLoans();
    }
  };

  // Handle Cross-Currency Loan Payment with Remittance & Exchange Rate
  const handleLoanPayment = async (loan: Loan) => {
    const loanCredit = parseFloat(loanPaymentLoanAmount);
    const accountDebit = parseFloat(loanPaymentAccountAmount);
    const fee = loanPaymentFee ? parseFloat(loanPaymentFee) : 0;
    
    if (!loanCredit || !accountDebit || loanCredit <= 0 || accountDebit <= 0) {
      alert('Please enter valid amounts for both loan credit and account debit.');
      return;
    }

    const exchangeRate = Number((accountDebit / loanCredit).toFixed(4));
    const newPaidAmount = Number(loan.paid_amount) + loanCredit;

    const { error: loanError } = await supabase
      .from('loans')
      .update({ paid_amount: newPaidAmount })
      .eq('id', loan.id);

    if (loanError) {
      alert('Error updating loan: ' + loanError.message);
      return;
    }

    const txDescription = `Loan payment for ${loan.loan_name} (Credited: ${loan.currency} ${loanCredit.toFixed(2)})`;

    const { error: txError } = await supabase.from('transactions').insert([
      {
        account_id: loanPaymentAccountId || accounts[0]?.id,
        type: 'expense',
        amount: accountDebit,
        category: 'Debt & Loans',
        description: txDescription,
        exchange_rate: exchangeRate,
        remittance_fee: fee,
      },
    ]);

    if (txError) {
      alert('Loan updated, but error logging transaction: ' + txError.message);
    }

    setPayingLoanId(null);
    setLoanPaymentLoanAmount('');
    setLoanPaymentAccountAmount('');
    setLoanPaymentFee('');
    await loadData();
  };

  // Export Filtered Transactions to CSV
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions available to export.');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency', 'Account', 'Project', 'Phase Milestone', 'Exchange Rate', 'Remittance Fee'];
    
    const rows = filteredTransactions.map(tx => {
      const date = new Date(tx.created_at).toLocaleDateString();
      const desc = `"${(tx.description || '').replace(/"/g, '""')}"`;
      const cat = `"${(tx.category || 'General').replace(/"/g, '""')}"`;
      const type = tx.type || tx.transaction_type || 'expense';
      const amount = tx.amount;
      const curr = getAccountCurrency(tx.account_id);
      const account = `"${getAccountName(tx.account_id).replace(/"/g, '""')}"`;
      const proj = `"${(getProjectName(tx.project_id) || '').replace(/"/g, '""')}"`;
      const phase = `"${(getMilestoneName(tx.milestone_id) || '').replace(/"/g, '""')}"`;
      const fx = tx.exchange_rate || '';
      const fee = tx.remittance_fee || '';

      return [date, desc, cat, type, amount, curr, account, proj, phase, fx, fee].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hey_Jude_Financial_Statement_${selectedCategoryFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAccountName = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? (acc.account_name || acc.name) : 'Account';
  };

  const getAccountCurrency = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.currency : 'ZAR';
  };

  const getProjectName = (id: string | null | undefined) => {
    if (!id) return null;
    const proj = projects.find((p) => p.id === id);
    return proj ? proj.project_name : null;
  };

  const getMilestoneName = (id: string | null | undefined) => {
    if (!id) return null;
    const m = milestones.find((item) => item.id === id);
    return m ? m.phase_name : null;
  };

  // Monthly Summary Calculations Grouped by Currency
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.created_at);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const monthlyTotalsByCurrency: { [currency: string]: { income: number; expense: number } } = {};
  monthlyTransactions.forEach(tx => {
    const curr = getAccountCurrency(tx.account_id);
    if (!monthlyTotalsByCurrency[curr]) {
      monthlyTotalsByCurrency[curr] = { income: 0, expense: 0 };
    }
    const txType = tx.type || tx.transaction_type;
    if (txType === 'income') {
      monthlyTotalsByCurrency[curr].income += Number(tx.amount);
    } else if (txType === 'expense') {
      monthlyTotalsByCurrency[curr].expense += Number(tx.amount);
    }
  });

  // Project & Phase Totals Calculation
  const mahusekwaProject = projects.find(p => p.project_name.toLowerCase().includes('mahusekwa'));
  const mahusekwaMilestones = milestones.filter(m => m.project_id === mahusekwaProject?.id);

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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hey Jude</h1>
          <p className="text-gray-600">Shared Household & Farm Financial Assistant</p>
        </div>
        <button
          type="button"
          onClick={exportToCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
        >
          📥 Export CSV
        </button>
      </header>

      {/* Multi-Currency Monthly Summary Bar */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-xl shadow-md space-y-4">
        <h2 className="text-lg font-semibold text-blue-100">Monthly Summary ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})</h2>
        
        {Object.keys(monthlyTotalsByCurrency).length === 0 ? (
          <p className="text-blue-200 text-sm">No transactions logged for this month yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(monthlyTotalsByCurrency).map(([curr, totals]) => {
              const net = totals.income - totals.expense;
              return (
                <div key={curr} className="pt-3 border-t border-blue-800 first:border-0 first:pt-0">
                  <p className="text-xs text-blue-300 font-semibold tracking-wider mb-1">{curr} Totals</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-blue-300">Income</p>
                      <p className="text-sm font-bold text-emerald-400">+{curr} {totals.income.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-300">Expenses</p>
                      <p className="text-sm font-bold text-rose-400">-{curr} {totals.expense.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-300">Net</p>
                      <p className={`text-sm font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {net >= 0 ? '+' : ''}{curr} {net.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recurring Standing Orders Card */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Recurring Standing Orders</h2>
            <p className="text-xs text-gray-500">Automated monthly rent, subscriptions & stipends</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddRecurringForm(!showAddRecurringForm)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {showAddRecurringForm ? 'Cancel' : '+ Add Standing Order'}
          </button>
        </div>

        {showAddRecurringForm && (
          <form onSubmit={handleCreateRecurring} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
            <h3 className="text-sm font-semibold text-indigo-900">New Recurring Standing Order</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Hout Bay Rent"
                  value={recDescription}
                  onChange={(e) => setRecDescription(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={recAccountId}
                  onChange={(e) => setRecAccountId(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name || acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={recType}
                  onChange={(e) => setRecType(e.target.value as 'income' | 'expense')}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                >
                  <option value="expense">Expense (-)</option>
                  <option value="income">Income (+)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={recAmount}
                  onChange={(e) => setRecAmount(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Due Date</label>
                <input
                  type="date"
                  value={recNextDate}
                  onChange={(e) => setRecNextDate(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={recCategory}
                onChange={(e) => setRecCategory(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
            >
              Save Standing Order
            </button>
          </form>
        )}

        {recurringList.length === 0 ? (
          <p className="text-gray-500 text-sm py-2">No active standing orders configured.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recurringList.map((item) => {
              const curr = getAccountCurrency(item.account_id);
              return (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {item.description}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                        {item.active ? 'Active' : 'Paused'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Next Due: <strong className="text-gray-700">{item.next_due_date}</strong> • {getAccountName(item.account_id)} • Monthly
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.type === 'income' ? '+' : '-'} {curr} {Number(item.amount).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRecurringActive(item.id, item.active)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {item.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecurring(item.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Mahusekwa Farm Project Tracker with Phase Milestones */}
      {mahusekwaProject && (
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">🌱 {mahusekwaProject.project_name}</h2>
              <p className="text-xs text-gray-500">Capital Expenditure & Phase Milestones</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Total Budget: {mahusekwaProject.currency} {mahusekwaBudget.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 font-medium">Total Spent: {mahusekwaProject.currency} {mahusekwaSpent.toLocaleString()} ({mahusekwaProgress}%)</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${mahusekwaProgress}%` }}
            ></div>
          </div>

          {mahusekwaMilestones.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Development Phases & Sub-Budgets</h3>
              <div className="grid grid-cols-1 gap-3">
                {mahusekwaMilestones.map((m) => {
                  const phaseSpent = transactions
                    .filter(tx => tx.milestone_id === m.id && (tx.type || tx.transaction_type) === 'expense')
                    .reduce((sum, tx) => sum + Number(tx.amount), 0);
                  const subBudget = Number(m.sub_budget);
                  const phaseProgress = subBudget > 0 ? Math.min(100, Math.round((phaseSpent / subBudget) * 100)) : 0;

                  return (
                    <div key={m.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-900">{m.phase_name}</span>
                        <span className="font-medium text-gray-600">
                          Spent: <strong className="text-emerald-600">{m.currency} {phaseSpent.toLocaleString()}</strong> / {m.currency} {subBudget.toLocaleString()} ({phaseProgress}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${phaseProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

      {/* Debt & Loan Tracker Card with Remittance Tracking */}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Loan Name</label>
              <input
                type="text"
                placeholder="Car Finance"
                value={newLoanName}
                onChange={(e) => setNewLoanName(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={newLoanCurrency}
                  onChange={(e) => setNewLoanCurrency(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="ZAR">ZAR</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Loan Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="4800"
                  value={newLoanTotal}
                  onChange={(e) => setNewLoanTotal(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                  required
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
                    <div className="pt-3 border-t border-gray-200 space-y-3 bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700">Log Remittance & Cross-Border Payment</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Loan Credit ({loan.currency})</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 150.00"
                            value={loanPaymentLoanAmount}
                            onChange={(e) => setLoanPaymentLoanAmount(e.target.value)}
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
                                {acc.account_name || acc.name} ({acc.currency})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total Debited ({getAccountCurrency(loanPaymentAccountId || accounts[0]?.id)})</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 3150.00"
                            value={loanPaymentAccountAmount}
                            onChange={(e) => setLoanPaymentAccountAmount(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Fee (Optional)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 50.00"
                            value={loanPaymentFee}
                            onChange={(e) => setLoanPaymentFee(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500">The app will automatically calculate the effective exchange rate.</p>

                      <div className="flex space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleLoanPayment(loan)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                        >
                          Confirm Remittance Payment
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
                          setLoanPaymentLoanAmount('');
                          setLoanPaymentAccountAmount('');
                          setLoanPaymentFee('');
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

      {/* Transaction & Transfer Form with Phase Selection */}
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
                        {acc.account_name || acc.name} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Link</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedMilestoneId('none');
                    }}
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

              {selectedProjectId === mahusekwaProject?.id && mahusekwaMilestones.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm Phase / Milestone</label>
                  <select
                    value={selectedMilestoneId}
                    onChange={(e) => setSelectedMilestoneId(e.target.value)}
                    className="w-full p-2 border border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900"
                  >
                    <option value="none">General Farm Expense (No Phase)</option>
                    {mahusekwaMilestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.phase_name} (Sub-budget: {m.currency} {Number(m.sub_budget).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
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
                        {acc.account_name || acc.name} ({acc.currency})
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
                        {acc.account_name || acc.name} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Amount</label>
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
              placeholder={actionType === 'standard' ? "e.g. Solar inverter & batteries" : "e.g. Monthly savings allocation"}
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

      {/* Recent Transactions Feed with Phase Badges */}
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
              const milestoneName = getMilestoneName(tx.milestone_id);
              const curr = getAccountCurrency(tx.account_id);
              return (
                <div key={tx.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.description ? tx.description : (tx.category || 'General')}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                        {tx.category || 'General'}
                      </span> 
                      {projName && (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                          🌱 {projName}
                        </span>
                      )}
                      {milestoneName && (
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-200">
                          📌 {milestoneName}
                        </span>
                      )}
                      <span>• {getAccountName(tx.account_id)} • {new Date(tx.created_at).toLocaleDateString()}</span>
                      {tx.exchange_rate && (
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium border border-indigo-200">
                          💱 FX: {tx.exchange_rate}
                        </span>
                      )}
                      {tx.remittance_fee && Number(tx.remittance_fee) > 0 && (
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                          fee: {curr} {Number(tx.remittance_fee).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'} {curr} {Number(tx.amount).toFixed(2)}
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
