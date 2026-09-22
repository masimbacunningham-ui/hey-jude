'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Account {
  id: string;
  name: string;
  account_type: string;
  currency: string;
  current_balance: number;
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) {
        console.error('Error fetching accounts:', error);
      } else if (data) {
        setAccounts(data);
      }
      setLoading(false);
    }

    fetchAccounts();
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#1e293b' }}>Hey Jude</h1>
      <p style={{ color: '#64748b' }}>Shared Household Financial Assistant</p>

      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
        <h3 style={{ marginTop: 0, color: '#334155' }}>Live Account Balances</h3>
        {loading ? (
          <p style={{ color: '#64748b' }}>Connecting to database...</p>
        ) : accounts.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No accounts found in Supabase.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {accounts.map((acc) => (
              <li 
                key={acc.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 0', 
                  borderBottom: '1px solid #cbd5e1' 
                }}
              >
                <strong style={{ color: '#0f172a' }}>{acc.name}</strong>
                <span style={{ fontWeight: 'bold', color: '#16a34a' }}>
                  {acc.currency} {acc.current_balance ?? '0.00'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
