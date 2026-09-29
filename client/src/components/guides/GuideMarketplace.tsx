import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useListingDestination } from '../../hooks/useListingDestination';
import { ListingImage } from '../common/ListingImage';
import { getDemoListingData, loadListingCollection } from '../../data/listingData';
import { LocalGuide } from '../../types';
import {
  Users,
  ShieldCheck,
  Star,
  Globe,
  Award,
  MessageSquare,
  Calendar,
  Send,
  Check,
  Search,
  X
} from 'lucide-react';

export const GuideMarketplace: React.FC = () => {
  const { activeTrip, addBooking, setActiveTab, showToast } = useApp();
  const { destination, destinationId } = useListingDestination();
  const [guides, setGuides] = useState<LocalGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingNotice, setListingNotice] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatGuide, setChatGuide] = useState<LocalGuide | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'guide'; text: string }>>([
    { sender: 'guide', text: "Namaskara! I am ready to guide you on local architecture and hidden spots. What dates are you visiting?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [bookingGuide, setBookingGuide] = useState<LocalGuide | null>(null);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  useEffect(() => {
    setChatGuide(null);
    setBookingGuide(null);
    setBookedSuccess(false);
    setChatMessages([{ sender: 'guide', text: activeTrip
      ? `Welcome to ${activeTrip.destination}. Ask me about local sites, activities, or your trip dates.`
      : `Welcome to ${destination || 'your destination'}. Ask me about local sites, activities, or your visit.` }]);
  }, [activeTrip?.id, activeTrip?.destination, destination]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGuides(controller.signal);
    return () => controller.abort();
  }, [selectedLanguage, destination, destinationId]);

  const fetchGuides = async (signal: AbortSignal) => {
    setLoading(true);
    setGuides([]);
    setListingNotice('');
    if (!destination) {
      setListingNotice('Choose a destination to browse local guides.');
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ destination });
    if (selectedLanguage !== 'All') params.set('language', selectedLanguage);
    if (destinationId) params.set('destinationId', destinationId);
    const fallback = getDemoListingData(destination).guides;
    const result = await loadListingCollection<LocalGuide>(`http://localhost:5000/api/guides?${params}`, 'guides', fallback, signal);
    if (signal.aborted) return;
    setGuides(result.items);
    setListingNotice(result.requestFailed
      ? 'Unable to load live listings right now. Showing TripEase demo recommendations.'
      : result.usedFallback ? `Showing TripEase demo recommendations for ${destination}.` : '');
    setLoading(false);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'guide', text: "That sounds great! I have full availability on those days. Let's explore the morning heritage walk together!" }
      ]);
    }, 700);
  };

  const handleConfirmBookGuide = async () => {
    if (!bookingGuide) return;
    try {
      const res = await fetch('http://localhost:5000/api/guides/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guideId: bookingGuide.id, days: activeTrip?.durationDays || 1, travelers: activeTrip?.travelers || 1 })
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

  const languages = ['All', 'Kannada', 'Hindi', 'English', 'French', 'Kodava', 'Marwari'];

  const filtered = guides.filter(g => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        g.destinationName.toLowerCase().includes(q) ||
        g.languages.some(language => language.toLowerCase().includes(q)) ||
        g.expertise.some(e => e.toLowerCase().includes(q))
      );
    }
    return selectedLanguage === 'All' || g.languages.some(language => language.toLowerCase() === selectedLanguage.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local Guides & Storytellers</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Explore With Local Storytellers
        </h1>
        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
          Meet local storytellers and explore heritage, food, nature, beaches, and neighborhood history with destination-aware guide profiles.
        </p>

        {/* Search */}
        <div className="pt-2 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search guide by name, city, or expertise..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl outline-none"
            />
          </div>
        </div>
      </div>

      {destination && <p className="text-xs text-slate-500">Guides for {destination}</p>}
      {listingNotice && <p className="text-xs text-slate-500" role="status">{listingNotice}</p>}
      {loading && <p className="text-sm text-slate-500" role="status">Loading local guides...</p>}

      {/* Language Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Languages:</span>
        {languages.map(lang => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedLanguage === lang
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(guide => (
          <div
            key={guide.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-elevated transition duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-48">
                <ListingImage src={guide.photo} alt={guide.name} className="h-full w-full group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-3 left-3 bg-slate-950/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  {guide.verified === false ? <span className="text-amber-300">Demo</span> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                  <span>{guide.verifiedBadge}</span>
                </span>
                <span className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{guide.rating}</span>
                </span>
              </div>

              <div className="p-4 space-y-2.5">
                <div>
                  <h3 className="font-black text-base text-slate-900">{guide.name}</h3>
                  <div className="text-xs text-sky-600 font-semibold">{guide.destinationName}</div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {guide.bio}
                </p>

                {/* Languages */}
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{guide.languages.join(', ')}</span>
                </div>
                <div className="text-[10px] text-slate-500">{guide.experienceYears} years experience · {guide.reviewsCount} demo reviews</div>

                {/* Expertise */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expertise:</span>
                  <div className="flex flex-wrap gap-1">
                    {guide.expertise.slice(0, 2).map((exp, i) => (
                      <span key={i} className="text-[10px] bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md font-medium">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Daily Fee</span>
                <strong className="text-base font-black text-slate-900">₹{guide.dailyFee}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setChatGuide(guide);
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Chat with guide"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => {
                    setBookingGuide(guide);
                    setBookedSuccess(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Book Guide
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && filtered.length === 0 && <p className="text-sm text-slate-500">No guides match those filters for {destination}.</p>}

      {/* Guide Chat Drawer */}
      {chatGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[460px] animate-slideUp">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={chatGuide.photo} alt={chatGuide.name} className="w-8 h-8 rounded-full object-cover border border-white" />
                <div>
                  <h4 className="font-bold text-xs">{chatGuide.name}</h4>
                  <span className="text-[10px] text-emerald-400">● Active Online</span>
                </div>
              </div>
              <button onClick={() => setChatGuide(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50 text-xs">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2.5 rounded-2xl max-w-[85%] ${m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChatMessage} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask guide a question..."
                className="flex-1 text-xs px-3 py-2 bg-slate-100 rounded-xl outline-none"
              />
              <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl cursor-pointer">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guide Booking Modal */}
      {bookingGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            {!bookedSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-base text-slate-900">Book Local Guide</h3>
                    <p className="text-xs text-slate-500">{bookingGuide.name}</p>
                  </div>
                  <button onClick={() => setBookingGuide(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <strong>{bookingGuide.destinationName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Experience:</span>
                    <strong>{bookingGuide.experienceYears} Years</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">License:</span>
                    <strong className="text-emerald-700">{bookingGuide.verifiedBadge}</strong>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="font-bold text-blue-900">Fee for 1 Full Day:</span>
                    <strong className="text-base font-black text-blue-700">₹{bookingGuide.dailyFee}</strong>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button onClick={() => setBookingGuide(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleConfirmBookGuide} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-md">
                    Confirm Guide
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Guide Reserved!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {bookingGuide.name} has accepted your booking request. Details and phone contact have been added to your <strong>Travel Wallet</strong>.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setBookingGuide(null);
                    setActiveTab('wallet');
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md"
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
