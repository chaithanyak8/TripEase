import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Sparkles,
  X
} from 'lucide-react';

export const LocalBusinessDashboard: React.FC = () => {
  const { showToast } = useApp();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // New business form state
  const [businessName, setBusinessName] = useState('');
  const [type, setType] = useState('Local Homestay');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('+91 ');

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/business/dashboard');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses);
        setInquiries(data.inquiries);
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, type, ownerName, location, phone })
      });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(prev => [data.business, ...prev]);
        setIsRegisterOpen(false);
        showToast("Business listing created and submitted for verification!");
      }
    } catch (err) {
      console.error(err);
      showToast("Registration failed");
    }
  };

  const handleRespondInquiry = (id: string) => {
    setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: "Answered" } : inq));
    showToast("Response sent directly to tourist!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            <Building2 className="w-3.5 h-3.5" />
            <span>Local Merchant & Host Ecosystem</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Local Tourism Business Portal
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Helping rural homestays, tour guides, artisans, and family dhabas get 100% digital visibility, direct tourist bookings, and zero corporate middleman cut.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Business</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue Generated</span>
            <div className="text-2xl font-black text-emerald-700">₹{analytics.totalLocalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500">Distributed 100% to local bank accounts</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tourists Hosted</span>
            <div className="text-2xl font-black text-slate-900">{analytics.totalGuestsHosted} Guests</div>
            <p className="text-xs text-slate-500">Across verified village experiences & homestays</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grassroots Economic Impact</span>
            <div className="text-sm font-black text-slate-900">{analytics.communityEmploymentImpact}</div>
            <p className="text-xs text-emerald-700 font-semibold">Empowered via direct tourism</p>
          </div>
        </div>
      )}

      {/* Registered Listings */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Your Registered Tourism Listings & Services
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {businesses.map(b => (
            <div key={b.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {b.type}
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{b.status}</span>
                </span>
              </div>

              <div>
                <h3 className="font-black text-base text-slate-900">{b.businessName}</h3>
                <div className="text-xs text-slate-500">Owner: <strong>{b.ownerName}</strong></div>
                <div className="text-xs text-slate-400">📍 {b.location} • 📞 {b.phone}</div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Bookings</span>
                  <strong className="text-slate-900">{b.bookingsCount} Completed</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Revenue</span>
                  <strong className="text-emerald-700 font-black">₹{b.revenue.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Inquiries Inbox */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-700" />
          <span>Direct Tourist Inquiries Inbox</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {inquiries.map(inq => (
            <div key={inq.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{inq.from}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{inq.date}</span>
                </div>
                <p className="text-slate-600">{inq.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  inq.status === 'Answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {inq.status}
                </span>
                {inq.status !== 'Answered' && (
                  <button
                    onClick={() => handleRespondInquiry(inq.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Register Business Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <form onSubmit={handleRegisterBusiness} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-base text-slate-900">Register Tourism Service</h3>
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business / Homestay Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Kaveri Riverside Cottage"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="Hotel & Homestay">Hotel & Homestay</option>
                    <option value="Restaurant & Food">Restaurant & Food</option>
                    <option value="Local Tour Guide">Local Tour Guide</option>
                    <option value="Taxi & Auto Provider">Taxi & Auto Provider</option>
                    <option value="Activity & Workshop">Activity & Workshop</option>
                    <option value="Handicrafts Shop">Handicrafts Shop</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location / Village</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City, district, or village"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
