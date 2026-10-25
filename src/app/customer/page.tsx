"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Shield,
  Plus,
  Minus,
  UserPlus,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useEnCare } from "@/lib/store";
import { BAG_CATALOG, WASTE_CATEGORIES } from "@/lib/constants";
import { calculateBagOrderTotalLkr, estimateStopEta } from "@/lib/geo";
import { BagQuantities, WasteTypeId } from "@/lib/types";
import LiveTrackingMap from "@/components/map/LiveTrackingMap";

export default function CustomerPortalPage() {
  const {
    customers,
    activeCustomer,
    setActiveCustomerId,
    activeTrip,
    activeTripStops,
    confirmCustomerPickup,
    notifications,
  } = useEnCare();

  const customerStop = useMemo(
    () =>
      activeTripStops.find((s) => s.customerId === activeCustomer.id) || null,
    [activeTripStops, activeCustomer.id]
  );

  const [selectedWaste, setSelectedWaste] = useState<WasteTypeId[]>(
    customerStop?.wasteTypes || ["diapers", "sanitary"]
  );
  const [bagOrder, setBagOrder] = useState<BagQuantities>(
    customerStop?.bagOrder || { small: 1, medium: 1, large: 0 }
  );
  const [notes, setNotes] = useState<string>(
    customerStop?.notes || activeCustomer.landmarkNotes || ""
  );
  const [savedBanner, setSavedBanner] = useState(false);
  const [forcePrivacyDemo, setForcePrivacyDemo] = useState(false);

  // Sync local form state when switching customer profile
  useEffect(() => {
    setSelectedWaste(customerStop?.wasteTypes || ["diapers", "sanitary"]);
    setBagOrder(customerStop?.bagOrder || { small: 1, medium: 0, large: 0 });
    setNotes(customerStop?.notes || activeCustomer.landmarkNotes || "");
    setSavedBanner(false);
  }, [activeCustomer.id, customerStop, activeCustomer.landmarkNotes]);

  // Calculate how many pending stops are ahead of this customer
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

  const totalOrderLkr = calculateBagOrderTotalLkr(bagOrder);

  const customerNotifications = useMemo(
    () =>
      notifications.filter((n) => n.customerId === activeCustomer.id).slice(0, 3),
    [notifications, activeCustomer.id]
  );

  function toggleWasteType(id: WasteTypeId) {
    setSelectedWaste((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function updateBagQty(key: keyof BagQuantities, delta: number) {
    setBagOrder((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(20, prev[key] + delta)),
    }));
  }

  function handleSaveRequest(e: React.FormEvent) {
    e.preventDefault();
    confirmCustomerPickup({
      customerId: activeCustomer.id,
      wasteTypes:
        selectedWaste.length > 0 ? selectedWaste : (["diapers"] as WasteTypeId[]),
      bagOrder,
      notes,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3500);
  }

  const isPrivacyMasked = forcePrivacyDemo || !etaInfo.isWithinPrivacyZone;

  return (
    <div className="p-3.5 space-y-4">
      {/* Top Customer Switcher & Registration Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Customer Mobile View
            </span>
            <h1 className="text-base font-extrabold text-slate-900">
              {activeCustomer.fullName}
            </h1>
          </div>

          <Link
            href="/customer/register"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Pin</span>
          </Link>
        </div>

        {/* Demo Profile Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="customer-select"
            className="text-[11px] font-medium text-slate-500 shrink-0"
          >
            Switch Household:
          </label>
          <select
            id="customer-select"
            value={activeCustomer.id}
            onChange={(e) => setActiveCustomerId(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {customers.map((c) => {
              const st = activeTripStops.find((s) => s.customerId === c.id);
              const badge =
                st?.status === "completed"
                  ? "✓ Done"
                  : st?.status === "approaching"
                  ? "🚛 Next Stop!"
                  : st
                  ? `Stop #${st.sequenceOrder}`
                  : "Not Scheduled";
              return (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.town}) — {badge}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">
            <strong>{activeCustomer.town}:</strong> {activeCustomer.address}
          </span>
        </div>
      </div>

      {/* Live Vehicle Radar & Stop Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>🚛 Live Vehicle Radar</span>
              {customerStop?.status === "approaching" && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold animate-pulse">
                  ARRIVING NEXT
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500">
              Route: {activeTrip.title}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setForcePrivacyDemo(!forcePrivacyDemo)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
              isPrivacyMasked
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title="Toggle geofence privacy obfuscation preview"
          >
            <Shield className="w-3 h-3" />
            {isPrivacyMasked ? "Geofence Masked" : "In Active Zone"}
          </button>
        </div>

        {/* Status Metrics Pill Row */}
        {customerStop?.status === "completed" ? (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-extrabold text-emerald-900">
                Pickup Completed Today!
              </div>
              <div className="text-[11px] text-emerald-700">
                Collected {customerStop.bagsCollected} waste bag(s) • Paid LKR{" "}
                {customerStop.amountCollectedLkr.toLocaleString()}/=
              </div>
            </div>
          </div>
        ) : customerStop?.status === "unreachable" ? (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-red-600 shrink-0" />
            <div>
              <div className="text-xs font-extrabold text-red-900">
                Missed Stop — Phone Unreachable
              </div>
              <div className="text-[11px] text-red-700">
                Confirm below to re-queue your pickup for the driver.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center">
              <div className="text-[10px] font-semibold uppercase text-emerald-700">
                Stops Away
              </div>
              <div className="text-base font-extrabold text-emerald-950 mt-0.5">
                {stopsBefore === 0 ? "Next Stop!" : `${stopsBefore} Stops`}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-semibold uppercase text-slate-500">
                Est. Arrival
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />~
                {etaInfo.etaMinutes} min
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-semibold uppercase text-slate-500">
                Road Dist
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {etaInfo.roadDistanceKm} km
              </div>
            </div>
          </div>
        )}

        {/* Interactive Leaflet Map */}
        <LiveTrackingMap
          trip={activeTrip}
          stops={activeTripStops}
          customers={customers}
          highlightCustomerId={activeCustomer.id}
          privacyObfuscated={isPrivacyMasked}
          heightClass="h-60"
        />

        {isPrivacyMasked && (
          <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Privacy Geofence Active:</strong> Exact street location of
              the truck is hidden until it enters your town corridor.
            </span>
          </div>
        )}
      </div>

      {/* 1-Click Pickup Request & Bio-Safe Bag Re-Ordering Form */}
      <form
        onSubmit={handleSaveRequest}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>1-Click Pickup & Bag Replenishment</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Collection is 100% FREE. Pay cash on delivery only for new bags.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
            {customerStop?.status || "Not Queued"}
          </span>
        </div>

        {/* Waste Categories */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            1. Select Sanitary / Clinical Waste Types Ready for Pickup:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {WASTE_CATEGORIES.map((cat) => {
              const checked = selectedWaste.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleWasteType(cat.id)}
                  className={`text-left p-2 rounded-xl border text-xs transition cursor-pointer ${
                    checked
                      ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{cat.shortLabel}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        checked
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {cat.sinhala}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio-Safe Bag Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Order New Bio-Safe Bags (Cash on Arrival):</span>
            </label>
          </div>

          <div className="space-y-2">
            {BAG_CATALOG.map((bag) => {
              const qty = bagOrder[bag.key];
              return (
                <div
                  key={bag.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {bag.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bag.badgeColor}`}
                      >
                        LKR {bag.priceLkr}/=
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {bag.sinhalaName} • {bag.capacity}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateBagQty(bag.key, -1)}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-slate-700 active:scale-95 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-extrabold text-sm text-slate-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateBagQty(bag.key, 1)}
                      className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gate / Landmark Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            3. Gate / Pickup Note for Driver:
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Bags kept near front gate / Honk twice"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Order Total & Submit Button */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-500">
              Collection Fee: <strong className="text-emerald-700">FREE</strong>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              Bag Total: LKR {totalOrderLkr.toLocaleString()}/=
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            ✅ Confirm My Pickup
          </button>
        </div>

        {savedBanner && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Pickup confirmed! Your home pin and bag order (LKR{" "}
              {totalOrderLkr.toLocaleString()}/=) are synced to the driver&apos;s
              route.
            </span>
          </div>
        )}
      </form>

      {/* Automated WhatsApp Alerts Received by This Customer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Alerts Sent to {activeCustomer.phone}</span>
          </h3>
        </div>

        {customerNotifications.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No alerts sent to this number yet. When the truck is 2 stops away,
            an automatic Sinhala/English WhatsApp alert will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {customerNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-2xl bg-[#dcf8c6]/50 border border-emerald-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] text-emerald-800 font-semibold">
                  <span>WhatsApp • {notif.templateType.replace("_", " ").toUpperCase()}</span>
                  <span>
                    {new Date(notif.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-800 leading-relaxed">
                  {notif.messageBody}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
