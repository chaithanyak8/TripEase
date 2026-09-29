import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Star,
  Users,
  Building,
  HeartHandshake,
  CheckCircle2,
  TrendingUp,
  Award,
  ChevronRight,
  Zap,
  Coffee,
  Waves,
  Mountain,
  UtensilsCrossed
} from 'lucide-react';

interface LandingPageProps {
  onPlanCustomPrompt: (promptText: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPlanCustomPrompt }) => {
  const { setActiveTab, setIsSOSModalOpen, loadJudgeDemoMode, t } = useApp();
  const [heroPrompt, setHeroPrompt] = useState(
    "I have 3 days, a budget of ₹10,000, traveling with 2 friends, and want beaches, food and adventure."
  );

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroPrompt.trim()) {
      onPlanCustomPrompt(heroPrompt);
      setActiveTab('planner');
    }
  };

  const samplePrompts = [
    "4-day trip from Bengaluru to Goa under ₹15,000 with beaches & local food",
    "Weekend heritage & artisan tour in Hampi & Anegundi under ₹8,000",
    "3 days in Coorg mist with coffee estate homestay & waterfalls for couple"
  ];

  return (
    <div className="space-y-16 pb-16 animate-fadeIn">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-400/25 via-sky-200/35 to-transparent pt-8 sm:pt-14 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Platform Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 border border-sky-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-950 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span>All-in-One Travel & Tourism Super-Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Your Complete Indian Journey.<br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              One Unified Platform.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            No more switching between 10 separate apps for flights, homestays, auto rickshaws, local guides, emergency contacts, and budget sheets. TripEase integrates the full tourist lifecycle with community-first local tourism.
          </p>

          {/* Natural Language Prompt Search Box */}
          <div className="max-w-3xl mx-auto bg-white p-2.5 sm:p-3 rounded-3xl shadow-elevated border border-sky-200/80">
            <form onSubmit={handleHeroSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Compass className="w-5 h-5 text-sky-600 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={heroPrompt}
                    onChange={e => setHeroPrompt(e.target.value)}
                    placeholder={t('naturalPromptPlaceholder')}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-900 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none transition font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md shadow-sky-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('startPlanningBtn')}</span>
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-left pt-1">
                <span className="text-[11px] font-bold text-slate-400 pl-1">Try asking:</span>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setHeroPrompt(p)}
                    className="text-[11px] bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-200 px-2.5 py-1 rounded-full transition cursor-pointer truncate max-w-xs"
                  >
                    "{p.slice(0, 42)}..."
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('planner')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>{t('planMyTrip')}</span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-slate-300 transition cursor-pointer shadow-xs flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{t('exploreIndia')}</span>
            </button>

            <button
              onClick={() => setIsSOSModalOpen(true)}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-red-200 transition cursor-pointer flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>{t('emergencySOS')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. DISCOVER BEYOND THE CROWD SPOTLIGHT (UNIQUE FEATURE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unique Innovation Feature</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Discover Beyond The Crowd
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Instead of funnelling every tourist into overcrowded spots like Calangute or commercial hilltops, TripEase distributes tourism opportunities into rural artisan villages, river islands, and community eco-farms.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <div className="text-xs font-bold text-amber-300">Crowded Hotspot: Baga Beach</div>
                <div className="text-[11px] text-slate-300">92% Crowd Density • Commercial Prices</div>
                <div className="mt-2 text-xs font-bold text-emerald-300">
                  ✨ TripEase Alternative: Divar Island
                </div>
                <div className="text-[11px] text-emerald-100">
                  18% Crowd Density • Historic Portuguese Manors & Fresh Toddy
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <div className="text-xs font-bold text-amber-300">Crowded Hotspot: Hampi Bazaar</div>
                <div className="text-[11px] text-slate-300">High Footfall • Peak Season Lines</div>
                <div className="mt-2 text-xs font-bold text-emerald-300">
                  ✨ TripEase Alternative: Anegundi Village
                </div>
                <div className="text-[11px] text-emerald-100">
                  Banana Fiber Weaving • Ancient Kishkindha Caves & Peace
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('beyond-crowd')}
              className="mt-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2"
            >
              <span>Explore All 8 Beyond-The-Crowd Destinations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. HOW TRIPEASE WORKS (4-STEP ECOSYSTEM) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How TripEase Unifies Your Journey
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            One trip. One platform. Everything connected from departure to return.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "Tell AI Your Vibe & Budget",
              desc: "Enter natural language requirements or structured filters with travel dates and companions.",
              icon: Sparkles,
              color: "text-sky-600 bg-sky-50"
            },
            {
              step: "02",
              title: "Day-by-Day Unified Plan",
              desc: "Morning/afternoon/evening schedule with realistic transit times, weather advice & cost estimates.",
              icon: Calendar,
              color: "text-cyan-600 bg-cyan-50"
            },
            {
              step: "03",
              title: "Direct Local Marketplace",
              desc: "Book verified eco-homestays, authentic regional dishes, and licensed local tour guides without middlemen.",
              icon: Users,
              color: "text-emerald-600 bg-emerald-50"
            },
            {
              step: "04",
              title: "Offline Wallet & SOS",
              desc: "All QR vouchers, offline passes, expense ledgers, and 1-tap emergency safety in one secure app.",
              icon: ShieldAlert,
              color: "text-red-500 bg-red-50"
            }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-200 group-hover:text-sky-600 transition-colors">
                    {item.step}
                  </span>
                  <div className={`p-2.5 rounded-xl ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURED DESTINATIONS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Featured Indian Destinations
            </h2>
            <p className="text-xs text-slate-500">
              Curated across 10+ states with crowd meters and safety ratings
            </p>
          </div>
          <button
            onClick={() => setActiveTab('explore')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              name: "Udupi & Coastal Karnataka",
              state: "Karnataka",
              category: "Beaches & Temples",
              image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=600&q=80",
              budget: "₹2,200/day",
              crowd: "Moderate",
              rating: 4.9,
              desc: "St. Mary's volcanic columnar rocks, pristine Malpe sands, and legendary Ghee Roast cuisine."
            },
            {
              name: "Hampi & Anegundi Corridor",
              state: "Karnataka",
              category: "UNESCO Heritage",
              image: "https://images.unsplash.com/photo-1600100397608-f010f4448553?auto=format&fit=crop&w=600&q=80",
              budget: "₹2,000/day",
              crowd: "Moderate",
              rating: 4.8,
              desc: "14th-century Vijayanagara empire ruins, Tungabhadra coracles, and banana fiber crafts."
            },
            {
              name: "Divar Island Heritage Haven",
              state: "Goa",
              category: "Beyond the Crowd",
              image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80",
              budget: "₹2,200/day",
              crowd: "Low (Untouched)",
              rating: 5.0,
              desc: "Idyllic car-free river island with Portuguese villas, paddy fields, and e-bike village safaris."
            }
          ].map((dest, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-elevated transition duration-200 flex flex-col group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {dest.category}
                </span>
                <span className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{dest.rating}</span>
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">{dest.state}</div>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{dest.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dest.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Est. Budget</span>
                    <strong className="text-slate-900">{dest.budget}</strong>
                  </div>
                  <button
                    onClick={() => setActiveTab('planner')}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Plan Trip
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. BENEFITS FOR TOURISTS VS LOCAL BUSINESSES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* For Tourists */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50/40 p-6 sm:p-8 rounded-3xl border border-sky-200/80 space-y-4">
            <div className="flex items-center gap-2.5 text-sky-700">
              <Users className="w-6 h-6" />
              <h3 className="text-lg font-black">{t('touristBenefitsTitle')}</h3>
            </div>
            <p className="text-xs text-slate-600">
              Everything in one app. From AI-optimized itineraries to verified emergency support.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
              {[
                "Personalized AI day plans tailored to budget & companions",
                "Verified eco-homestays with transparent rates and free cancellation",
                "Authentic local food recommendations with dietary & hygiene tags",
                "Offline travel mode with cached digital tickets & emergency cards",
                "Instant 1-tap SOS assistance and live GPS beacon sharing"
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* For Local Businesses */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-6 sm:p-8 rounded-3xl border border-emerald-200/80 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <Building className="w-6 h-6" />
              <h3 className="text-lg font-black">{t('businessBenefitsTitle')}</h3>
            </div>
            <p className="text-xs text-slate-600">
              Empowering small rural homestays, tour guides, and artisans to be digitally visible.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
              {[
                "Zero commission burden compared to major travel aggregators",
                "Direct tourist inquiries and automated booking notifications",
                "Govt. MSME & Tourism verification badge to build trust",
                "Digital showcase for traditional handicrafts and culinary classes",
                "Informative Tourism Impact tracker highlighting local economic support"
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Loved by Travelers & Local Communities
          </h2>
          <p className="text-xs text-slate-500">
            Real stories from verified tourists and local hosts across India
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              author: "Pooja Hegde & Family",
              role: "Family Vacation • Bengaluru",
              comment: "Having our homestay in Malpe, the auto rickshaw fare estimates, and emergency contacts in one app made traveling with our elderly parents completely stress-free.",
              rating: 5
            },
            {
              author: "Captain Ganesh",
              role: "Local Host • Kodi Bengre Kayaking",
              comment: "As a local fisherman, big corporate platforms ignored us. TripEase put our mangrove kayaking directly onto tourist itineraries. Our village revenue grew 300%!",
              rating: 5
            },
            {
              author: "Arjun Verma",
              role: "Solo Backpacker • Delhi",
              comment: "The 'Beyond The Crowd' feature brought me to Divar Island and Anegundi instead of packed tourist traps. The offline pass worked even in deep valleys without cell reception.",
              rating: 5
            }
          ].map((test, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-1">
                {[...Array(test.rating)].map((_, r) => (
                  <Star key={r} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{test.comment}"
              </p>
              <div className="pt-2 border-t border-slate-100">
                <div className="font-bold text-xs text-slate-900">{test.author}</div>
                <div className="text-[11px] text-slate-400">{test.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. HACKATHON DEMO BANNER CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-current" />
              <span>SIH 2026 Evaluation Ready</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Experience the Full Ecosystem in 60 Seconds
            </h3>
            <p className="text-xs text-sky-100 max-w-xl">
              Click Judge Demo Mode to immediately evaluate Demo Tourist with a complete 4-day Karnataka trip, booked homestay, transport, budget ledger, and offline travel wallet.
            </p>
          </div>
          <button
            onClick={loadJudgeDemoMode}
            className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition cursor-pointer shrink-0"
          >
            Launch Judge Demo Mode ⚡
          </button>
        </div>
      </section>
    </div>
  );
};
