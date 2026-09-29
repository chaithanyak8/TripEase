import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Check, ArrowRight, X } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, setUser, setLanguage, showToast } = useApp();

  const [step, setStep] = useState(1);
  const [style, setStyle] = useState('Balanced Explorer');
  const [budgetTier, setBudgetTier] = useState('Comfort (₹2,500 - ₹5,000/day)');
  const [foodPref, setFoodPref] = useState('Local Coastal & Traditional (Veg + Non-Veg)');
  const [groupType, setGroupType] = useState('Friends Group (2-4)');
  const [preferredLang, setPreferredLang] = useState('en');

  if (!isOnboardingOpen) return null;

  const handleFinish = () => {
    setUser(prev => ({
      ...prev,
      travelDNA: {
        archetype: `${style} • ${groupType.split(' ')[0]}`,
        traits: {
          nature: style.includes('Nature') ? 40 : 25,
          culture: style.includes('Culture') ? 40 : 30,
          food: foodPref.includes('Local') ? 35 : 20,
          adventure: style.includes('Adventure') ? 40 : 20
        },
        tagline: `${groupType} traveler seeking ${budgetTier.split(' ')[0]} stays and authentic culinary experiences.`
      }
    }));
    setLanguage(preferredLang as any);
    setIsOnboardingOpen(false);
    showToast("Preferences saved! Personalized recommendations are now active.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-100 text-sky-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">Travel Preferences</h3>
              <p className="text-xs text-slate-500">Step {step} of 3 • Tailor your AI recommendations</p>
            </div>
          </div>
          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        <div className="py-5 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                What is your preferred travel vibe?
              </label>
              {[
                "Relaxed & Coastal Breeze",
                "High-Adrenaline Adventure & Treks",
                "Living Culture, Temples & Heritage",
                "Slow Nature & Eco-Homestays"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setStyle(opt)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    style === opt
                      ? 'border-sky-500 bg-sky-50/60 text-sky-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {style === opt && <Check className="w-4 h-4 text-sky-600" />}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Who are you traveling with & Budget?
              </label>
              <div className="space-y-2">
                {[
                  "Solo Explorer",
                  "Couple / Romantic Getaway",
                  "Friends Group (2-4)",
                  "Family with Kids / Elders"
                ].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setGroupType(opt)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      groupType === opt
                        ? 'border-sky-500 bg-sky-50/60 text-sky-900'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {groupType === opt && <Check className="w-4 h-4 text-sky-600" />}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Budget Style
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["Backpacker (₹1,500/day)", "Comfort (₹3,000/day)", "Premium (₹6,000/day)", "Luxury Heritage"].map(b => (
                    <button
                      key={b}
                      onClick={() => setBudgetTier(b)}
                      className={`p-2 rounded-xl border text-center font-medium transition cursor-pointer ${
                        budgetTier === b ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Food & Language Preferences
              </label>
              <div className="space-y-2">
                {[
                  "Local Coastal & Traditional (Veg + Non-Veg)",
                  "Pure Vegetarian (Satvik / Jain Options)",
                  "Authentic Street Food & Regional Sweets",
                  "Multi-Cuisine & Cafe Dining"
                ].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFoodPref(opt)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      foodPref === opt
                        ? 'border-sky-500 bg-sky-50/60 text-sky-900'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {foodPref === opt && <Check className="w-4 h-4 text-sky-600" />}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  App Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिंदी (Hindi)' },
                    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' }
                  ].map(l => (
                    <button
                      key={l.code}
                      onClick={() => setPreferredLang(l.code)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition ${
                        preferredLang === l.code ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-sky-500/20"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save & Complete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
