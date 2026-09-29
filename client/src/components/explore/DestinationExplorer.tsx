import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ListingImage } from '../common/ListingImage';
import { Destination } from '../../types';
import {
  MapPin,
  Search,
  Filter,
  Star,
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

export const DestinationExplorer: React.FC = () => {
  const { setActiveTab, setSelectedDestinationForPlan, setSelectedDestination, t } = useApp();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCrowd, setSelectedCrowd] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBeyondCrowd, setOnlyBeyondCrowd] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDestinations();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedState, selectedCrowd, onlyBeyondCrowd, searchQuery]);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const normalizedQuery = searchQuery.trim();
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedState !== 'All') params.set('state', selectedState);
      if (selectedCrowd !== 'All') params.set('crowdLevel', selectedCrowd);
      if (onlyBeyondCrowd) params.set('beyondTheCrowd', 'true');
      if (normalizedQuery) params.set('search', normalizedQuery);

      const res = await fetch(`http://localhost:5000/api/destinations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDestinations(data.destinations || []);
        setAvailableStates(data.states || []);
        setAvailableCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Fetch destinations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...availableCategories];
  const states = ['All', ...availableStates];

  const filtered = destinations.filter(d => {
    if (selectedCrowd !== 'All' && d.crowdLevel !== selectedCrowd) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.popularActivities.some(a => a.toLowerCase().includes(q)) ||
        d.categories?.some(category => category.toLowerCase().includes(q)) ||
        d.topAttractions?.some(attraction => attraction.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handlePlanHere = (dest: Destination) => {
    setSelectedDestination(dest);
    setSelectedDestinationForPlan(dest);
    setActiveTab('planner');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart Destination Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Explore Incredible India With Context
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl">
          Discover certified heritage sites, serene coastlines, misty mountains, and community-led hidden gems across 10+ states with real-time crowd indicators and safety ratings.
        </p>

        {/* Search Bar */}
        <div className="pt-2 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by city, temple, beach, or activity..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 text-white placeholder:text-slate-300 text-xs sm:text-sm rounded-xl border border-white/20 focus:border-emerald-400 outline-none backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* State & Crowd Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">State:</span>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="bg-slate-100 font-semibold text-slate-800 px-2.5 py-1.5 rounded-xl outline-none border border-slate-200"
            >
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Crowd:</span>
            <select
              value={selectedCrowd}
              onChange={e => setSelectedCrowd(e.target.value)}
              className="bg-slate-100 font-semibold text-slate-800 px-2.5 py-1.5 rounded-xl outline-none border border-slate-200"
            >
              <option value="All">All Crowd Levels</option>
              <option value="Low">Low (Peaceful & Quiet)</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Beyond the crowd toggle */}
          <button
            onClick={() => setOnlyBeyondCrowd(!onlyBeyondCrowd)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              onlyBeyondCrowd
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${onlyBeyondCrowd ? 'text-white' : 'text-sky-600'}`} />
            <span>Beyond The Crowd Only</span>
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500" role="status">Loading destinations...</p>}
      {!loading && filtered.length === 0 && <p className="text-sm text-slate-500">No destinations match those filters. Try another category, state, or search.</p>}

      {/* Destinations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(dest => (
          <div
            key={dest.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-elevated transition duration-200 flex flex-col group"
          >
            {/* Image */}
            <div className="relative h-52 overflow-hidden">
              <ListingImage src={dest.image} alt={dest.name} className="h-full w-full group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                <span className="bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {dest.category}
                </span>
                {dest.isBeyondTheCrowd && (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                    ✨ Beyond Crowd
                  </span>
                )}
              </div>

              {/* Safety Badge */}
              <div className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>{dest.safetyRating} Safety</span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-600 uppercase tracking-wider text-[11px]">
                    {dest.state} • {dest.region}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dest.crowdLevel === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {dest.crowdLevel} Crowd
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {dest.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {dest.description}
                </p>

                {dest.beyondCrowdReason && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900 font-medium">
                    {dest.beyondCrowdReason}
                  </div>
                )}

                {/* Popular Activities Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {dest.popularActivities.slice(0, 3).map((act, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      {act}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Best Season</span>
                  <strong className="text-slate-800">{dest.bestTimeToVisit}</strong>
                </div>

                <button
                  onClick={() => handlePlanHere(dest)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>Plan Trip</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
