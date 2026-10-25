"use client";

import React, { useEffect, useRef } from "react";
import { Customer, Trip, TripStop } from "@/lib/types";

interface LiveTrackingMapProps {
  trip: Trip;
  stops: TripStop[];
  customers: Customer[];
  highlightCustomerId?: string;
  privacyObfuscated?: boolean;
  heightClass?: string;
}

export default function LiveTrackingMap({
  trip,
  stops,
  customers,
  highlightCustomerId,
  privacyObfuscated = false,
  heightClass = "h-64",
}: LiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [trip.currentLat, trip.currentLng],
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        });

        // Free OpenStreetMap tiles ($0 cost, no API key required)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);
        layerGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      const group = layerGroupRef.current;
      if (!map || !group) return;

      group.clearLayers();

      const customerMap = new Map(customers.map((c) => [c.id, c]));
      const routeCoords: [number, number][] = [];

      // Plot ordered stops
      const sortedStops = [...stops].sort(
        (a, b) => a.sequenceOrder - b.sequenceOrder
      );

      sortedStops.forEach((stop) => {
        const cust = customerMap.get(stop.customerId);
        if (!cust) return;
        routeCoords.push([cust.lat, cust.lng]);

        const isHighlighted = cust.id === highlightCustomerId;
        const statusColors: Record<string, string> = {
          completed: "#10b981", // emerald
          approaching: "#f59e0b", // amber pulse
          confirmed: "#0ea5e9", // sky blue
          pending: "#64748b", // slate
          unreachable: "#ef4444", // red
          rescheduled: "#8b5cf6",
        };
        const bg = statusColors[stop.status] || "#0ea5e9";
        const size = isHighlighted ? 34 : 26;

        const iconHtml = `
          <div style="
            width:${size}px;
            height:${size}px;
            border-radius:9999px;
            background:${bg};
            border:${isHighlighted ? "3px solid #ffffff" : "2px solid #ffffff"};
            box-shadow:0 3px 10px rgba(0,0,0,0.35);
            color:#ffffff;
            font-weight:700;
            font-size:${isHighlighted ? "13px" : "11px"};
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            ${stop.status === "completed" ? "✓" : stop.sequenceOrder}
          </div>
        `;

        const marker = L.marker([cust.lat, cust.lng], {
          icon: L.divIcon({
            className: "encare-stop-pin",
            html: iconHtml,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          }),
        });

        marker.bindPopup(
          `<div style="font-family:sans-serif;min-width:160px;">
            <div style="font-weight:700;font-size:13px;color:#0f172a;">#${stop.sequenceOrder} ${cust.fullName}</div>
            <div style="font-size:11px;color:#475569;">${cust.town} • ${stop.status.toUpperCase()}</div>
            ${
              cust.landmarkNotes
                ? `<div style="font-size:11px;color:#059669;margin-top:3px;">📍 ${cust.landmarkNotes}</div>`
                : ""
            }
          </div>`
        );

        marker.addTo(group);
      });

      // Draw route polyline connecting stops
      if (routeCoords.length > 1) {
        L.polyline(routeCoords, {
          color: "#059669",
          weight: 4,
          opacity: 0.65,
          dashArray: "6, 8",
        }).addTo(group);
      }

      // Draw EnCare Collection Vehicle Marker
      if (!privacyObfuscated && trip.isBroadcasting) {
        const truckHtml = `
          <div style="
            position:relative;
            width:42px;
            height:42px;
            border-radius:9999px;
            background:#065f46;
            border:3px solid #34d399;
            box-shadow:0 0 0 6px rgba(16,185,129,0.28), 0 6px 14px rgba(0,0,0,0.45);
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:20px;
          ">
            🚛
          </div>
        `;

        const truckMarker = L.marker([trip.currentLat, trip.currentLng], {
          icon: L.divIcon({
            className: "encare-truck-pin",
            html: truckHtml,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          }),
          zIndexOffset: 1000,
        });

        truckMarker.bindPopup(
          `<div style="font-family:sans-serif;">
            <strong style="color:#065f46;">EnCare Vehicle (${trip.vehicleNo})</strong><br/>
            <span style="font-size:11px;color:#334155;">Driver: ${trip.driverName}</span>
          </div>`
        );

        truckMarker.addTo(group);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [trip, stops, customers, highlightCustomerId, privacyObfuscated]);

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 bg-slate-100`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top-left Live Radar Badge */}
      <div className="absolute top-2.5 left-2.5 z-[400] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-medium shadow-md">
        <span
          className={`w-2 h-2 rounded-full ${
            trip.isBroadcasting
              ? "bg-emerald-400 animate-ping"
              : "bg-amber-400"
          }`}
        />
        <span>
          {trip.isBroadcasting
            ? `LIVE GPS • ${trip.vehicleNo}`
            : "GPS Paused"}
        </span>
      </div>

      {/* Bottom-left Map Legend */}
      <div className="absolute bottom-2.5 left-2.5 z-[400] flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 text-[10px] font-medium text-slate-700 shadow-sm">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Next
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-500" /> Confirmed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Missed
        </span>
      </div>
    </div>
  );
}
