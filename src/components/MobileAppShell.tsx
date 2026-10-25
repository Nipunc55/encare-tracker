"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Truck,
  UserCheck,
  LayoutDashboard,
  Radio,
  Smartphone,
  Maximize2,
  RotateCcw,
  Home,
} from "lucide-react";
import { useEnCare } from "@/lib/store";

export default function MobileAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    activeTrip,
    isSimulatingGps,
    toggleGpsSimulation,
    mobileFramePreview,
    setMobileFramePreview,
    resetDemoData,
    notifications,
  } = useEnCare();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/customer",
      label: "Customer",
      icon: UserCheck,
      active: pathname.startsWith("/customer"),
    },
    {
      href: "/driver",
      label: "Driver",
      icon: Truck,
      active: pathname.startsWith("/driver"),
    },
    {
      href: "/admin",
      label: "Admin",
      icon: LayoutDashboard,
      active: pathname.startsWith("/admin"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 flex flex-col items-center">
      {/* Desktop / Demo Control Ribbon */}
      <div className="w-full bg-slate-900 border-b border-slate-800 text-slate-200 px-3 py-2 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-[11px]">
              🌿 EnCare Sri Lanka
            </span>
            <span className="hidden sm:inline text-slate-400 text-[11px]">
              Free-Tier Mobile PWA • {activeTrip.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleGpsSimulation}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-[11px] transition cursor-pointer ${
                isSimulatingGps
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
              title="Simulate live EnCare truck movement along Yatiyantota - Hatton road"
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isSimulatingGps ? "animate-ping" : "text-emerald-400"
                }`}
              />
              {isSimulatingGps ? "Simulating GPS..." : "Simulate Truck GPS"}
            </button>

            <button
              onClick={() => setMobileFramePreview(!mobileFramePreview)}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] cursor-pointer"
              title="Toggle mobile phone frame vs responsive layout"
            >
              {mobileFramePreview ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Full Width</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phone Frame</span>
                </>
              )}
            </button>

            <button
              onClick={resetDemoData}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-[11px] cursor-pointer"
              title="Reset demo route & stops to initial state"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Responsive / Mobile Shell Container */}
      <div
        className={`w-full flex-1 flex flex-col bg-slate-50 transition-all duration-200 ${
          mobileFramePreview
            ? "md:max-w-[430px] md:my-4 md:rounded-[36px] md:border-[6px] md:border-slate-800 md:shadow-2xl overflow-hidden"
            : pathname.startsWith("/admin")
            ? "max-w-5xl"
            : "max-w-lg"
        }`}
      >
        {/* Content Area */}
        <main className="flex-1 pb-20">{children}</main>

        {/* Sticky Bottom Mobile Navigation Bar */}
        <nav className="sticky bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
                    item.active
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 ${
                        item.active ? "text-emerald-600" : "text-slate-500"
                      }`}
                    />
                    {item.label === "Admin" && notifications.length > 0 && (
                      <span className="absolute -top-1 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] mt-0.5 leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
