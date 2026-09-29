import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useListingDestination } from '../../hooks/useListingDestination';
import { ListingImage } from '../common/ListingImage';
import { getDemoListingData, loadListingCollection } from '../../data/listingData';
import { LocalExperience } from '../../types';
import {
  Award,
  Sparkles,
  Users,
  Clock,
  Globe,
  Star,
  ShieldCheck,
  HeartHandshake,
  Check,
  Search,
  Filter,
  X
} from 'lucide-react';

export const ExperienceMarketplace: React.FC = () => {
  const { activeTrip, addBooking, setActiveTab, showToast } = useApp();
  const { destination, destinationId } = useListingDestination();
  const [experiences, setExperiences] = useState<LocalExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingNotice, setListingNotice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpForBooking, setSelectedExpForBooking] = useState<LocalExperience | null>(null);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  useEffect(() => {
    setSelectedExpForBooking(null);
    setBookedSuccess(false);
  }, [activeTrip?.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchExperiences(controller.signal);
    return () => controller.abort();
  }, [selectedCategory, destination, destinationId]);

  const fetchExperiences = async (signal: AbortSignal) => {
    setLoading(true);
    setExperiences([]);
    setListingNotice('');
    if (!destination) {
      setListingNotice('Choose a destination to browse experiences.');
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ destination });
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (destinationId) params.set('destinationId', destinationId);
    const fallback = getDemoListingData(destination).experiences;
    const result = await loadListingCollection<LocalExperience>(`http://localhost:5000/api/experiences?${params}`, 'experiences', fallback, signal);
    if (signal.aborted) return;
    setExperiences(result.items);
    setListingNotice(result.requestFailed
      ? 'Unable to load live listings right now. Showing TripEase demo recommendations.'
      : result.usedFallback ? `Showing TripEase demo recommendations for ${destination}.` : '');
    setLoading(false);
  };

  const handleBookExperience = async () => {
    if (!selectedExpForBooking) return;
    try {
      const res = await fetch('http://localhost:5000/api/experiences/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceId: selectedExpForBooking.id, travelers: activeTrip?.travelers || 1 })
      });
      if (res.ok) {
        const data = await res.json();
        addBooking(data.booking);
        setBookedSuccess(true);
      }
    } catch (err) {
      console.error(err);
      showToast("Booking failed");
    }
  };

  const categories = ['All', 'Adventure', 'Handicrafts', 'Food', 'Culture', 'Nature', 'Fishing'];

  const filtered = experiences.filter(e => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.host.toLowerCase().includes(q) ||
        (e.location || '').toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return selectedCategory === 'All' || e.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Local Experience Marketplace</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Direct Community Experiences{destination ? ` in ${destination}` : ' Near You'}
        </h1>
        <p className="text-xs sm:text-sm text-sky-100 max-w-2xl">
          Connect with local storytellers, artisans, nature hosts, and home cooks. Demo availability and details are shown for recommendations.
        </p>

        {/* Search */}
        <div className="pt-2 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search experiences, hosts, or workshops..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl outline-none"
            />
          </div>
        </div>
      </div>

      {listingNotice && <p className="text-xs text-slate-500" role="status">{listingNotice}</p>}
      {loading && <p className="text-sm text-slate-500" role="status">Loading experiences...</p>}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Experiences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(exp => (
          <div
            key={exp.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-elevated transition duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-48">
                <ListingImage src={exp.image} alt={exp.title} className="h-full w-full group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {exp.category}
                </span>
                <span className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{exp.rating}</span>
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-bold text-slate-700">{exp.host}</span>
                  {exp.hostVerified && (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified Host
                    </span>
                  )}
                  {!exp.hostVerified && <span className="text-[9px] text-slate-500">Demo host · verification not provided</span>}
                </div>

                <h3 className="font-black text-base text-slate-900 leading-snug">
                  {exp.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {exp.description}
                </p>

                {/* Duration & Languages */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <strong>{exp.duration}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>{exp.languages.join(', ')}</span>
                  </span>
                </div>
                {exp.location && <div className="text-[10px] text-slate-500">📍 {exp.location}{exp.availableSlots !== undefined ? ` · ${exp.availableSlots} demo slots` : ''}</div>}

                {/* Impact Note */}
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900 font-medium flex items-start gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{exp.impactNote}</span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Per Person</span>
                <strong className="text-base font-black text-slate-900">₹{exp.price}</strong>
              </div>

              <button
                onClick={() => {
                  setSelectedExpForBooking(exp);
                  setBookedSuccess(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                Book Experience
              </button>
            </div>
          </div>
        ))}
      </div>
      {!loading && filtered.length === 0 && <p className="text-sm text-slate-500">No experiences match those filters for {destination}.</p>}

      {/* Booking Modal */}
      {selectedExpForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            {!bookedSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-base text-slate-900">Book Experience</h3>
                    <p className="text-xs text-slate-500">{selectedExpForBooking.title}</p>
                  </div>
                  <button
                    onClick={() => setSelectedExpForBooking(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host:</span>
                    <strong>{selectedExpForBooking.host}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <strong>{selectedExpForBooking.duration}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Travelers:</span>
                    <strong>{activeTrip?.travelers || 1} Persons</strong>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Total Price:</span>
                    <strong className="text-base font-black text-emerald-700">
                      ₹{selectedExpForBooking.price * (activeTrip?.travelers || 1)}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setSelectedExpForBooking(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookExperience}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    Confirm & Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Experience Booked!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your spot for <strong>{selectedExpForBooking.title}</strong> is reserved with host {selectedExpForBooking.host}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedExpForBooking(null);
                    setActiveTab('wallet');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md"
                >
                  View in Travel Wallet ➔
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
