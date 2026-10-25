"use client";

import React, { useEffect, useRef } from "react";

interface LocationPinPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPinPicker({
  lat,
  lng,
  onChange,
}: LocationPinPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    async function setup() {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      if (!active || !containerRef.current) return;

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [lat, lng],
          zoom: 14,
          attributionControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);

        const pinIcon = L.divIcon({
          className: "encare-home-pin",
          html: `<div style="
            width:36px;height:36px;border-radius:9999px;
            background:#059669;border:3px solid #ffffff;
            box-shadow:0 4px 12px rgba(0,0,0,0.35);
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
          ">🏠</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([lat, lng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChange(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
        });

        map.on("click", (e: any) => {
          const { lat: cLat, lng: cLng } = e.latlng;
          marker.setLatLng([cLat, cLng]);
          onChange(Number(cLat.toFixed(5)), Number(cLng.toFixed(5)));
        });

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        markerRef.current?.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
      }
    }

    setup();

    return () => {
      active = false;
    };
  }, [lat, lng, onChange]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-emerald-200 bg-slate-100">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute top-2 left-2 right-2 z-[400] px-2.5 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white text-[11px] flex items-center justify-between">
        <span>👆 Tap map or drag 🏠 pin to exact gate</span>
        <span className="font-mono text-emerald-300">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
