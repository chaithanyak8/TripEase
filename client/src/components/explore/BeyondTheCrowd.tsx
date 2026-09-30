import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ListingImage } from '../common/ListingImage';
import { Sparkles, HeartHandshake, ArrowRight, MapPin, Search } from 'lucide-react';
import { apiUrl } from '../../utils/api';

export const BeyondTheCrowd: React.FC = () => {
  const { setActiveTab, setSelectedDestinationForPlan, setSelectedDestination: setSelectedDestinationContext } = useApp();
  const [gems, setGems] = useState<any[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [destinationNames, setDestinationNames] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState('All');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCrowd, setSelectedCrowd] = useState('All');
  const [onlyBeyondCrowd, setOnlyBeyondCrowd] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedState !== 'All') params.set('state', selectedState);
      if (selectedDestination !== 'All') params.set('destination', selectedDestination);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedCrowd !== 'All') params.set('crowdLevel', selectedCrowd);
      if (onlyBeyondCrowd) params.set('beyondTheCrowd', 'true');
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      try {
        const response = await fetch(apiUrl(`/api/attractions?${params}`), { signal: controller.signal });
        if (!response.ok) throw new Error('Attraction request failed');
        const data = await response.json();
        setGems(data.attractions || []);
        setStates(data.states || []);
        setDestinationNames(data.destinations || []);
        setCategories(data.categories || []);
        setLoadError(false);
      } catch {
        if (!controller.signal.aborted) {
          setGems([]);
          setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedState, selectedDestination, selectedCategory, selectedCrowd, onlyBeyondCrowd, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TripEase Innovation • Distributive Tourism</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Discover Beyond The Crowd
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          Explore destination points of interest with lower crowd indicators, useful local context, and practical planning details. Venue hours, access, and crowd levels are sample guidance; confirm locally before travel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search attractions, cities, or states..." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500" />
        </div>
        <select value={selectedState} onChange={event => setSelectedState(event.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <option value="All">All states/UTs</option>
          {states.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
        <select value={selectedDestination} onChange={event => setSelectedDestination(event.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <option value="All">All destinations</option>
          {destinationNames.map(destination => <option key={destination} value={destination}>{destination}</option>)}
        </select>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
          <select value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <option value="All">All categories</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <select value={selectedCrowd} onChange={event => setSelectedCrowd(event.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <option value="All">All crowd levels</option><option value="Low">Low</option><option value="Moderate">Moderate</option><option value="High">High</option>
          </select>
          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-700">
            <input type="checkbox" checked={onlyBeyondCrowd} onChange={event => setOnlyBeyondCrowd(event.target.checked)} />
            Beyond Crowd Only
          </label>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500" role="status">Loading attractions...</p>}
      {loadError && <p className="text-sm text-amber-800" role="status">Unable to load live attractions right now. Try Explore India when the connection is restored.</p>}
      {!loading && !loadError && gems.length === 0 && <p className="text-sm text-slate-500">No attractions match these filters. Try another category, state, or search.</p>}

      {/* Community Gems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gems.map(gem => (
          <div
            key={gem.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-elevated transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48">
                <ListingImage src={gem.image} alt={gem.name} className="h-full w-full" />
                <span className="absolute top-3 left-3 bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {gem.state}
                </span>
                <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                  {gem.crowdLevel} Crowd
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">{gem.name}</h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>{gem.destination}, {gem.state} · {gem.category}</span>
                  </div>
                </div>

                {/* Crowd indicator */}
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <span className="font-bold text-slate-700">Crowd level: {gem.crowdLevel}</span>
                  <p className="text-[10px] text-slate-500">Sample indicator; crowd conditions change by date and time.</p>
                </div>

                {/* Economic Impact Badge */}
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-2 text-xs text-emerald-900 font-medium">
                  <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Sample attraction recommendation. Confirm access, hours, fees, and local guidance with the venue.</span>
                </div>

                {/* Highlights */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experiences:</span>
                  <div className="flex flex-wrap gap-1">
                    {(gem.activities || gem.nearbyAttractions || []).map((highlight: string) => (
                      <span key={highlight} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => {
                  const target = gem.destinationRecord;
                  if (target) {
                    setSelectedDestinationContext(target);
                    setSelectedDestinationForPlan(target);
                  }
                  setActiveTab('planner');
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Plan Offbeat Journey</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
