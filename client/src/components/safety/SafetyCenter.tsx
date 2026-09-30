import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  MapPin,
  ExternalLink,
  Lock,
  Ambulance,
  Hospital,
  Shield,
  Pill,
  Flame,
  Navigation
} from 'lucide-react';
import { EmergencyVoiceAssistant } from '../assistant/EmergencyVoiceAssistant';
import { apiUrl } from '../../utils/api';

type EmergencyService = {
  name: string;
  address: string;
  distanceKm: number;
  latitude?: number;
  longitude?: number;
  type: string;
};

type Directory = {
  hospitals: EmergencyService[];
  police: EmergencyService[];
  pharmacies: EmergencyService[];
};

export const SafetyCenter: React.FC = () => {
  const {
    setIsSOSModalOpen,
    activeTrip,
    showToast,
    selectedDestination,
    currentLocation,
    setCurrentLocation
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'hospitals' | 'police' | 'pharmacies' | 'guidelines'
  >('hospitals');

  const [directory, setDirectory] = useState<Directory>({
    hospitals: [],
    police: [],
    pharmacies: []
  });

  const [directoryMessage, setDirectoryMessage] = useState('');

  const activeLocationName =
    currentLocation?.source === 'current_location'
      ? currentLocation.locationName
      : activeTrip?.destination ||
        selectedDestination?.name ||
        'Selected destination';

  useEffect(() => {
    const controller = new AbortController();

    const tripCoordinates = activeTrip?.targetDestination?.coordinates;

    const latitude =
      currentLocation?.source === 'current_location'
        ? currentLocation.latitude
        : tripCoordinates?.lat ??
          selectedDestination?.coordinates.lat ??
          12.9716;

    const longitude =
      currentLocation?.source === 'current_location'
        ? currentLocation.longitude
        : tripCoordinates?.lng ??
          selectedDestination?.coordinates.lng ??
          77.5946;

    const destinationName =
      currentLocation?.source === 'current_location'
        ? currentLocation.locationName
        : activeTrip?.destination ||
          selectedDestination?.name ||
          activeLocationName;

    const url = apiUrl(
      `/api/emergency/nearby?latitude=${latitude}&longitude=${longitude}&destination=${encodeURIComponent(
        destinationName
      )}`
    );

    fetch(url, { signal: controller.signal })
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error('Emergency lookup failed'))
      )
      .then((data) => {
        if (!controller.signal.aborted) {
          const services: EmergencyService[] = Array.isArray(data.services)
            ? data.services
            : [];

          setDirectory({
            hospitals: services.filter(
              (service) => service.type === 'hospital'
            ),
            police: services.filter(
              (service) => service.type === 'police'
            ),
            pharmacies: services.filter(
              (service) => service.type === 'pharmacy'
            )
          });

          setDirectoryMessage(
            data.message ||
              'Verified local emergency-service listings are not available for this location.'
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDirectory({
            hospitals: [],
            police: [],
            pharmacies: []
          });

          setDirectoryMessage(
            'Nearby directory lookup failed. Use the official emergency numbers shown below.'
          );
        }
      });

    return () => controller.abort();
  }, [
    currentLocation?.latitude,
    currentLocation?.longitude,
    currentLocation?.source,
    selectedDestination?.id,
    activeTrip?.destination,
    activeTrip?.targetDestination?.coordinates?.lat,
    activeTrip?.targetDestination?.coordinates?.lng
  ]);

  const handleUseMyCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is unavailable in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationName: 'My Current Location',
          source: 'current_location'
        });

        showToast(
          'Using your current GPS location for nearby emergency services.'
        );
      },
      () => {
        showToast(
          'Permission denied. Using the selected destination instead.'
        );

        const fallbackDestination =
          activeTrip?.targetDestination || selectedDestination;

        if (fallbackDestination) {
          setCurrentLocation({
            latitude: fallbackDestination.coordinates.lat,
            longitude: fallbackDestination.coordinates.lng,
            locationName: fallbackDestination.name,
            source: 'selected_destination'
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  const handleUseSelectedDestination = () => {
    if (!selectedDestination) return;

    setCurrentLocation({
      latitude: selectedDestination.coordinates.lat,
      longitude: selectedDestination.coordinates.lng,
      locationName: selectedDestination.name,
      source: 'selected_destination'
    });

    showToast(
      `Using ${selectedDestination.name} as the location context.`
    );
  };

  const handleEmergencyCall = (number: string, label: string) => {
    const confirmed = window.confirm(
      `Call ${label} (${number})?`
    );

    if (confirmed) {
      window.location.href = `tel:${number}`;
    }
  };

  const openDirections = (
    name: string,
    lat?: number,
    lng?: number
  ) => {
    const target =
      lat !== undefined && lng !== undefined
        ? `${lat},${lng}`
        : name;

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        target
      )}`,
      '_blank'
    );
  };

  const locationBadge =
    currentLocation?.source === 'current_location'
      ? 'Current location'
      : 'Selected destination';

  const emergencyNumbers = [
    {
      number: '112',
      name: 'Emergency',
      label: 'Emergency Services',
      color: 'text-red-600',
      icon: ShieldAlert,
      action: () => handleEmergencyCall('112', 'Emergency')
    },
    {
      number: '100',
      name: 'Police',
      label: 'Police',
      color: 'text-blue-600',
      icon: Shield,
      action: () => handleEmergencyCall('100', 'Police')
    },
    {
      number: '108',
      name: 'Ambulance',
      label: 'Ambulance',
      color: 'text-rose-600',
      icon: Ambulance,
      action: () => handleEmergencyCall('108', 'Ambulance')
    },
    {
      number: '101',
      name: 'Fire',
      label: 'Fire',
      color: 'text-amber-600',
      icon: Flame,
      action: () => handleEmergencyCall('101', 'Fire')
    },
    {
      number: '1091',
      name: 'Women’s Safety',
      label: 'Women’s Helpline',
      color: 'text-fuchsia-700',
      icon: Shield,
      action: () =>
        handleEmergencyCall('1091', 'Women’s Safety')
    },
    {
      number: '1363',
      name: 'Tourist',
      label: 'Tourist Helpline',
      color: 'text-sky-700',
      icon: MapPin,
      action: () =>
        handleEmergencyCall('1363', 'Tourist Helpline')
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safety & Emergency Center</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Emergency Mode & Nearby Help
          </h1>

          <p className="text-xs sm:text-sm text-red-100 max-w-xl">
            Location: {activeLocationName} · {locationBadge}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <button
            onClick={handleUseMyCurrentLocation}
            className="bg-white hover:bg-slate-100 text-red-700 font-bold text-sm px-4 py-2.5 rounded-xl"
          >
            Use My Current Location
          </button>

          <button
            onClick={handleUseSelectedDestination}
            className="bg-red-900/25 hover:bg-red-900/35 text-white font-bold text-sm px-4 py-2.5 rounded-xl border border-white/20"
          >
            Use Selected Destination
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3 text-xs text-slate-700">
        <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />

        <div>
          <strong className="text-slate-900 block font-bold">
            Emergency safety protocol:
          </strong>

          TripEase never dials emergency services automatically. The user must confirm before any call.
        </div>
      </div>

      {directoryMessage && (
        <p
          className="text-xs text-slate-600"
          role="status"
        >
          {directoryMessage}
        </p>
      )}

      <EmergencyVoiceAssistant />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {emergencyNumbers.map((item) => (
          <button
            key={item.number}
            onClick={item.action}
            className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs text-center space-y-2 transition hover:shadow-md cursor-pointer"
          >
            <item.icon
              className={`w-6 h-6 mx-auto ${item.color}`}
            />

            <span
              className={`text-2xl font-black ${item.color} block`}
            >
              {item.number}
            </span>

            <div className="font-bold text-xs text-slate-900">
              {item.name}
            </div>

            <p className="text-[10px] text-slate-400">
              {item.label}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: '🏥 Hospital',
            action: () => setActiveTab('hospitals')
          },
          {
            label: '💊 Pharmacy',
            action: () => setActiveTab('pharmacies')
          },
          {
            label: '👮 Police',
            action: () => setActiveTab('police')
          },
          {
            label: '🎙️ Voice Assistant',
            action: () => setIsSOSModalOpen(true)
          }
        ].map((btn, index) => (
          <button
            key={index}
            onClick={btn.action}
            className="bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl hover:bg-slate-800 transition cursor-pointer"
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2">
          {[
            'hospitals',
            'police',
            'pharmacies',
            'guidelines'
          ].map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setActiveTab(
                  tab as
                    | 'hospitals'
                    | 'police'
                    | 'pharmacies'
                    | 'guidelines'
                )
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'hospitals' && '🏥 Hospitals'}
              {tab === 'police' && '👮 Police'}
              {tab === 'pharmacies' && '💊 Pharmacies'}
              {tab === 'guidelines' && '📋 Guidelines'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'hospitals' && (
            <div className="space-y-4">
              {directory.hospitals.length ? (
                directory.hospitals.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Hospital className="w-4 h-4 text-red-600" />
                        {item.name}
                      </div>

                      <div className="text-slate-500">
                        📍 {item.address}
                      </div>

                      <div className="text-emerald-700 font-semibold">
                        Distance: {item.distanceKm} km
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          openDirections(
                            item.name,
                            item.latitude,
                            item.longitude
                          )
                        }
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Directions
                      </button>

                      <button
                        onClick={() =>
                          handleEmergencyCall(
                            '108',
                            'Ambulance'
                          )
                        }
                        className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Call
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Information unavailable. Please check the selected destination or current location for nearby hospitals.
                </p>
              )}
            </div>
          )}

          {activeTab === 'police' && (
            <div className="space-y-4">
              {directory.police.length ? (
                directory.police.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        {item.name}
                      </div>

                      <div className="text-slate-500">
                        📍 {item.address}
                      </div>

                      <div className="text-blue-700 font-semibold">
                        Distance: {item.distanceKm} km
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          openDirections(
                            item.name,
                            item.latitude,
                            item.longitude
                          )
                        }
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Directions
                      </button>

                      <button
                        onClick={() =>
                          handleEmergencyCall(
                            '100',
                            'Police'
                          )
                        }
                        className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Call
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Information unavailable. Nearby police information is not available for this location.
                </p>
              )}
            </div>
          )}

          {activeTab === 'pharmacies' && (
            <div className="space-y-4">
              {directory.pharmacies.length ? (
                directory.pharmacies.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-emerald-600" />
                        {item.name}
                      </div>

                      <div className="text-slate-500">
                        📍 {item.address}
                      </div>

                      <div className="text-emerald-700 font-semibold">
                        Distance: {item.distanceKm} km
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          openDirections(
                            item.name,
                            item.latitude,
                            item.longitude
                          )
                        }
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Directions
                      </button>

                      <button
                        onClick={() =>
                          handleEmergencyCall(
                            '112',
                            'Emergency'
                          )
                        }
                        className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Call
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Information unavailable. Nearby pharmacies are not available for this location.
                </p>
              )}
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">
                  Current location:
                </strong>
                {activeLocationName} · {locationBadge}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">
                  Stay prepared:
                </strong>
                Keep local emergency numbers saved, share your location only when you choose to do so, and use licensed transport after dark.
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">
                  India emergency services:
                </strong>
                112, 100, 101, 108. Availability can vary by region and service provider, so verify local guidance when needed.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};