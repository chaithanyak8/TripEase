import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Users,
  Building,
  Compass,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Zap,
  DollarSign,
  BarChart3,
  Search
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/stats'));
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setVerificationQueue(data.verificationQueue);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: string, name: string) => {
    setVerificationQueue(prev => prev.filter(item => item.id !== id));
    showToast(`Approved & issued Govt. Verification Badge to ${name}!`);
  };

  const handleReject = (id: string) => {
    setVerificationQueue(prev => prev.filter(item => item.id !== id));
    showToast(`Request rejected with notification sent.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
          <span>Smart India Hackathon 2026 Innovation Oversight</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          TripEase Platform Administration & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Problem Statement ID: 26204 | AICTE, MIC Student Innovation. Real-time telemetry monitoring distributed tourism flow, verified partner credentials, and grassroots revenue attribution.
        </p>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Tourists</span>
            <div className="text-2xl font-black text-slate-900">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-600 font-semibold">+18% this month</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Trips Generated</span>
            <div className="text-2xl font-black text-orange-600">{stats.activeTripsPlanned.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400">Via AI Trip Planner</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Local Businesses</span>
            <div className="text-2xl font-black text-blue-600">{stats.registeredLocalBusinesses} Hosts</div>
            <p className="text-[11px] text-slate-400">{stats.verifiedGuides} Verified Guides</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue to Local Economy</span>
            <div className="text-2xl font-black text-emerald-700">{stats.localEconomyRevenueRouted}</div>
            <p className="text-[11px] text-emerald-600 font-semibold">Zero aggregator margin</p>
          </div>
        </div>
      )}

      {/* Popular Destinations and Verification Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Queue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Partner Verification Queue ({verificationQueue.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Govt. ID & MSME Check</span>
          </div>

          {verificationQueue.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              All partner credentials currently reviewed and verified.
            </div>
          ) : (
            <div className="space-y-3">
              {verificationQueue.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                    <div className="text-slate-500 text-[11px]">Category: {item.category}</div>
                    <div className="text-emerald-700 text-[11px] font-semibold">Docs: {item.docsSubmitted}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(item.id, item.name)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer shadow-xs"
                    >
                      Verify Badge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Destinations Trends */}
        {stats && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <span>Most Visited Destinations (Telemetry)</span>
            </h3>

            <div className="space-y-3 text-xs">
              {stats.popularDestinations.map((d: any, idx: number) => {
                const max = 1500;
                const pct = Math.round((d.trips / max) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-800">{d.name}</span>
                      <strong className="text-slate-900 font-bold">{d.trips} Trips</strong>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
