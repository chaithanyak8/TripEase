import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseItem } from '../../types';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Sparkles,
  PieChart,
  CheckCircle2,
  Hotel,
  Bus,
  UtensilsCrossed,
  Award,
  ShoppingBag,
  ShieldAlert,
  X
} from 'lucide-react';

export const AIBudgetManager: React.FC = () => {
  const { activeTrip, expenses, addExpense, showToast } = useApp();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseItem['category']>('Food');

  const totalBudget = activeTrip?.totalBudget ?? 0;
  const totalSpent = activeTrip?.spent ?? (activeTrip ? expenses.reduce((sum, item) => sum + item.amount, 0) : 0);
  const remaining = Math.max(0, totalBudget - totalSpent);
  const percentageSpent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  // Category aggregations
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    addExpense({
      title: newTitle,
      amount: Number(newAmount),
      category: newCategory,
      date: "Just now"
    });

    setNewTitle('');
    setNewAmount('');
    setIsAddExpenseOpen(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Hotel': return Hotel;
      case 'Transport': return Bus;
      case 'Food': return UtensilsCrossed;
      case 'Activities': return Award;
      case 'Shopping': return ShoppingBag;
      default: return AlertCircle;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Travel Budget Manager</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Financial Balance & Expense Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Real-time tracking synchronized across your bookings, day plan stops, auto rickshaws, and dining.
          </p>
        </div>

        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 shadow-md shadow-sky-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Expense</span>
        </button>
      </div>

      {/* Budget Gauges & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Allocated Budget</span>
          <div className="text-2xl font-black text-slate-900">₹{totalBudget.toLocaleString()}</div>
          <p className="text-xs text-slate-500">
            {activeTrip ? `${activeTrip.durationDays} days · ${activeTrip.travelers} travelers · ${activeTrip.destination}` : 'No active trip'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spent So Far</span>
          <div className="text-2xl font-black text-sky-600">₹{totalSpent.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{percentageSpent}%</span>
            <span>of total budget used</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safe Remaining Balance</span>
          <div className="text-2xl font-black text-emerald-600">₹{remaining.toLocaleString()}</div>
          <p className="text-xs text-slate-500">
            {remaining > totalBudget * 0.2 ? "Budget health is optimal" : "Approaching budget threshold"}
          </p>
        </div>
      </div>

      {/* Progress Bar & Warning */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700">Trip Budget Progress</span>
          <span className={percentageSpent > 85 ? 'text-red-600' : 'text-emerald-700'}>
            {percentageSpent}% Utilized
          </span>
        </div>

        <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentageSpent > 85 ? 'bg-red-500' : percentageSpent > 65 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>

        {percentageSpent > 80 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Budget Advisory:</strong> You have consumed over 80% of your allocated trip funds. Review category allocations below.
            </span>
          </div>
        )}

        {/* AI Cost-Saving Insight */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Trip budget context:</strong> {activeTrip
              ? `${activeTrip.destination} · ${activeTrip.durationDays} days · ${activeTrip.travelers} travelers. Local specialty: ${activeTrip.targetDestination?.localSpecialty || 'check local menus and prices.'}`
              : 'Synthesize a trip to see destination-specific budget context.'}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Totals */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-sky-600" />
            <span>Category Spending</span>
          </h3>

          <div className="space-y-3 text-xs">
            {Object.entries(categoryTotals).map(([cat, amt]) => {
              const Icon = getCategoryIcon(cat);
              const catPercent = Math.round((amt / Math.max(1, totalSpent)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cat}</span>
                    </span>
                    <span className="text-slate-900 font-bold">₹{amt.toLocaleString()} ({catPercent}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${catPercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
            Expense Transaction Ledger
          </h3>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {expenses.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">{item.category}</span>
                    <span>{item.date || "Active trip"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-slate-900">₹{item.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-base text-slate-900">Log Manual Expense</h3>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expense Description</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Taxi to a local attraction"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    placeholder="250"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="Food">Food & Dining</option>
                    <option value="Transport">Transport & Auto</option>
                    <option value="Hotel">Hotel & Stay</option>
                    <option value="Activities">Activities & Passes</option>
                    <option value="Shopping">Handicrafts & Shopping</option>
                    <option value="Buffer / Misc">Buffer / Incidentals</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
