import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, ShieldAlert, PhoneCall, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, setIsSOSModalOpen, t } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 pt-12 pb-24 xl:pb-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & SIH Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Trip<span className="text-orange-500">Ease</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('heroSubtitle')}
            </p>
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300 space-y-0.5">
              <strong className="text-white block font-bold">Smart India Hackathon 2026</strong>
              <div>PS ID: <strong>26204</strong> • Software</div>
              <div>Org: AICTE, MIC – Student Innovation</div>
            </div>
          </div>

          {/* Quick Ecosystem Links */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Tourism Ecosystem</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => setActiveTab('planner')} className="hover:text-white transition cursor-pointer">AI Trip Planner</button></li>
              <li><button onClick={() => setActiveTab('explore')} className="hover:text-white transition cursor-pointer">Explore India</button></li>
              <li><button onClick={() => setActiveTab('beyond-crowd')} className="hover:text-emerald-400 transition cursor-pointer font-semibold text-emerald-400">Beyond The Crowd ✨</button></li>
              <li><button onClick={() => setActiveTab('map')} className="hover:text-white transition cursor-pointer">Smart Interactive Map</button></li>
              <li><button onClick={() => setActiveTab('hotels')} className="hover:text-white transition cursor-pointer">Hotels & Homestays</button></li>
            </ul>
          </div>

          {/* Community & Transport */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Local Partners</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => setActiveTab('experiences')} className="hover:text-white transition cursor-pointer">Community Experiences</button></li>
              <li><button onClick={() => setActiveTab('food')} className="hover:text-white transition cursor-pointer">Taste Local & Cuisine</button></li>
              <li><button onClick={() => setActiveTab('guides')} className="hover:text-white transition cursor-pointer">Verified Tour Guides</button></li>
              <li><button onClick={() => setActiveTab('transport')} className="hover:text-white transition cursor-pointer">Multi-Modal Transport</button></li>
              <li><button onClick={() => setActiveTab('business')} className="hover:text-white transition cursor-pointer">Local Business Portal</button></li>
            </ul>
          </div>

          {/* Emergency Helplines & Safety */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>24/7 Safety Hotlines</span>
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center bg-slate-800/60 p-1.5 rounded-lg px-2">
                <span>National Emergency:</span>
                <strong className="text-red-400 font-bold">112</strong>
              </div>
              <div className="flex justify-between items-center bg-slate-800/60 p-1.5 rounded-lg px-2">
                <span>Tourist 24/7 Desk:</span>
                <strong className="text-amber-400 font-bold">1363</strong>
              </div>
              <div className="flex justify-between items-center bg-slate-800/60 p-1.5 rounded-lg px-2">
                <span>Medical Ambulance:</span>
                <strong className="text-rose-400 font-bold">108</strong>
              </div>
            </div>
            <button
              onClick={() => setIsSOSModalOpen(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer shadow-sm"
            >
              Open Safety SOS Modal
            </button>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 <strong>TripEase</strong>. All rights reserved. Built for Smart India Hackathon 2026.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Designed with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for Indian Tourism Innovation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
