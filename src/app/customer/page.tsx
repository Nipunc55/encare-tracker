"use client";

import React, { useMemo, useState } from "react";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Radio,
  ChevronDown,
  ChevronUp,
  User,
  Plus,
  Minus,
  Sparkles,
  Info,
  Edit3,
  X,
  Navigation,
} from "lucide-react";
import { useEnCare } from "@/lib/store";
import { BAG_CATALOG } from "@/lib/constants";
import { calculateBagOrderTotalLkr, estimateStopEta } from "@/lib/geo";
import { BagQuantities, WasteTypeId } from "@/lib/types";
import LiveTrackingMap from "@/components/map/LiveTrackingMap";
import LocationPinPicker from "@/components/map/LocationPinPicker";

export default function CustomerPortalPage() {
  const {
    customers,
    activeCustomer,
    setActiveCustomerId,
    activeTrip,
    activeTripStops,
    confirmCustomerPickup,
    updateCustomerProfile,
  } = useEnCare();

  // Find stop for current customer
  const customerStop = useMemo(
    () =>
      activeTripStops.find((s) => s.customerId === activeCustomer.id) || null,
    [activeTripStops, activeCustomer.id]
  );

  // Check if today's collection truck covers the customer's area
  const isCoveredToday = useMemo(() => {
    const customerTownLower = (activeCustomer.town || "").toLowerCase().trim();
    const customerDistrictLower = (activeCustomer.district || "")
      .toLowerCase()
      .trim();

    return (
      activeTrip.corridorTowns.some(
        (t) =>
          t.toLowerCase().includes(customerTownLower) ||
          customerTownLower.includes(t.toLowerCase())
      ) ||
      activeTrip.district.toLowerCase().includes(customerDistrictLower) ||
      Boolean(customerStop)
    );
  }, [activeTrip, activeCustomer, customerStop]);

  // Calculate ETA or next scheduled date
  const { stopsBefore, etaInfo } = useMemo(() => {
    const pendingOrdered = activeTripStops
      .filter((s) => s.status !== "completed" && s.status !== "unreachable")
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    const idx = pendingOrdered.findIndex(
      (s) => s.customerId === activeCustomer.id
    );
    const countBefore = idx >= 0 ? idx : pendingOrdered.length;

    const eta = estimateStopEta(
      activeTrip.currentLat,
      activeTrip.currentLng,
      activeCustomer.lat,
      activeCustomer.lng,
      countBefore
    );

    return { stopsBefore: countBefore, etaInfo: eta };
  }, [activeTripStops, activeCustomer, activeTrip]);

  // Form states for pickup confirmation
  const [bagOrder, setBagOrder] = useState<BagQuantities>(
    customerStop?.bagOrder || { small: 0, medium: 0, large: 0 }
  );
  const [showBagSelector, setShowBagSelector] = useState(
    (customerStop?.bagOrder.small || 0) +
      (customerStop?.bagOrder.medium || 0) +
      (customerStop?.bagOrder.large || 0) >
      0
  );
  const [showInfoSection, setShowInfoSection] = useState(false);
  const [requestConfirmedToast, setRequestConfirmedToast] = useState(false);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(activeCustomer.fullName);
  const [editPhone, setEditPhone] = useState(activeCustomer.phone);
  const [editTown, setEditTown] = useState(activeCustomer.town);
  const [editAddress, setEditAddress] = useState(activeCustomer.address);
  const [editNotes, setEditNotes] = useState(activeCustomer.landmarkNotes);
  const [editLat, setEditLat] = useState(activeCustomer.lat);
  const [editLng, setEditLng] = useState(activeCustomer.lng);

  function handleOpenProfile() {
    setEditName(activeCustomer.fullName);
    setEditPhone(activeCustomer.phone);
    setEditTown(activeCustomer.town);
    setEditAddress(activeCustomer.address);
    setEditNotes(activeCustomer.landmarkNotes);
    setEditLat(activeCustomer.lat);
    setEditLng(activeCustomer.lng);
    setShowProfileModal(true);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    updateCustomerProfile({
      id: activeCustomer.id,
      fullName: editName.trim(),
      phone: editPhone.trim(),
      town: editTown.trim(),
      address: editAddress.trim(),
      landmarkNotes: editNotes.trim(),
      lat: editLat,
      lng: editLng,
    });
    setShowProfileModal(false);
  }

  function handleUseCurrentGps() {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setEditLat(Number(pos.coords.latitude.toFixed(5)));
        setEditLng(Number(pos.coords.longitude.toFixed(5)));
      });
    }
  }

  function updateBagQty(key: keyof BagQuantities, delta: number) {
    setBagOrder((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(20, prev[key] + delta)),
    }));
  }

  const totalBagCost = calculateBagOrderTotalLkr(bagOrder);
  const totalBagsOrdered =
    bagOrder.small + bagOrder.medium + bagOrder.large;

  function handleConfirmPickup() {
    confirmCustomerPickup({
      customerId: activeCustomer.id,
      wasteTypes: customerStop?.wasteTypes || (["diapers", "sanitary"] as WasteTypeId[]),
      bagOrder,
      notes: activeCustomer.landmarkNotes,
    });
    setRequestConfirmedToast(true);
    setTimeout(() => setRequestConfirmedToast(false), 3000);
  }

  return (
    <div className="p-3.5 space-y-3 max-w-lg mx-auto">
      {/* 1. Logged Customer Profile Bar (Minimal & Clean) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {activeCustomer.fullName}
            </div>
            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{activeCustomer.town} • {activeCustomer.address}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenProfile}
          className="shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
          title="Edit your contact details and home GPS pin"
        >
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit</span>
        </button>
      </div>

      {/* Demo Household Switcher (Discreet & Compact) */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
        <span>Logged Household:</span>
        <select
          value={activeCustomer.id}
          onChange={(e) => setActiveCustomerId(e.target.value)}
          className="text-[11px] font-semibold text-slate-700 bg-transparent border-0 underline cursor-pointer focus:outline-none"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} ({c.town})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Visual Area Coverage Banner (Green if covered, Neutral if not) */}
      {isCoveredToday ? (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wide">
                Area Coverage Status
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">
                Collection Active in {activeCustomer.town} Today!
              </div>
              <div className="text-[11px] text-emerald-100/90 mt-0.5">
                Vehicle: {activeTrip.vehicleNo} • Driver: {activeTrip.driverName}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-800 text-white p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Area Coverage Status
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">
                No Vehicle in {activeCustomer.town} Today
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Today&apos;s run is covering: {activeTrip.title}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Estimated Arrival Time (Covered) OR Estimated Arrival Date (Not Covered) */}
      {isCoveredToday ? (
        customerStop?.status === "completed" ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-950">
                Pickup Completed for Today!
              </div>
              <div className="text-[11px] text-emerald-700">
                Collected {customerStop.bagsCollected} bag(s). Thank you!
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Estimated Arrival
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5 flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>~{etaInfo.etaMinutes} min</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Road distance: {etaInfo.roadDistanceKm} km
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Vehicle Distance
              </div>
              <div className="text-lg font-black text-emerald-700 mt-0.5">
                {stopsBefore === 0
                  ? "Arriving Next!"
                  : `${stopsBefore} Stops Away`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Keep sealed bags ready
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-center space-y-1">
          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Next Scheduled Collection Date
          </div>
          <div className="text-base font-extrabold text-slate-900 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Friday, Oct 30, 2026</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Confirm your pickup below to be added to the driver&apos;s route manifest.
          </p>
        </div>
      )}

      {/* 4. Section to Place / Confirm Pickup (Clean, High-Impact & 1-Tap) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Confirm Pickup
            </h2>
            <p className="text-[11px] text-slate-500">
              {customerStop?.status === "confirmed" || customerStop?.status === "approaching"
                ? "Your pickup is active on the driver's list."
                : "Tap below so the driver stops at your gate."}
            </p>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              customerStop?.status === "completed"
                ? "bg-emerald-100 text-emerald-800"
                : customerStop?.status === "approaching" || customerStop?.status === "confirmed"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {customerStop?.status === "approaching"
              ? "Next In Line"
              : customerStop?.status === "confirmed"
              ? "Confirmed ✓"
              : "Not Queued"}
          </span>
        </div>

        {/* Optional Bag Replenishment Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowBagSelector(!showBagSelector)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-emerald-700 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>🛍️ Need New Bags?</span>
              {totalBagsOrdered > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {totalBagsOrdered} bags (LKR {totalBagCost})
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-normal">
                  (Optional • Cash on arrival)
                </span>
              )}
            </span>
            {showBagSelector ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showBagSelector && (
            <div className="mt-2.5 space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {BAG_CATALOG.map((bag) => (
                <div
                  key={bag.key}
                  className="flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">
                      {bag.key.toUpperCase()}
                    </span>{" "}
                    <span className="text-slate-500">
                      (LKR {bag.priceLkr}/=)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateBagQty(bag.key, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center font-bold">
                      {bagOrder[bag.key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateBagQty(bag.key, 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary 1-Tap Confirm Button */}
        <button
          type="button"
          onClick={handleConfirmPickup}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          {customerStop?.status === "confirmed" || customerStop?.status === "approaching"
            ? "✓ Update My Pickup Request"
            : "✅ Confirm Pickup for Today"}
        </button>

        {requestConfirmedToast && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pickup confirmed! Synced to the driver&apos;s route.</span>
          </div>
        )}
      </div>

      {/* 5. Live Vehicle Map & Today's Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-900">
              Live Vehicle Map
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Active: {activeTrip.corridorTowns.slice(0, 3).join(", ")}...
          </span>
        </div>

        <LiveTrackingMap
          trip={activeTrip}
          stops={activeTripStops}
          customers={customers}
          highlightCustomerId={activeCustomer.id}
          heightClass="h-56"
        />
      </div>

      {/* 6. Optional "More Info & Pricing" (Collapsible to prevent distraction) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowInfoSection(!showInfoSection)}
          className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Service & Bag Pricing Info</span>
          </span>
          {showInfoSection ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showInfoSection && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-600 space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900">
              <strong>Collection is 100% Free:</strong> No registration or transport fee. You only pay for replacement bio-safe bags when needed.
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              {BAG_CATALOG.map((b) => (
                <div key={b.key} className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800">{b.key.toUpperCase()}</div>
                  <div className="font-extrabold text-emerald-700 mt-0.5">LKR {b.priceLkr}/=</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{b.capacity}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile & GPS Pin Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl space-y-3.5 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Profile & Gate Location
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Full Name / Household
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    WhatsApp Mobile
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Town
                  </label>
                  <input
                    type="text"
                    required
                    value={editTown}
                    onChange={(e) => setEditTown(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              {/* Pin Picker */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>Exact Gate Pin (Tap or drag)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentGps}
                    className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" /> Use Phone GPS
                  </button>
                </div>
                <LocationPinPicker
                  lat={editLat}
                  lng={editLng}
                  onChange={(lat, lng) => {
                    setEditLat(lat);
                    setEditLng(lng);
                  }}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
