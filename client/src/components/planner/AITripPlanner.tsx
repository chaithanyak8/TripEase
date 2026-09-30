import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiUrl } from '../../utils/api';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Compass,
  Utensils,
  Hotel,
  Bus,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sun,
  Edit2,
  Check,
  RotateCcw,
  Zap,
  Save,
  Sliders,
  DollarSign
} from 'lucide-react';

export const AITripPlanner: React.FC = () => {
  const {
    activeTrip,
    setActiveTrip,
    activateTrip,
    saveTripToWallet,
    modifyItinerary,
    setActiveTab,
    showToast,
    selectedDestinationForPlan,
    t
  } = useApp();

  const [origin, setOrigin] = useState("Bengaluru");
  const [destination, setDestination] = useState(selectedDestinationForPlan?.name || "");
  const [durationDays, setDurationDays] = useState(4);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(15000);
  const [travelType, setTravelType] = useState("Relaxed & Cultural");
  const [foodPreference, setFoodPreference] = useState("Authentic Local (Veg + Non-Veg)");
  const [transportPref, setTransportPref] = useState("KSRTC Public Bus / Vande Bharat Train");
  const [naturalQuery, setNaturalQuery] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editActivityText, setEditActivityText] = useState("");

  const syncNaturalQuery = (updates: Partial<{
    origin: string;
    destination: string;
    durationDays: number;
    travelers: number;
    budget: number;
  }> = {}) => {
    const nextOrigin = updates.origin ?? origin;
    const nextDestination = updates.destination ?? destination;
    const nextDuration = updates.durationDays ?? durationDays;
    const nextTravelers = updates.travelers ?? travelers;
    const nextBudget = updates.budget ?? budget;
    setNaturalQuery(`Plan a ${nextDuration}-day trip from ${nextOrigin} to ${nextDestination} under ₹${nextBudget} for ${nextTravelers} people`);
  };

  useEffect(() => {
    if (selectedDestinationForPlan?.name) {
      setDestination(selectedDestinationForPlan.name);
      setNaturalQuery(`Plan a ${durationDays}-day trip from ${origin} to ${selectedDestinationForPlan.name} under ₹${budget} for ${travelers} people`);
    }
  }, [selectedDestinationForPlan]);

  useEffect(() => {
    if (!activeTrip) return;

    setOrigin(activeTrip.origin || "Bengaluru");
    setDestination(activeTrip.destination || destination);
    setDurationDays(activeTrip.durationDays || durationDays);
    setTravelers(activeTrip.travelers || travelers);
    setBudget(activeTrip.totalBudget || budget);
    setTravelType(activeTrip.travelStyle || activeTrip.travelType || travelType);

    const summaryPrompt = `Plan a ${activeTrip.durationDays || durationDays}-day trip from ${activeTrip.origin || origin} to ${activeTrip.destination || destination} under ₹${activeTrip.totalBudget || budget} for ${activeTrip.travelers || travelers} people with ${activeTrip.travelStyle || activeTrip.travelType || travelType}`;
    setNaturalQuery(summaryPrompt);
  }, [activeTrip]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!destination || !destination.trim()) && !naturalQuery.trim()) {
      showToast("Please enter a destination before generating a trip.");
      return;
    }
    setActiveTrip(null);
    setIsGenerating(true);

    const plannerRequest = {
      naturalLanguageQuery: naturalQuery,
      origin,
      destinationName: destination,
      durationDays,
      travelers,
      budget,
      travelType,
      travelStyle: travelType,
      foodPreference,
      transportPref
    };

    try {
      const res = await fetch(apiUrl('/api/itineraries/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plannerRequest)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requestedDestination !== data.itinerary?.destination) {
          console.error('Requested and generated destinations differ:', data);
          showToast("The generated destination did not match your request. Please try again.");
          return;
        }
        activateTrip(data.itinerary);
        showToast("✨ AI Itinerary successfully generated!");
      } else {
        const error = await res.json().catch(() => ({}));
        showToast(error.error || "Generation failed, please try again.");
      }
    } catch (err) {
      console.error("Generate error:", err);
      showToast("Generation failed, please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartEdit = (dayIdx: number, slot: 'morning' | 'afternoon' | 'evening', currentText: string) => {
    setEditingDayIndex(dayIdx);
    setEditActivityText(currentText);
  };

  const handleSaveEdit = (dayIdx: number, slot: 'morning' | 'afternoon' | 'evening') => {
    if (!activeTrip) return;
    const updated = JSON.parse(JSON.stringify(activeTrip));
    updated.days[dayIdx][slot].activity = editActivityText;
    setActiveTrip(updated);
    setEditingDayIndex(null);
    showToast("Updated day plan activity!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Header and natural language bar */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>AI Trip Planner Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Design Your Personalized Indian Journey
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 max-w-2xl">
              Type naturally or configure below. TripEase balances day-by-day activities, verified stays, transport fares, and local food with zero manual math.
            </p>
          </div>

          {activeTrip && (
            <div className="flex items-center gap-2">
              <button
                onClick={saveTripToWallet}
                className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-emerald-600" />
                <span>{t('saveTrip')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Natural Language Prompt Input */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={naturalQuery}
              onChange={e => setNaturalQuery(e.target.value)}
              placeholder="e.g. Plan a 4-day trip from Bengaluru to Goa under ₹15,000 for two"
              className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm px-4 py-3 rounded-xl border border-transparent focus:border-sky-400 outline-none font-medium"
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-md"
            >
              {isGenerating ? (
                <span>Synthesizing...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-300" />
                  <span>Synthesize Plan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Structured Inputs Accordion/Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 text-xs">
          <div className="bg-black/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-sky-200 block font-bold">Origin</span>
            <input
              type="text"
              value={origin}
                onChange={e => {
                  setOrigin(e.target.value);
                  syncNaturalQuery({ origin: e.target.value });
                }}
              className="bg-transparent font-bold text-white outline-none w-full"
            />
          </div>

          <div className="bg-black/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-sky-200 block font-bold">Destination</span>
            <input
              type="text"
              value={destination}
                onChange={e => {
                  setDestination(e.target.value);
                  syncNaturalQuery({ destination: e.target.value });
                }}
              className="bg-transparent font-bold text-white outline-none w-full"
            />
          </div>

          <div className="bg-black/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-sky-200 block font-bold">Duration</span>
            <select
              value={durationDays}
              onChange={e => {
                const value = Number(e.target.value);
                setDurationDays(value);
                syncNaturalQuery({ durationDays: value });
              }}
              className="bg-transparent font-bold text-white outline-none w-full"
            >
              {[2, 3, 4, 5, 7].map(d => (
                <option key={d} value={d} className="text-slate-900">{d} Days</option>
              ))}
            </select>
          </div>

          <div className="bg-black/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-sky-200 block font-bold">Travelers</span>
            <select
              value={travelers}
              onChange={e => {
                const value = Number(e.target.value);
                setTravelers(value);
                syncNaturalQuery({ travelers: value });
              }}
              className="bg-transparent font-bold text-white outline-none w-full"
            >
              {[1, 2, 3, 4, 6].map(num => (
                <option key={num} value={num} className="text-slate-900">{num} Person{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div className="bg-black/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-sky-200 block font-bold">Total Budget</span>
            <input
              type="number"
              value={budget}
              onChange={e => {
                const value = Number(e.target.value);
                setBudget(value);
                syncNaturalQuery({ budget: value });
              }}
              className="bg-transparent font-bold text-white outline-none w-full"
            />
          </div>

          <div className="bg-black/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-sky-200 block font-bold">Travel Style</span>
            <select
              value={travelType}
              onChange={e => setTravelType(e.target.value)}
              className="bg-transparent font-bold text-white outline-none w-full text-[11px]"
            >
              <option value="Relaxed & Cultural" className="text-slate-900">Relaxed & Culture</option>
              <option value="Adventure & Water Sports" className="text-slate-900">Adventure & Sports</option>
              <option value="Food & Heritage" className="text-slate-900">Food & Heritage</option>
              <option value="Budget Backpacker" className="text-slate-900">Budget Backpacker</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generated Itinerary Section */}
      {activeTrip && (
        <div className="space-y-6">
          {/* Quick Modifier Action Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-800">Quick AI Modifiers:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => modifyItinerary("More Adventure")}
                className="text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                🧗 {t('moreAdventure')}
              </button>

              <button
                onClick={() => modifyItinerary("More Relaxed")}
                className="text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                🌿 {t('moreRelaxed')}
              </button>

              <button
                onClick={() => modifyItinerary("Family Friendly")}
                className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                👨‍👩‍👧 {t('familyFriendly')}
              </button>

              <button
                onClick={() => modifyItinerary("Change Budget", budget * 0.85)}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                💰 -15% Budget
              </button>

              <button
                onClick={() => handleGenerate()}
                className="text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('regenerate')}</span>
              </button>
            </div>
          </div>

          {/* Trip Summary Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination</span>
              <h3 className="font-black text-sm text-slate-900">{activeTrip.destination}</h3>
              <p className="text-xs text-slate-500">{activeTrip.durationDays} Days • {activeTrip.travelers} Travelers</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Budget</span>
              <h3 className="font-black text-base text-emerald-600">₹{activeTrip.totalBudget.toLocaleString()}</h3>
              <p className="text-xs text-slate-500">Est. Cost: ₹{activeTrip.estimatedCost?.toLocaleString() || activeTrip.spent?.toLocaleString()}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weather Advisory</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{activeTrip.weatherSummary || 'Forecast unavailable'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">{activeTrip.weatherAlert || "Optimal conditions."}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety & Etiquette</span>
              <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Local safety guidance</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">{activeTrip.safetyTip || "Lifeguards on duty."}</p>
            </div>
          </div>

          {/* Day-by-Day Schedule Timeline */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Day-by-Day Itinerary Schedule</span>
            </h2>

            <div className="space-y-4">
              {activeTrip.days.map((dayPlan, dayIdx) => (
                <div
                  key={dayPlan.day}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                        D{dayPlan.day}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{dayPlan.title}</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/60 px-2.5 py-0.5 rounded-full">
                      {dayPlan.theme}
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Morning */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-sky-800">
                          🌅 Morning
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{dayPlan.morning.time}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {dayPlan.morning.activity}
                      </p>
                      <div className="pt-2 border-t border-sky-200/50 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Cost: <strong>₹{dayPlan.morning.cost}</strong></span>
                        <span className="text-sky-800 font-semibold">{dayPlan.morning.location}</span>
                      </div>
                    </div>

                    {/* Afternoon */}
                    <div className="p-3.5 rounded-2xl bg-cyan-50/50 border border-cyan-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-cyan-800">
                          ☀️ Afternoon
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{dayPlan.afternoon.time}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {dayPlan.afternoon.activity}
                      </p>
                      <div className="pt-2 border-t border-cyan-200/50 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Cost: <strong>₹{dayPlan.afternoon.cost}</strong></span>
                        <span className="text-cyan-800 font-semibold">{dayPlan.afternoon.location}</span>
                      </div>
                    </div>

                    {/* Evening */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-800">
                          🌇 Evening
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{dayPlan.evening.time}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {dayPlan.evening.activity}
                      </p>
                      <div className="pt-2 border-t border-purple-200/50 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Cost: <strong>₹{dayPlan.evening.cost}</strong></span>
                        <span className="text-purple-800 font-semibold">{dayPlan.evening.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integrated Booked Components Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recommended Hotel */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-sm text-slate-900">Recommended Accommodation</h3>
                </div>
                <button
                  onClick={() => setActiveTab('hotels')}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  Change Hotel
                </button>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">
                    {activeTrip.hotel?.name || `Accommodation in ${activeTrip.destination}`}
                  </div>
                  <div className="text-slate-500 text-[11px]">{activeTrip.hotel?.type || 'Destination-specific stay'}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">
                    {activeTrip.hotel?.pricePerNight ? `₹${activeTrip.hotel.pricePerNight.toLocaleString()}/night` : 'Check availability'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transport Option */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Recommended Transportation</h3>
                </div>
                <button
                  onClick={() => setActiveTab('transport')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  View Options
                </button>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">
                    {activeTrip.transport?.type || `Transport to ${activeTrip.destination}`}
                  </div>
                  <div className="text-slate-500 text-[11px]">{activeTrip.origin} → {activeTrip.destination}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">
                    {activeTrip.transport?.estimatedCost ? `From ₹${activeTrip.transport.estimatedCost.toLocaleString()}/person` : 'Check schedules'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
