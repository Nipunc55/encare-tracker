"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  CheckCircle2,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import { useEnCare } from "@/lib/store";
import { WASTE_CATEGORIES } from "@/lib/constants";
import { BagQuantities, WasteTypeId } from "@/lib/types";
import LocationPinPicker from "@/components/map/LocationPinPicker";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { registerCustomer } = useEnCare();

  const [step, setStep] = useState<"phone" | "profile">("phone");
  const [phone, setPhone] = useState("0774567890");
  const [otp, setOtp] = useState("4821");
  const [fullName, setFullName] = useState("");
  const [district, setDistrict] = useState("Kegalle");
  const [town, setTown] = useState("Yatiyantota");
  const [address, setAddress] = useState("");
  const [landmarkNotes, setLandmarkNotes] = useState("");
  // Default pin near Yatiyantota town
  const [lat, setLat] = useState(7.0285);
  const [lng, setLng] = useState(80.294);
  const [wasteTypes, setWasteTypes] = useState<WasteTypeId[]>([
    "diapers",
    "sanitary",
  ]);
  const [bagOrder] = useState<BagQuantities>({
    small: 1,
    medium: 1,
    large: 0,
  });

  function handleUseCurrentGps() {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(5)));
          setLng(Number(pos.coords.longitude.toFixed(5)));
        },
        () => {
          // Fallback slight offset in Yatiyantota if blocked
          setLat(7.0312);
          setLng(80.2965);
        }
      );
    }
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setStep("profile");
  }

  function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;

    registerCustomer({
      fullName: fullName.trim(),
      phone,
      district,
      town,
      address: address.trim() || `${town} Main Road`,
      landmarkNotes: landmarkNotes.trim(),
      lat,
      lng,
      wasteTypes,
      bagOrder,
    });

    router.push("/customer");
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/customer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Radar</span>
        </Link>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
          Free Registration
        </span>
      </div>

      {step === "phone" ? (
        <form
          onSubmit={handleVerifyOtp}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900">
                Verify Your Mobile Number
              </h1>
              <p className="text-xs text-slate-500">
                Used for automated WhatsApp ETA & pickup alerts
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number (WhatsApp Active)
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="077XXXXXXX"
              className="w-full text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              SMS / WhatsApp 4-Digit OTP (Demo Pre-filled)
            </label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-sm font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Verify & Set Home GPS Pin →
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleCompleteRegistration}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4"
        >
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" /> Phone Verified ({phone})
            </span>
            <h1 className="text-base font-extrabold text-slate-900 mt-0.5">
              Save Your Permanent Home GPS Pin
            </h1>
            <p className="text-xs text-slate-500">
              Set once so the EnCare driver never needs to call you for
              directions while driving.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Household / Clinic Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Samanthi Silva"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  District
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                >
                  <option value="Kegalle">Kegalle</option>
                  <option value="Nuwara Eliya">Nuwara Eliya</option>
                  <option value="Ratnapura">Ratnapura</option>
                  <option value="Matara">Matara</option>
                  <option value="Colombo">Colombo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Town / Area
                </label>
                <input
                  type="text"
                  required
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="e.g., Yatiyantota"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            {/* Interactive Pin Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pin Exact Gate Location</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentGps}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  <Navigation className="w-3 h-3" /> Use Phone GPS
                </button>
              </div>

              <LocationPinPicker
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., No. 28, Colombo-Hatton Rd, Yatiyantota"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Landmark / Gate Description for Driver
              </label>
              <input
                type="text"
                value={landmarkNotes}
                onChange={(e) => setLandmarkNotes(e.target.value)}
                placeholder="e.g., Opposite cooperative shop, brown gate"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Usual Waste Categories
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WASTE_CATEGORIES.map((w) => {
                  const active = wasteTypes.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() =>
                        setWasteTypes((prev) =>
                          prev.includes(w.id)
                            ? prev.filter((x) => x !== w.id)
                            : [...prev, w.id]
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${
                        active
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {w.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Pin & Add to Today&apos;s Route</span>
          </button>
        </form>
      )}
    </div>
  );
}
