"use client";

import React from "react";
import Link from "next/link";
import {
  Truck,
  UserCheck,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Package,
  PhoneOff,
} from "lucide-react";
import { useEnCare } from "@/lib/store";
import { BAG_CATALOG } from "@/lib/constants";

export default function HomePage() {
  const { activeTrip, activeTripStops, notifications } = useEnCare();

  const completedCount = activeTripStops.filter(
    (s) => s.status === "completed"
  ).length;
  const pendingCount = activeTripStops.filter(
    (s) => s.status !== "completed" && s.status !== "unreachable"
  ).length;

  return (
    <div className="p-4 space-y-5">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-emerald-100 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Non-Profit Free Tier • Mobile PWA
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight mt-2.5">
              EnCare Tracker
            </h1>
            <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
              Door-to-door sanitary, diaper & domestic clinical waste collection
              across Sri Lanka — replacing manual WhatsApp group chaos with
              1-click requests and live vehicle radar.
            </p>
          </div>
        </div>

        {/* Live Corridor Pill */}
        <div className="mt-4 p-3 rounded-2xl bg-black/25 border border-white/15 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <div className="text-[11px] text-emerald-200 font-medium">
                Active Route Today ({activeTrip.vehicleNo})
              </div>
              <div className="text-xs font-bold text-white">
                {activeTrip.title}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-bold text-emerald-300">
              {completedCount}/{activeTripStops.length} Done
            </div>
            <div className="text-[10px] text-emerald-100">
              {pendingCount} stops left
            </div>
          </div>
        </div>
      </div>

      {/* Role Portal Cards (Thumb-Friendly Mobile Cards) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Select Mobile Portal
        </h2>

        <Link
          href="/customer"
          className="block p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:border-emerald-400 active:scale-[0.99] transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Customer Portal
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Live Radar
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  1-Click pickup confirmation, exact home GPS pin, live vehicle
                  ETA (&ldquo;2 stops away&rdquo;), and bio-safe bag ordering.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
          </div>
        </Link>

        <Link
          href="/driver"
          className="block p-4 rounded-2xl bg-white border border-amber-200 shadow-sm hover:border-amber-400 active:scale-[0.99] transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Driver Field App
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    Hands-Free
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Sorted stop sequence, 1-tap Google Maps / Waze launch, bag POS
                  calculator, and automatic &ldquo;2 stops away&rdquo; WhatsApp
                  alerts.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
          </div>
        </Link>

        <Link
          href="/admin"
          className="block p-4 rounded-2xl bg-white border border-sky-200 shadow-sm hover:border-sky-400 active:scale-[0.99] transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Admin & Dispatch Hub
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                    {notifications.length} Alerts Sent
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Route optimizer, live fleet map, bag stock & LKR cash
                  reconciliation, and 1-click WhatsApp area schedule broadcasts.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-sky-600 shrink-0 mt-1" />
          </div>
        </Link>
      </div>

      {/* Transparent Commercial Model Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Free Collection • Pay Only Per Bag
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Reg & Transport: LKR 0/=
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {BAG_CATALOG.map((bag) => (
            <div
              key={bag.key}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center"
            >
              <div className="text-[11px] font-semibold text-slate-600">
                {bag.key.toUpperCase()}
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                LKR {bag.priceLkr}/=
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {bag.capacity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How We Solved the WhatsApp Pain Points */}
      <div className="rounded-2xl bg-slate-900 text-slate-200 p-4 space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Why EnCare Switched from Manual WhatsApp Groups
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl">
            <PhoneOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">
                Zero Driver Distraction:
              </span>{" "}
              Customers check the live Uber-style radar instead of calling the
              driver on narrow mountain roads.
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">
                Saved Home GPS Pins:
              </span>{" "}
              Customers drop their house pin once—no more buried{" "}
              <code className="text-emerald-300">&ldquo;Matath one&rdquo;</code>{" "}
              messages in group chats.
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl">
            <MessageCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">
                $0 Click-to-WhatsApp Alerts:
              </span>{" "}
              Pre-filled Sinhala & English WhatsApp alerts notify the next 2
              homes automatically when a pickup finishes.
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">
                100% Free-Tier Hosted:
              </span>{" "}
              Built for Vercel + Supabase Free Tier with throttled ephemeral GPS
              streaming and automatic 5-day database keep-alive.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
