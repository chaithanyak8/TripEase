import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { Footer } from './components/common/Footer';
import { NotificationDropdown } from './components/common/NotificationDropdown';
import { SOSModal } from './components/common/SOSModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { TravelDNAModal } from './components/common/TravelDNAModal';
import { YatraAssistant } from './components/assistant/YatraAssistant';
import { EmergencyVoiceAssistant } from './components/assistant/EmergencyVoiceAssistant';

// Views
import { LandingPage } from './components/home/LandingPage';
import { AITripPlanner } from './components/planner/AITripPlanner';
import { DestinationExplorer } from './components/explore/DestinationExplorer';
import { BeyondTheCrowd } from './components/explore/BeyondTheCrowd';
import { SmartMap } from './components/map/SmartMap';
import { HotelDiscovery } from './components/hotels/HotelDiscovery';
import { ExperienceMarketplace } from './components/experiences/ExperienceMarketplace';
import { GuideMarketplace } from './components/guides/GuideMarketplace';
import { TransportationHub } from './components/transport/TransportationHub';
import { TasteLocal } from './components/food/TasteLocal';
import { AIBudgetManager } from './components/budget/AIBudgetManager';
import { SafetyCenter } from './components/safety/SafetyCenter';
import { DigitalTravelWallet } from './components/wallet/DigitalTravelWallet';
import { TouristReviews } from './components/reviews/TouristReviews';
import { LocalBusinessDashboard } from './components/business/LocalBusinessDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

import { apiUrl } from './utils/api';

const MainContent: React.FC = () => {
  const { activeTab, activateTrip, showToast, toastMessage } = useApp();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handlePlanCustomPrompt = async (promptText: string) => {
    try {
      const res = await fetch(apiUrl('/api/itineraries/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naturalLanguageQuery: promptText,
          origin: "Bengaluru",
          destinationName: promptText,
          budget: 15000,
          durationDays: 4,
          travelers: 2
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.requestedDestination !== data.itinerary?.destination) {
          showToast('The generated destination did not match your request. Please try again.');
          return;
        }
        activateTrip(data.itinerary);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Trip generation failed.');
      }
    } catch (e) {
      console.error(e);
      showToast('Trip generation failed. Check that the backend is running.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-100/70 font-sans text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <Header onOpenNotifications={() => setIsNotificationsOpen(true)} />

      {/* Main Dynamic View Area */}
      <main className="flex-1">
        {activeTab === 'home' && <LandingPage onPlanCustomPrompt={handlePlanCustomPrompt} />}
        {activeTab === 'planner' && <AITripPlanner />}
        {activeTab === 'explore' && <DestinationExplorer />}
        {activeTab === 'beyond-crowd' && <BeyondTheCrowd />}
        {activeTab === 'map' && <SmartMap />}
        {activeTab === 'hotels' && <HotelDiscovery />}
        {activeTab === 'experiences' && <ExperienceMarketplace />}
        {activeTab === 'guides' && <GuideMarketplace />}
        {activeTab === 'transport' && <TransportationHub />}
        {activeTab === 'food' && <TasteLocal />}
        {activeTab === 'budget' && <AIBudgetManager />}
        {activeTab === 'safety' && <SafetyCenter />}
        {activeTab === 'wallet' && <DigitalTravelWallet />}
        {activeTab === 'reviews' && <TouristReviews />}
        {activeTab === 'business' && <LocalBusinessDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Global Interactive Modals & Floating Helpers */}
      <NotificationDropdown
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <SOSModal />
      <OnboardingModal />
      <TravelDNAModal />
      <EmergencyVoiceAssistant />
      <YatraAssistant />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Footer */}
      <Footer />

      {/* Toast Feedback Notification Bar */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-60 bg-slate-950 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-slideUp flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
