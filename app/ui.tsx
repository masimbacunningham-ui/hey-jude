'use client';

import { useState } from 'react';

function speak() {
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

function Capture({ supabase, householdId }: { supabase: any; householdId: string }) {
  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Capture</h2>
      <p className="text-gray-600">Quick entry form will appear here.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hey Jude</h1>
          <p className="text-xs text-gray-500">Cunningham &amp; Lynne</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === 'home' && <Home supabase={supabase} householdId={householdId} />}
        {activeTab === 'capture' && <Capture supabase={supabase} householdId={householdId} />}
        {activeTab === 'transactions' && <Transactions supabase={supabase} householdId={householdId} />}
        {activeTab === 'zimbabwe' && <Zimbabwe txs={[]} onSave={() => {}} />}
        {activeTab === 'assistant' && <Assistant supabase={supabase} householdId={householdId} />}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 shadow-lg z-50">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center text-xs font-medium ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('capture')}
          className={`flex flex-col items-center text-xs font-medium ${activeTab === 'capture' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <span>➕</span>
          <span>Capture</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center text-xs font-medium ${activeTab === 'transactions' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <span>💳</span>
          <span>Money</span>
        </button>
        <button
          onClick={() => setActiveTab('zimbabwe')}
          className={`flex flex-col items-center text-xs font-medium ${activeTab === 'zimbabwe' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <span>ZW</span>
          <span>Zimbabwe</span>
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center text-xs font-medium ${activeTab === 'assistant' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <span>✨</span>
          <span>Ask Jude</span>
        </button>
      </nav>
    </div>
  );
}