
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

interface Transaction {
  id: number;
  account_id: string;
  type: string;
  transaction_type?: string;
  amount: number;
  description: string;
  category?: string;
  created_at: string;
}

const CATEGORIES = [
  'Groceries',
  'Transport & Fuel',
  'Utilities & Airtime',
  'Rent & Housing',
  'Dining & Leisure',
  'Savings & Transfer',
  'General'
];

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Accounts
  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('accounts').select('*');
    if (!error && data) {
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    }
  };

  // Fetch Recent Transactions
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTransactions(data);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAccounts(), fetchTransactions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit Transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !amount) return;

    setSubmitting(true);
    const { error } = await supabase.from('transactions'].insert([
      {
        account_id: selectedAccountId,
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
      await Promise.all([fetchAccounts(), fetchTransactions()]);
    } else {
      alert('Error saving transaction: ' + error.message);
    }
    setSubmitting(false);
  };

  const getAccountName = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? (acc.account_name || acc.name) : 'Account';
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 font-sans">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Hey Jude</h1>
        <p className="text-gray-600">Shared Household Financial Assistant</p>
      </header>

      {/* Account Balances Card */}
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

      {/* Transaction Entry Form */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Log Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Woolworths shopping, Engen fuel"
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
            {submitting ? 'Saving...' : 'Add Transaction'}
          </button>
        </form>
      </section>

      {/* Recent Transactions Feed */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions logged yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => {
              const txType = tx.type || tx.transaction_type;
              const isIncome = txType === 'income';
              return (
                <div key={tx.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.description ? tx.description : (tx.category || 'General')}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium mr-1">
                        {tx.category || 'General'}
                      </span> 
                      • {getAccountName(tx.account_id)} • {new Date(tx.created_at).toLocaleDateString()}
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
