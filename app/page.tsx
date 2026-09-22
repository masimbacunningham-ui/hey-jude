
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Account {
  id: string; // Updated to string for UUID matching
  account_name: string;
  name?: string;
  owner: string;
  balance: number;
  currency: string;
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Accounts
  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Submit Transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !amount) return;

    setSubmitting(true);
    const { error } = await supabase.from('transactions').insert([
      {
        account_id: selectedAccountId, // Send full UUID string
        type,
        amount: parseFloat(amount),
        description,
      },
    ]);

    if (!error) {
      setAmount('');
      setDescription('');
      await fetchAccounts(); // Instantly refresh account balances
    } else {
      alert('Error saving transaction: ' + error.message);
    }
    setSubmitting(false);
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. Groceries, Fuel, Airtime"
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
    </main>
  );
}
