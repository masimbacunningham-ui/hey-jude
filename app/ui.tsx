{/* Loan & Debt Payoff Tracker Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">Loan & Debt Payoff Tracker</h3>
            <p className="text-xs text-gray-500">Monitor borrowed funds, lent amounts, and partial repayment progress.</p>
          </div>
        </div>
        {loansList.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No active loans logged. Use the Capture tab under Loan to add one!</div>
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

                const newRepaidTotal = repaidAmt + paymentVal;
                const { error } = await supabase
                  .from('transactions')
                  .update({ repaid_amount: newRepaidTotal })
                  .eq('id', loan.id);

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
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <span className="text-sm font-extrabold text-gray-900">
                          Total: {loan.currency === 'EUR' ? '€' : loan.currency === 'USD' ? '$' : 'R'}{totalLoanAmt.toLocaleString()}
                        </span>
                        <p className="text-xs text-emerald-600 font-semibold">Repaid: {loan.currency === 'EUR' ? '€' : loan.currency === 'USD' ? '$' : 'R'}{repaidAmt.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={handleAddRepayment} 
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-3 py-1.5 rounded-lg transition border border-emerald-200"
                      >
                        + Log Repayment
                      </button>
                      <button onClick={() => handleDeleteRecord(loan.id)} className="text-xs bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-2.5 py-1.5 rounded-lg transition">Delete</button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-gray-600">
                      <span>Progress: {progressPct}% Paid Back</span>
                      <span>Remaining Balance: {loan.currency === 'EUR' ? '€' : loan.currency === 'USD' ? '$' : 'R'}{remainingAmt.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>