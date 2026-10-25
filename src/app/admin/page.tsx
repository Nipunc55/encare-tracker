"use client";

import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  Send,
  Package,
  Banknote,
  CalendarPlus,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { useEnCare } from "@/lib/store";
import { BAG_CATALOG, SRI_LANKA_CORRIDORS } from "@/lib/constants";
import { calculateBagOrderTotalLkr } from "@/lib/geo";
import LiveTrackingMap from "@/components/map/LiveTrackingMap";

export default function AdminDashboardPage() {
  const {
    activeTrip,
    activeTripStops,
    customers,
    notifications,
    optimizeActiveRoute,
    broadcastTripSchedule,
    createNewTrip,
  } = useEnCare();

  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "schedule" | "whatsapp"
  >("overview");
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Schedule Creator State
  const [selectedCorridorIdx, setSelectedCorridorIdx] = useState(0);
  const [scheduledDate, setScheduledDate] = useState("2026-10-30");
  const [driverName, setDriverName] = useState("Kasun Bandara");
  const [driverPhone, setDriverPhone] = useState("+94771122334");
  const [vehicleNo, setVehicleNo] = useState("WP LH-4821");

  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers]
  );

  // Aggregate Operational & Financial Metrics
  const metrics = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let unreachable = 0;
    let wasteBagsCollected = 0;
    let cashCollectedLkr = 0;
    let projectedPendingLkr = 0;

    const sold = { small: 0, medium: 0, large: 0 };
    const reserved = { small: 0, medium: 0, large: 0 };

    activeTripStops.forEach((s) => {
      if (s.status === "completed") {
        completed += 1;
        wasteBagsCollected += s.bagsCollected;
        cashCollectedLkr += s.amountCollectedLkr;
        sold.small += s.bagOrder.small;
        sold.medium += s.bagOrder.medium;
        sold.large += s.bagOrder.large;
      } else if (s.status === "unreachable") {
        unreachable += 1;
      } else {
        pending += 1;
        projectedPendingLkr += calculateBagOrderTotalLkr(s.bagOrder);
        reserved.small += s.bagOrder.small;
        reserved.medium += s.bagOrder.medium;
        reserved.large += s.bagOrder.large;
      }
    });

    return {
      completed,
      pending,
      unreachable,
      wasteBagsCollected,
      cashCollectedLkr,
      projectedPendingLkr,
      sold,
      reserved,
    };
  }, [activeTripStops]);

  function showToast(msg: string) {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 4000);
  }

  function handleOptimize() {
    optimizeActiveRoute();
    showToast(
      "Route sequence optimized using Nearest-Neighbor GPS distance!"
    );
  }

  function handleBroadcastSchedule() {
    const logs = broadcastTripSchedule(activeTrip.id);
    showToast(
      `Generated ${logs.length} bilingual WhatsApp schedule invitations! Check WhatsApp Feed tab.`
    );
    setActiveTab("whatsapp");
  }

  function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    const preset = SRI_LANKA_CORRIDORS[selectedCorridorIdx];
    createNewTrip({
      title: preset.title,
      district: preset.district,
      corridorTowns: preset.towns,
      scheduledDate,
      driverName,
      driverPhone,
      vehicleNo,
      stock: { small: 60, medium: 45, large: 30 },
    });
    showToast(`Created new schedule: ${preset.title} (${scheduledDate})`);
    setActiveTab("overview");
  }

  return (
    <div className="p-3.5 space-y-4">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-bold uppercase">
                Admin & Dispatch Hub
              </span>
              <span className="text-xs text-slate-300">
                {activeTrip.vehicleNo} • Driver: {activeTrip.driverName}
              </span>
            </div>
            <h1 className="text-base font-extrabold mt-1">
              {activeTrip.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOptimize}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimize Route</span>
            </button>

            <button
              type="button"
              onClick={handleBroadcastSchedule}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Area Alert</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Completed / Total
            </div>
            <div className="text-base font-extrabold text-emerald-400 mt-0.5">
              {metrics.completed} / {activeTripStops.length} Stops
            </div>
            <div className="text-[10px] text-slate-400">
              {metrics.wasteBagsCollected} sealed bags collected
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Cash Collected
            </div>
            <div className="text-base font-extrabold text-amber-300 mt-0.5">
              LKR {metrics.cashCollectedLkr.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              +LKR {metrics.projectedPendingLkr.toLocaleString()} pending
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Bags Sold Today
            </div>
            <div className="text-base font-extrabold text-sky-300 mt-0.5">
              {metrics.sold.small + metrics.sold.medium + metrics.sold.large}{" "}
              Bags
            </div>
            <div className="text-[10px] text-slate-400">
              S:{metrics.sold.small} • M:{metrics.sold.medium} • L:
              {metrics.sold.large}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              WhatsApp Alerts
            </div>
            <div className="text-base font-extrabold text-white mt-0.5">
              {notifications.length} Dispatched
            </div>
            <div className="text-[10px] text-emerald-400">
              $0 Free wa.me + Cloud Ready
            </div>
          </div>
        </div>
      </div>

      {bannerMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Mobile-Friendly Sub-Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-200/80 p-1 rounded-2xl">
        {[
          { id: "overview", label: "Live Fleet", icon: LayoutDashboard },
          { id: "inventory", label: "Bag POS", icon: Package },
          { id: "schedule", label: "New Trip", icon: CalendarPlus },
          {
            id: "whatsapp",
            label: `Alerts (${notifications.length})`,
            icon: MessageSquare,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                active
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE FLEET & DISPATCH OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Corridor Map</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Corridor Towns: {activeTrip.corridorTowns.join(" → ")}
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {activeTrip.currentLat.toFixed(4)},{" "}
                {activeTrip.currentLng.toFixed(4)}
              </span>
            </div>

            <LiveTrackingMap
              trip={activeTrip}
              stops={activeTripStops}
              customers={customers}
              heightClass="h-72"
            />
          </div>

          {/* Dispatcher Stop Table / Mobile Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Corridor Stop Manifest ({activeTripStops.length} Households)
            </h3>

            <div className="space-y-2">
              {activeTripStops.map((stop) => {
                const cust = customerMap.get(stop.customerId);
                if (!cust) return null;
                const orderLkr =
                  stop.status === "completed"
                    ? stop.amountCollectedLkr
                    : calculateBagOrderTotalLkr(stop.bagOrder);

                return (
                  <div
                    key={stop.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                          stop.status === "completed"
                            ? "bg-emerald-600 text-white"
                            : stop.status === "approaching"
                            ? "bg-amber-500 text-slate-950"
                            : stop.status === "unreachable"
                            ? "bg-red-500 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {stop.sequenceOrder}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{cust.fullName}</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {cust.town}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {cust.phone} • {cust.address}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Bags (S/M/L): {stop.bagOrder.small}/
                          {stop.bagOrder.medium}/{stop.bagOrder.large} •{" "}
                          <strong>LKR {orderLkr.toLocaleString()}/=</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {stop.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : stop.status === "approaching" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                          <Clock className="w-3.5 h-3.5" /> Next Stop
                        </span>
                      ) : stop.status === "unreachable" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Unreachable
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold capitalize">
                          {stop.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BAG INVENTORY & CASH RECONCILIATION */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Vehicle Bag Stock & Cash Reconciliation</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Matches driver cash in hand against bio-safe bags issued at each
                stop.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {BAG_CATALOG.map((bag) => {
              const loaded = activeTrip.initialStock[bag.key];
              const sold = metrics.sold[bag.key];
              const reserved = metrics.reserved[bag.key];
              const remaining = loaded - sold;
              const revenue = sold * bag.priceLkr;

              return (
                <div
                  key={bag.key}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">
                        {bag.name}
                      </span>
                      <span className="ml-2 text-[11px] font-semibold text-emerald-700">
                        @ LKR {bag.priceLkr}/=
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      LKR {revenue.toLocaleString()}/=
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-slate-400 text-[10px]">Loaded</div>
                      <div className="font-bold text-slate-800">{loaded}</div>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <div className="text-emerald-700 text-[10px]">Sold</div>
                      <div className="font-extrabold text-emerald-900">
                        {sold}
                      </div>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <div className="text-amber-700 text-[10px]">
                        Booked Next
                      </div>
                      <div className="font-bold text-amber-900">{reserved}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-slate-400 text-[10px]">On Truck</div>
                      <div className="font-extrabold text-slate-900">
                        {remaining}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-900 text-white flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-200">
                Total Cash to Hand Over at Depot
              </div>
              <div className="text-[11px] text-emerald-300">
                Includes {metrics.completed} completed stops today
              </div>
            </div>
            <div className="text-lg font-extrabold text-amber-300">
              LKR {metrics.cashCollectedLkr.toLocaleString()}/=
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NEW CORRIDOR SCHEDULE CREATOR */}
      {activeTab === "schedule" && (
        <form
          onSubmit={handleCreateSchedule}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Create Area Collection Schedule
            </h2>
            <p className="text-[11px] text-slate-500">
              Select a Sri Lankan route corridor to schedule a run and notify
              registered households.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Route Corridor Preset
              </label>
              <select
                value={selectedCorridorIdx}
                onChange={(e) => setSelectedCorridorIdx(Number(e.target.value))}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
              >
                {SRI_LANKA_CORRIDORS.map((c, idx) => (
                  <option key={c.title} value={idx}>
                    {c.title} ({c.district})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-700 mt-1">
                Towns:{" "}
                {SRI_LANKA_CORRIDORS[selectedCorridorIdx].towns.join(" → ")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Collection Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Driver
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Driver Mobile
                </label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            📅 Publish Schedule & Queue Corridor
          </button>
        </form>
      )}

      {/* TAB 4: WHATSAPP NOTIFICATION AUDIT FEED */}
      {activeTab === "whatsapp" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Automated WhatsApp Notification Log
              </h2>
              <p className="text-[11px] text-slate-500">
                Includes 1-tap free <code className="font-mono">wa.me</code>{" "}
                links for zero-budget non-profit operation.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {notif.customerName}
                    </span>
                    <span className="ml-2 text-[11px] text-slate-500">
                      {notif.phone}
                    </span>
                  </div>
                  <a
                    href={notif.waDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                  >
                    <span>Open in WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                  {notif.messageBody}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
