import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Compass, Heart, Award, Check, X } from 'lucide-react';

export const TravelDNAModal: React.FC = () => {
  const { isTravelDNAOpen, setIsTravelDNAOpen, user, setUser, showToast } = useApp();

  if (!isTravelDNAOpen) return null;

  const archetypes = [
    { name: "Nature & Cultural Explorer", nature: 40, culture: 30, food: 15, adventure: 15, tag: "Loves misty hills, ancient stone heritage, and scenic sunsets." },
    { name: "Foodie & Coastal Trailblazer", nature: 20, culture: 20, food: 45, adventure: 15, tag: "Craves authentic street food, seafood ghee roasts, and local markets." },
    { name: "High-Adrenaline Adventurer", nature: 25, culture: 15, food: 15, adventure: 45, tag: "Trekking cliff paths, white-water kayaking, and boulder climbing." },
    { name: "Peaceful Slow Traveler", nature: 40, culture: 25, food: 25, adventure: 10, tag: "Eco-homestays, serene village craft tours, and morning yoga." }
  ];

  const handleSelectArchetype = (arc: typeof archetypes[0]) => {
    setUser(prev => ({
      ...prev,
      travelDNA: {
        archetype: arc.name,
        traits: {
          nature: arc.nature,
          culture: arc.culture,
          food: arc.food,
          adventure: arc.adventure
        },
        tagline: arc.tag
      }
    }));
    showToast(`Travel DNA updated to: ${arc.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Your Travel DNA</h3>
              <p className="text-xs text-slate-500">Personalized AI recommendation profile</p>
            </div>
          </div>
          <button
            onClick={() => setIsTravelDNAOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 space-y-4">
          <div className="bg-gradient-to-r from-sky-600 to-teal-600 text-white rounded-2xl p-4 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
              Current Archetype
            </span>
            <h4 className="text-lg font-black mt-1">{user.travelDNA.archetype}</h4>
            <p className="text-xs text-sky-100 mt-0.5">{user.travelDNA.tagline}</p>

            {/* Trait bars */}
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-semibold">
              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>🌿 Nature</span>
                  <span>{user.travelDNA.traits.nature}%</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${user.travelDNA.traits.nature}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>🏛️ Culture & Heritage</span>
                  <span>{user.travelDNA.traits.culture}%</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${user.travelDNA.traits.culture}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>🍛 Local Food</span>
                  <span>{user.travelDNA.traits.food}%</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${user.travelDNA.traits.food}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>🧗 Adventure</span>
                  <span>{user.travelDNA.traits.adventure}%</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${user.travelDNA.traits.adventure}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select or Switch Your Travel Vibe Anytime
            </h4>
            <div className="space-y-2">
              {archetypes.map(arc => {
                const isSelected = user.travelDNA.archetype === arc.name;
                return (
                  <button
                    key={arc.name}
                    onClick={() => handleSelectArchetype(arc)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{arc.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{arc.tag}</div>
                    </div>
                    {isSelected ? (
                      <span className="p-1 rounded-full bg-sky-600 text-white shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">Switch</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setIsTravelDNAOpen(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
