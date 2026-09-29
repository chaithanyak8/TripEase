import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, Calendar, Layers, Wallet, ShieldAlert, Sparkles } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsSOSModalOpen, t, activeTripBookings } = useApp();

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
          activeTab === 'home' ? 'text-sky-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => setActiveTab('planner')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
          activeTab === 'planner' ? 'text-sky-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Calendar className="w-5 h-5 text-sky-600" />
        <span>Plan Trip</span>
      </button>

      {/* Center SOS Button for Instant Mobile Access */}
      <button
        onClick={() => setIsSOSModalOpen(true)}
        className="flex flex-col items-center -mt-5 bg-red-600 text-white p-2.5 rounded-full shadow-lg shadow-red-500/30 border-2 border-white cursor-pointer active:scale-90 transition-transform"
        title="Immediate Emergency SOS"
      >
        <ShieldAlert className="w-5 h-5 animate-pulse" />
      </button>

      <button
        onClick={() => setActiveTab('map')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
          activeTab === 'map' ? 'text-sky-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Layers className="w-5 h-5" />
        <span>Map</span>
      </button>

      <button
        onClick={() => setActiveTab('wallet')}
        className={`relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
          activeTab === 'wallet' ? 'text-emerald-700 font-bold' : 'text-slate-500'
        }`}
      >
        <Wallet className="w-5 h-5" />
        <span>Wallet</span>
        {activeTripBookings.length > 0 && (
          <span className="absolute top-0 right-1 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
            {activeTripBookings.length}
          </span>
        )}
      </button>
    </nav>
  );
};
