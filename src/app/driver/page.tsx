"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Navigation,
  CheckCircle2,
  PhoneOff,
  Radio,
  Package,
  MapPin,
  MessageCircle,
  Plus,
  Minus,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  PhoneCall,
} from "lucide-react";
import { useEnCare } from "@/lib/store";
import { BAG_CATALOG, WASTE_CATEGORIES } from "@/lib/constants";
import {
  calculateBagOrderTotalLkr,
  getGoogleMapsNavigationUrl,
  getWazeNavigationUrl,
} from "@/lib/geo";
import { BagQuantities, NotificationLog } from "@/lib/types";
import LiveTrackingMap from "@/components/map/LiveTrackingMap";

export default function DriverFieldAppPage() {
  const {
    activeTrip,
    activeTripStops,
    customers,
    toggleGpsBroadcast,
    isSimulatingGps,
    toggleGpsSimulation,
    completeStop,
    markStopUnreachable,
    optimizeActiveRoute,
  } = useEnCare();

  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers]
  );

  // Find current active/next stop
  const currentStop = useMemo(() => {
    const approaching = activeTripStops.find((s) => s.status === "approaching");
    if (approaching) return approaching;
    return (
      activeTripStops.find(
        (s) => s.status !== "completed" && s.status !== "unreachable"
      ) || null
    );
  }, [activeTripStops]);

  const currentCustomer = currentStop
    ? customerMap.get(currentStop.customerId) || null
    : null;

  // POS State for the current stop
  const [bagsCollected, setBagsCollected] = useState<number>(2);
  const [posBags, setPosBags] = useState<BagQuantities>({
    small: 1,
    medium: 1,
    large: 0,
  });
  const [driverNote, setDriverNote] = useState<string>("");
  const [showUnreachableModal, setShowUnreachableModal] = useState(false);
  const [justTriggeredAlerts, setJustTriggeredAlerts] = useState<
    NotificationLog[]
  >([]);

  useEffect(() => {
    if (currentStop) {
      setBagsCollected(Math.max(1, currentStop.bagsCollected || 2));
      setPosBags(currentStop.bagOrder);
      setDriverNote(currentStop.notes || "");
      setShowUnreachableModal(false);
    }
  }, [currentStop]);

  const cashToCollectLkr = calculateBagOrderTotalLkr(posBags);

  // Calculate Truck Inventory & Cash Summary
  const { soldTotals, totalCashLkr, completedCount } = useMemo(() => {
    const sold = { small: 0, medium: 0, large: 0 };
    let cash = 0;
    let done = 0;

    activeTripStops.forEach((s) => {
      if (s.status === "completed") {
        done += 1;
        sold.small += s.bagOrder.small;
        sold.medium += s.bagOrder.medium;
        sold.large += s.bagOrder.large;
        cash += s.amountCollectedLkr;
      }
    });

    return { soldTotals: sold, totalCashLkr: cash, completedCount: done };
  }, [activeTripStops]);

  function adjustPosBag(key: keyof BagQuantities, delta: number) {
    setPosBags((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(30, prev[key] + delta)),
    }));
  }

  function handleCompleteCurrentStop() {
    if (!currentStop) return;
    const logs = completeStop({
      stopId: currentStop.id,
      bagsCollected,
      bagOrder: posBags,
      notes: driverNote,
    });
    setJustTriggeredAlerts(logs);
  }

  function handleUnreachable(reason: string) {
    if (!currentStop) return;
    const log = markStopUnreachable(currentStop.id, reason);
    if (log) {
      setJustTriggeredAlerts([log]);
    }
    setShowUnreachableModal(false);
  }

  return (
    <div className="p-3.5 space-y-4">
      {/* Driver Top Status & Hands-Free GPS Beacon Bar */}
      <div className="rounded-2xl bg-slate-900 text-white p-3.5 shadow-md space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase">
                Driver Field PWA
              </span>
              <span className="text-xs font-bold text-slate-300">
                {activeTrip.vehicleNo} • {activeTrip.driverName}
              </span>
            </div>
            <h1 className="text-sm font-extrabold text-white mt-1">
              {activeTrip.title}
            </h1>
          </div>

          <button
            type="button"
            onClick={toggleGpsBroadcast}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTrip.isBroadcasting
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/40"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            <Radio
              className={`w-4 h-4 ${
                activeTrip.isBroadcasting ? "animate-ping" : "text-slate-400"
              }`}
            />
            <span>{activeTrip.isBroadcasting ? "GPS ON" : "GPS PAUSED"}</span>
          </button>
        </div>

        {/* Quick Driver Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-slate-800/90 rounded-xl p-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Progress</div>
            <div className="text-sm font-extrabold text-emerald-400">
              {completedCount}/{activeTripStops.length} Stops
            </div>
          </div>
          <div className="bg-slate-800/90 rounded-xl p-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase">
              Cash in Hand
            </div>
            <div className="text-sm font-extrabold text-amber-300">
              LKR {totalCashLkr.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-800/90 rounded-xl p-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase">
              Stock (S/M/L)
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {activeTrip.initialStock.small - soldTotals.small} /{" "}
              {activeTrip.initialStock.medium - soldTotals.medium} /{" "}
              {activeTrip.initialStock.large - soldTotals.large}
            </div>
          </div>
        </div>
      </div>

      {/* Automated WhatsApp Dispatch Toast (Zero-Cost Click-to-WhatsApp Links) */}
      {justTriggeredAlerts.length > 0 && (
        <div className="rounded-2xl bg-emerald-950 text-emerald-50 border border-emerald-700 p-3.5 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300">
              <MessageCircle className="w-4 h-4" />
              <span>
                Auto-Generated WhatsApp Alerts ({justTriggeredAlerts.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setJustTriggeredAlerts([])}
              className="text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[11px] text-emerald-200/90">
            Free-Tier Mode: Tap any button below to launch WhatsApp with the
            pre-filled Sinhala/English alert (or auto-send when Cloud API is
            connected):
          </p>
          <div className="space-y-1.5">
            {justTriggeredAlerts.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-900/70 border border-emerald-700/80"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {log.templateType === "receipt"
                      ? `🧾 Receipt → ${log.customerName}`
                      : log.templateType === "eta_approaching"
                      ? `🚛 Next Stop ETA Alert → ${log.customerName}`
                      : `⚠️ Missed Stop Notice → ${log.customerName}`}
                  </div>
                  <div className="text-[10px] text-emerald-300 truncate">
                    {log.phone}
                  </div>
                </div>
                <a
                  href={log.waDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] shrink-0 shadow-xs"
                >
                  <span>Send WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CURRENT / NEXT STOP ACTION CARD (Oversized Mobile Controls) */}
      {currentStop && currentCustomer ? (
        <div className="rounded-3xl bg-white border-2 border-amber-400 shadow-md overflow-hidden">
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-xs font-extrabold">
                STOP #{currentStop.sequenceOrder}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wide">
                Current Destination • {currentCustomer.town}
              </span>
            </div>
            <a
              href={`tel:${currentCustomer.phone}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 text-xs font-bold"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          </div>

          <div className="p-4 space-y-4">
            {/* Customer Details & Landmark */}
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {currentCustomer.fullName}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{currentCustomer.address}</span>
              </p>
              {(currentCustomer.landmarkNotes || currentStop.notes) && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium">
                  📍 <strong>Gate / Landmark:</strong>{" "}
                  {currentStop.notes || currentCustomer.landmarkNotes}
                </div>
              )}
            </div>

            {/* 1-Tap Turn-by-Turn Navigation Deep Links */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={getGoogleMapsNavigationUrl(
                  currentCustomer.lat,
                  currentCustomer.lng
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Navigation className="w-4 h-4" />
                <span>Google Maps Nav</span>
              </a>

              <a
                href={getWazeNavigationUrl(
                  currentCustomer.lat,
                  currentCustomer.lng
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Navigation className="w-4 h-4" />
                <span>Open in Waze</span>
              </a>
            </div>

            {/* Waste Categories Expected */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">
                Waste Types:
              </span>
              {currentStop.wasteTypes.map((wt) => {
                const cat = WASTE_CATEGORIES.find((c) => c.id === wt);
                return (
                  <span
                    key={wt}
                    className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
                  >
                    {cat?.shortLabel || wt}
                  </span>
                );
              })}
            </div>

            {/* Driver POS & Collection Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Sealed Waste Bags Collected:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBagsCollected((prev) => Math.max(0, prev - 1))
                    }
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-extrabold text-sm">
                    {bagsCollected}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBagsCollected((prev) => prev + 1)}
                    className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2.5 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New Bio-Safe Bags Issued (POS):</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {BAG_CATALOG.map((bag) => (
                    <div
                      key={bag.key}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-center space-y-1.5"
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        {bag.key} ({bag.priceLkr})
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustPosBag(bag.key, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-extrabold text-sm">
                          {posBags[bag.key]}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustPosBag(bag.key, 1)}
                          className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash to Collect Banner */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  Cash to Collect from Customer:
                </span>
                <span className="text-base font-extrabold text-emerald-700">
                  LKR {cashToCollectLkr.toLocaleString()}/=
                </span>
              </div>
            </div>

            {/* Primary Driver Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCompleteCurrentStop}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Stop & Alert Next 2 Homes</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUnreachableModal(!showUnreachableModal)}
                className="w-full py-2.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Customer Unreachable / Skip & Reschedule</span>
              </button>
            </div>

            {/* Unreachable Quick Reason Picker */}
            {showUnreachableModal && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Select Reason (Sends Missed Pickup WhatsApp):</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    "Phone switched off / No answer",
                    "Customer not at home / Gate locked",
                    "Requested reschedule to next week",
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => handleUnreachable(reason)}
                      className="text-left px-3 py-2 rounded-xl bg-white hover:bg-red-100 border border-red-200 text-xs font-semibold text-red-900 cursor-pointer"
                    >
                      → {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-5 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-base font-extrabold text-emerald-950">
            All Scheduled Stops Completed!
          </h2>
          <p className="text-xs text-emerald-800">
            Total Cash Collected: LKR {totalCashLkr.toLocaleString()}/= across{" "}
            {completedCount} pickups.
          </p>
        </div>
      )}

      {/* Driver Route Map & Stop Sequence */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Route Map & Stop Sequence
          </h3>
          <button
            type="button"
            onClick={optimizeActiveRoute}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Re-Optimize Path</span>
          </button>
        </div>

        <LiveTrackingMap
          trip={activeTrip}
          stops={activeTripStops}
          customers={customers}
          highlightCustomerId={currentCustomer?.id}
          heightClass="h-52"
        />

        {/* Full Stop Sequence List */}
        <div className="space-y-2 pt-1">
          {activeTripStops.map((stop) => {
            const cust = customerMap.get(stop.customerId);
            if (!cust) return null;
            const isCurrent = currentStop?.id === stop.id;

            return (
              <div
                key={stop.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 ${
                  isCurrent
                    ? "bg-amber-50/70 border-amber-400"
                    : stop.status === "completed"
                    ? "bg-emerald-50/40 border-emerald-200 opacity-80"
                    : stop.status === "unreachable"
                    ? "bg-red-50/50 border-red-200 opacity-80"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 ${
                      stop.status === "completed"
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-amber-500 text-slate-950"
                        : stop.status === "unreachable"
                        ? "bg-red-500 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {stop.status === "completed" ? "✓" : stop.sequenceOrder}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {cust.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {cust.town} • Bags: S:{stop.bagOrder.small} M:
                      {stop.bagOrder.medium} L:{stop.bagOrder.large}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      stop.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : isCurrent
                        ? "bg-amber-200 text-amber-950"
                        : stop.status === "unreachable"
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isCurrent ? "Next" : stop.status}
                  </span>
                  {stop.status === "completed" && (
                    <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                      LKR {stop.amountCollectedLkr}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
