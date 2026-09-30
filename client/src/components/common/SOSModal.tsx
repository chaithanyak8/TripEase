import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiUrl } from '../../utils/api';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Share2,
  Ambulance,
  HeartHandshake,
  Info,
  CheckCircle2,
  Copy,
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react';

export const SOSModal: React.FC = () => {
  const { isSOSModalOpen, setIsSOSModalOpen, activeTrip, showToast } = useApp();
  const [confirmCallNumber, setConfirmCallNumber] = useState<string | null>(null);
  const [isLiveLocationShared, setIsLiveLocationShared] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<Array<{ name: string; phone: string; address: string; type?: string; specialty?: string }>>([]);

  useEffect(() => {
    const controller = new AbortController();
    setNearbyHospitals([]);
    if (!activeTrip) return () => controller.abort();

    const params = new URLSearchParams({
      destination: activeTrip.destination,
      destinationId: activeTrip.targetDestination?.id || ''
    });
    fetch(apiUrl(`/api/safety?${params}`), { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Safety lookup failed')))
      .then(data => {
        if (!controller.signal.aborted) setNearbyHospitals(data.emergencyDirectory.nearbyHospitals);
      })
      .catch(error => {
        if (!controller.signal.aborted) console.error(error);
      });

    return () => controller.abort();
  }, [activeTrip?.id, activeTrip?.destination, activeTrip?.targetDestination?.id]);

  if (!isSOSModalOpen) return null;

  const emergencyContacts = [
    { name: "National Emergency Helpline", number: "112", desc: "All-in-one Emergency Police / Fire / Medical", icon: PhoneCall, color: "bg-red-600" },
    { name: "Police Assistance", number: "100", desc: "Law enforcement & highway safety", icon: ShieldAlert, color: "bg-blue-600" },
    { name: "Medical / Ambulance", number: "108", desc: "24/7 Free Emergency Ambulance Dispatch", icon: Ambulance, color: "bg-rose-600" },
    { name: "Ministry of Tourism Helpline", number: "1363", desc: "24x7 Multi-lingual Tourist Assistance", icon: Info, color: "bg-amber-600" },
    { name: "Women's Safety Helpline", number: "1091", desc: "Dedicated 24/7 immediate assistance", icon: HeartHandshake, color: "bg-purple-600" }
  ];

  const handleSimulateCall = (number: string) => {
    setConfirmCallNumber(number);
  };

  const executeConfirmedCall = () => {
    if (confirmCallNumber) {
      showToast(`Connecting emergency call to ${confirmCallNumber}... (Safeguard verified)`);
      setConfirmCallNumber(null);
    }
  };

  const handleShareLiveLocation = () => {
    setIsLiveLocationShared(true);
    showToast(activeTrip
      ? `Emergency reference prepared for ${activeTrip.destination}. Confirm your device location before sharing.`
      : "Add an active trip and confirm your device location before sharing.");
  };

  const copySOSLink = () => {
    const tripId = activeTrip?.id ? `&trip=${encodeURIComponent(activeTrip.id)}` : '';
    const destination = activeTrip?.destination ? `&destination=${encodeURIComponent(activeTrip.destination)}` : '';
    navigator.clipboard?.writeText(`https://tripease.in/sos/live-track?id=SOS-BEACON-2026${tripId}${destination}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast("Emergency tracking link copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500 max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Emergency Assistance & SOS
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Immediate response directory & GPS location beacon
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSOSModalOpen(false)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="Close SOS modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safeguard Notice */}
        <div className="p-4 sm:p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">TripEase Safety Safeguard:</span> Emergency services will NEVER be called automatically without your direct tap confirmation. In a life-threatening situation, please call 112 immediately.
            </div>
          </div>

          {/* Current Tourist Context */}
          {activeTrip && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>Your Active Trip Location</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div>Destination: <strong className="text-slate-900">{activeTrip.destination}</strong></div>
                <div>Stay: <strong className="text-slate-900">{activeTrip.hotel?.name || "Verified Local Homestay"}</strong></div>
              </div>
            </div>
          )}

          {/* 1-Tap Emergency Hotlines */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              National Emergency Hotlines (Toll-Free 24/7)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {emergencyContacts.map(contact => {
                const Icon = contact.icon;
                return (
                  <button
                    key={contact.number}
                    onClick={() => handleSimulateCall(contact.number)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/50 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg text-white ${contact.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-red-700">
                          {contact.name}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight">
                          {contact.desc}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-red-600 group-hover:scale-110 transition-transform inline-block">
                        {contact.number}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Location Beacon */}
          <div className="bg-slate-900 text-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Live GPS SOS Location Sharing
                </h3>
              </div>
              {isLiveLocationShared && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Beacon Active
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mb-3">
              {activeTrip?.targetDestination?.coordinates
                ? `Active destination: ${activeTrip.destination}. Map reference ${activeTrip.targetDestination.coordinates.lat}, ${activeTrip.targetDestination.coordinates.lng} is an approximate destination center, not your live device location.`
                : 'Add an active trip to show its destination context. This demo does not read your device GPS location.'}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareLiveLocation}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isLiveLocationShared ? "Update GPS Coordinates" : "Broadcast Live SOS Beacon"}</span>
              </button>

              <button
                onClick={copySOSLink}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Copied!" : "Copy Tracking Link"}</span>
              </button>
            </div>
          </div>

          {/* Nearby Medical Care */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nearest Verified 24/7 Medical Care
            </h3>
            <div className="space-y-2">
              {nearbyHospitals.map((hosp, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{hosp.name}</div>
                    <div className="text-slate-500 text-[11px]">{hosp.address}</div>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {hosp.specialty || hosp.type || 'Destination listing'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSimulateCall(hosp.phone)}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Hosp</span>
                  </button>
                </div>
              ))}
            </div>
            {nearbyHospitals.length === 0 && <p className="mt-2 text-xs text-slate-500">No destination-specific hospital listings are available. Use national emergency numbers for urgent help.</p>}
          </div>
        </div>

        {/* Safeguard Confirmation Modal Overlay */}
        {confirmCallNumber && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-scaleUp">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <PhoneCall className="w-7 h-7 animate-bounce" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Confirm Emergency Call?
              </h3>
              <p className="text-xs text-slate-600">
                You are about to place an emergency call to <strong className="text-red-600 text-sm">{confirmCallNumber}</strong>. Please confirm to proceed.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setConfirmCallNumber(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedCall}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md"
                >
                  Confirm & Call
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
