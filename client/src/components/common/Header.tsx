import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, Language } from '../../types';
import {
  Compass,
  MapPin,
  Calendar,
  Hotel,
  Sparkles,
  UtensilsCrossed,
  Users,
  Bus,
  ShieldAlert,
  Wallet,
  Bell,
  Sun,
  Moon,
  Type,
  Wifi,
  WifiOff,
  ChevronDown,
  Layers,
  Award,
  Zap,
  HelpCircle,
  Search,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const {
    t,
    language,
    setLanguage,
    activeTab,
    setActiveTab,
    role,
    setRole,
    user,
    unreadNotificationsCount,
    setIsSOSModalOpen,
    highContrast,
    toggleHighContrast,
    largeFont,
    toggleLargeFont,
    offlineMode,
    toggleOfflineMode,
    loadJudgeDemoMode,
    activeTripBookings,
    activeTrip,
    setSelectedDestination,
    setSelectedDestinationForPlan,
    setListingDestinationOverride,
    clearActiveTrip,
    setIsTravelDNAOpen,
    setIsOnboardingOpen
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  useEffect(() => {
    if (globalSearchQuery.trim().length < 2) {
      setGlobalSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(globalSearchQuery.trim())}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Search request failed');
        const data = await response.json();
        if (!controller.signal.aborted) setGlobalSearchResults(data.results || []);
      } catch {
        if (!controller.signal.aborted) setGlobalSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearchLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [globalSearchQuery]);

  const handleGlobalSearchResult = (result: any) => {
    const destination = result.destinationRecord;
    if (destination) {
      setListingDestinationOverride(destination);
      setSelectedDestination(destination);
      setSelectedDestinationForPlan(destination);
    }
    const tabByType: Record<string, string> = {
      destination: 'explore', attraction: 'beyond-crowd', hotel: 'hotels', restaurant: 'food', experience: 'experiences', guide: 'guides'
    };
    setActiveTab(tabByType[result.type] || 'explore');
    setIsSearchOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'planner', label: t('planMyTrip'), icon: Calendar, badge: 'AI' },
    { id: 'explore', label: t('exploreIndia'), icon: MapPin },
    { id: 'beyond-crowd', label: 'Beyond Crowd', icon: Sparkles, highlight: true },
    { id: 'map', label: t('smartMap'), icon: Layers },
    { id: 'hotels', label: t('stays'), icon: Hotel },
    { id: 'experiences', label: t('experiences'), icon: Award },
    { id: 'food', label: t('tasteLocal'), icon: UtensilsCrossed },
    { id: 'guides', label: t('guides'), icon: Users },
    { id: 'transport', label: t('transport'), icon: Bus },
    { id: 'safety', label: t('safetyCenter'), icon: ShieldAlert }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-colors duration-200">
      {/* Top Utility Bar for Demo Mode & Accessibility */}
      <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 text-white text-xs px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-3">
          {activeTrip && (
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1">
              <MapPin className="h-3.5 w-3.5 text-white" />
              <button
                onClick={() => setActiveTab('planner')}
                className="text-left leading-tight text-white"
                title="Open active trip"
              >
                <span className="block text-[9px] font-bold uppercase">Active Trip</span>
                <span className="block max-w-40 truncate text-[11px] font-bold">
                  {activeTrip.destination} · {activeTrip.durationDays}d · {activeTrip.travelers} travelers · ₹{activeTrip.totalBudget.toLocaleString()}
                </span>
              </button>
              <button
                onClick={clearActiveTrip}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white/80 hover:bg-white/15 hover:text-white"
                title="Clear active trip"
              >
                Clear
              </button>
            </div>
          )}
          {/* 1-Click Judge Demo Mode */}
          <button
            onClick={loadJudgeDemoMode}
            className="flex items-center gap-1.5 bg-white text-sky-900 font-bold px-2.5 py-0.5 rounded-full shadow hover:bg-sky-50 transition text-[11px] cursor-pointer animate-pulse"
            title="Load Pre-configured 4-Day Karnataka Trip with Bookings, Itinerary & Wallet"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-sky-600" />
            <span>Judge Demo Mode</span>
          </button>

          {/* Offline Toggle */}
          <button
            onClick={toggleOfflineMode}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer text-[11px] ${
              offlineMode ? 'bg-emerald-500 text-white font-bold' : 'bg-white/10 hover:bg-white/20'
            }`}
            title="Toggle Offline Travel Mode"
          >
            {offlineMode ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            <span className="hidden md:inline">{offlineMode ? 'Offline Mode' : 'Online'}</span>
          </button>

          {/* Accessibility controls */}
          <div className="flex items-center gap-1 border-l border-white/30 pl-2">
            <button
              onClick={toggleHighContrast}
              className={`p-1 rounded cursor-pointer transition ${highContrast ? 'bg-white text-black' : 'hover:bg-white/20'}`}
              title="Toggle High Contrast Mode"
              aria-label="High contrast"
            >
              {highContrast ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            </button>
            <button
              onClick={toggleLargeFont}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${largeFont ? 'bg-white text-black' : 'hover:bg-white/20'}`}
              title="Toggle Text Size"
              aria-label="Text size"
            >
              <Type className="w-3 h-3 inline" />
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-black/20 rounded p-0.5 text-[11px]">
            {(['en', 'hi', 'kn'] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-1.5 py-0.5 rounded uppercase font-semibold transition cursor-pointer ${
                  language === lang ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                  Trip<span className="text-sky-600">Ease</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5 hidden sm:block">
                {t('brandTagline')}
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-100 text-sky-700 shadow-xs'
                    : item.highlight
                    ? 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : item.highlight ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-sky-600 text-white text-[9px] px-1 py-0.2 rounded font-extrabold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side Actions: SOS, Wallet, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
            aria-label="Search TripEase"
            title="Search India"
          >
            <Search className="w-4 h-4" />
          </button>
          {/* Prominent Emergency SOS Button */}
          <button
            onClick={() => setIsSOSModalOpen(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md shadow-red-500/25 transition cursor-pointer active:scale-95"
            title="Open Emergency SOS Assistance"
          >
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            <span className="font-extrabold tracking-wide hidden sm:inline">{t('emergencySOS')}</span>
            <span className="sm:hidden font-extrabold">SOS</span>
          </button>

          {/* Travel Wallet Button with badge */}
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl transition cursor-pointer border ${
              activeTab === 'wallet'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Digital Travel Wallet (Bookings & Offline Passes)"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden md:inline">{t('myWallet')}</span>
            {activeTripBookings.length > 0 && (
              <span className="bg-emerald-700 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeTripBookings.length}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Trip Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-600 animate-ping" />
            )}
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-600" />
            )}
          </button>

          {/* Role Switcher (Tourist, Business, Guide, Admin) */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-2 rounded-xl transition cursor-pointer border border-slate-200"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline capitalize">{role.toLowerCase()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-elevated border border-slate-100 py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Active Role
                </div>
                {(['USER', 'BUSINESS', 'GUIDE', 'ADMIN'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setIsRoleDropdownOpen(false);
                      if (r === 'BUSINESS') setActiveTab('business');
                      else if (r === 'ADMIN') setActiveTab('admin');
                      else if (r === 'GUIDE') setActiveTab('guides');
                      else setActiveTab('home');
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${
                      role === r ? 'text-sky-700 font-bold bg-sky-50' : 'text-slate-700'
                    }`}
                  >
                    <span>
                      {r === 'USER' && '👤 Tourist Mode'}
                      {r === 'BUSINESS' && '🏪 Local Business Portal'}
                      {r === 'GUIDE' && '🧭 Verified Guide Portal'}
                      {r === 'ADMIN' && '🏛️ SIH Admin Panel'}
                    </span>
                    {role === r && <span className="text-sky-600 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Travel DNA Badge */}
          <button
            onClick={() => setIsTravelDNAOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold px-2 py-1.5 rounded-xl hover:shadow-xs transition cursor-pointer"
            title="View & Edit Travel DNA Profile"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span className="max-w-[90px] truncate">{user.travelDNA.archetype.split(' ')[0]}</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/40 p-4 flex items-start justify-center" onMouseDown={event => { if (event.target === event.currentTarget) setIsSearchOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label="Search TripEase" className="mt-[10vh] w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-slate-200">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                autoFocus
                value={globalSearchQuery}
                onChange={event => setGlobalSearchQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Escape') setIsSearchOpen(false);
                  if (event.key === 'Enter' && globalSearchResults[0]) handleGlobalSearchResult(globalSearchResults[0]);
                }}
                placeholder="Search destinations, attractions, stays, food, guides, or experiences..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                aria-label="Search destinations and travel listings"
              />
              <button type="button" onClick={() => setIsSearchOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close search"><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {isSearchLoading && <p className="px-3 py-4 text-sm text-slate-500" role="status">Searching India...</p>}
              {!isSearchLoading && globalSearchQuery.trim().length >= 2 && globalSearchResults.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">No matching travel results. Try a city, state, attraction, or category.</p>}
              {globalSearchResults.map((result, index) => (
                <button key={`${result.type}-${result.name}-${index}`} onClick={() => handleGlobalSearchResult(result)} className="w-full flex items-start gap-3 rounded-xl p-3 text-left hover:bg-sky-50 focus:bg-sky-50 focus:outline-none">
                  <span className="mt-0.5 rounded-md bg-sky-100 px-2 py-1 text-[10px] font-bold uppercase text-sky-800">{result.type}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{result.name}</span>
                    <span className="block text-xs text-slate-500">{[result.destination, result.state].filter(Boolean).join(' · ')}</span>
                    <span className="mt-1 block text-xs text-slate-500 line-clamp-2">{result.description}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => {
                setIsOnboardingOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="text-sky-600 font-semibold cursor-pointer"
            >
              Update Preferences
            </button>
            <button
              onClick={() => {
                setIsTravelDNAOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="text-slate-700 font-semibold cursor-pointer"
            >
              DNA: {user.travelDNA.archetype}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
