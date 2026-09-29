import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  QrCode,
  Hotel,
  Bus,
  Award,
  CheckCircle2,
  WifiOff,
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  Sparkles,
  MapPin,
  HeartHandshake
} from 'lucide-react';

export const DigitalTravelWallet: React.FC = () => {
  const {
    activeTrip,
    activeTripBookings,
    offlineMode,
    toggleOfflineMode,
    expenses,
    showToast
  } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadOfflineBundle = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      trip: activeTrip,
      bookings: activeTripBookings,
      expenses,
      emergencyContacts: ["112", "100", "108", "1363"]
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `TripEase-Offline-Pass-${activeTrip?.id || '2026'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Offline travel data bundle saved to device!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Wallet Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            <Wallet className="w-3.5 h-3.5" />
            <span>Digital Travel Pass & Wallet</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            One Screen. Complete Trip Access.
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Access all your confirmed homestay vouchers, bus boarding passes, local guide contacts, and day schedules in one place — accessible even with zero internet.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
              offlineMode ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/20 text-white'
            }`}>
              <WifiOff className="w-3.5 h-3.5" />
              <span>{offlineMode ? "Available Offline - Synced" : "Online Mode (Toggle to Cache)"}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
          <button
            onClick={toggleOfflineMode}
            className={`font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              offlineMode ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>{offlineMode ? "Cached Offline" : "Enable Offline Mode"}</span>
          </button>

          <button
            onClick={handleDownloadOfflineBundle}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-white/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Pass (JSON)</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Print Travel Pass</span>
          </button>
        </div>
      </div>

      {/* Tourism Impact Dashboard (Requirement 23) */}
      {activeTrip?.tourismImpact && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-900">
            <HeartHandshake className="w-5 h-5 text-emerald-700" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              Tourism Impact Dashboard (Your Local Support)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-slate-400 block text-[10px] font-bold">Local Businesses Supported</span>
              <strong className="text-lg font-black text-emerald-800">
                {activeTrip.tourismImpact.localBusinessesSupported} Partners
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-slate-400 block text-[10px] font-bold">Verified Local Guides</span>
              <strong className="text-lg font-black text-emerald-800">
                {activeTrip.tourismImpact.localGuidesEmployed} Guide Hired
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-slate-400 block text-[10px] font-bold">Local Community Spending</span>
              <strong className="text-lg font-black text-emerald-800">
                ₹{activeTrip.tourismImpact.localSpendAmount.toLocaleString()} ({activeTrip.tourismImpact.localSpendPercentage}%)
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-slate-400 block text-[10px] font-bold">Carbon Footprint Tier</span>
              <strong className="text-sm font-black text-emerald-800">
                {activeTrip.tourismImpact.carbonFootprint}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed E-Vouchers & Boarding Passes with QR Codes */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <QrCode className="w-5 h-5 text-emerald-700" />
          <span>Active Bookings & QR Boarding Passes</span>
        </h2>

        {activeTripBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            No active bookings yet. Browse Hotels, Transport, or Experiences to add digital vouchers here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTripBookings.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border-2 border-dashed border-slate-200 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.itemType} Voucher
                    </span>
                    <h3 className="font-black text-base text-slate-900">{item.title}</h3>
                    <div className="text-xs text-slate-500">Booking Ref: <strong>{item.id}</strong></div>
                    {item.checkIn && (
                      <div className="text-xs text-slate-600">Dates: {item.checkIn} ➔ {item.checkOut}</div>
                    )}
                  </div>

                  {/* Visual Mock QR Code */}
                  <div className="w-20 h-20 bg-slate-950 p-1.5 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white">
                    <QrCode className="w-12 h-12" />
                    <span className="text-[8px] font-mono tracking-tighter mt-0.5">SCAN PASS</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Paid</span>
                    <strong className="text-base font-black text-slate-900">₹{item.amount}</strong>
                  </div>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Card for Offline Quick Reference */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span>Offline Emergency Pocket Reference</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-red-100 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">National Helpline</span>
            <strong className="text-base font-black text-red-600">112</strong>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-red-100 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">Police Patrol</span>
            <strong className="text-base font-black text-blue-600">100</strong>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-red-100 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">Medical Ambulance</span>
            <strong className="text-base font-black text-rose-600">108</strong>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-red-100 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">Tourist 24/7 Desk</span>
            <strong className="text-base font-black text-amber-600">1363</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
