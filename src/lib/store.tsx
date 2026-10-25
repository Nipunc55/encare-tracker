"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BAG_PRICES_LKR,
  INITIAL_CUSTOMERS,
  INITIAL_STOPS,
  INITIAL_TRIPS,
} from "./constants";
import {
  calculateBagOrderTotalLkr,
  estimateStopEta,
  haversineDistanceKm,
  optimizeStopSequence,
} from "./geo";
import { isSupabaseConfigured, supabase } from "./supabase";
import {
  BagQuantities,
  Customer,
  EnCareAppState,
  NotificationLog,
  Trip,
  TripStop,
  WasteTypeId,
} from "./types";
import { generateWhatsAppMessage } from "./whatsapp";

const STORAGE_KEY = "encare_tracker_state_v1";
const BROADCAST_CHANNEL = "encare_realtime_sync";

function createInitialNotifications(): NotificationLog[] {
  const trip = INITIAL_TRIPS[0];
  const cust3 = INITIAL_CUSTOMERS[2]; // Kumari in Yatiyantota
  const cust4 = INITIAL_CUSTOMERS[3]; // Chandralatha in Kitulgala
  const cust2 = INITIAL_CUSTOMERS[1]; // Ruwanpathirana in Karawanella

  const receiptMsg = generateWhatsAppMessage({
    templateType: "receipt",
    customer: cust2,
    trip,
    bagsCollected: 3,
    bagOrder: { small: 0, medium: 2, large: 1 },
    amountLkr: 2420,
  });

  const etaMsg3 = generateWhatsAppMessage({
    templateType: "eta_approaching",
    customer: cust3,
    trip,
    stopsAway: 1,
    etaMinutes: 6,
  });

  const etaMsg4 = generateWhatsAppMessage({
    templateType: "eta_approaching",
    customer: cust4,
    trip,
    stopsAway: 2,
    etaMinutes: 22,
  });

  return [
    {
      id: "notif-3",
      tripId: trip.id,
      customerId: cust4.id,
      customerName: cust4.fullName,
      phone: cust4.phone,
      templateType: "eta_approaching",
      messageBody: etaMsg4.messageBody,
      waDeepLink: etaMsg4.waDeepLink,
      deliveryMode: "wa_link",
      sentAt: "2026-10-25T10:06:10Z",
    },
    {
      id: "notif-2",
      tripId: trip.id,
      customerId: cust3.id,
      customerName: cust3.fullName,
      phone: cust3.phone,
      templateType: "eta_approaching",
      messageBody: etaMsg3.messageBody,
      waDeepLink: etaMsg3.waDeepLink,
      deliveryMode: "wa_link",
      sentAt: "2026-10-25T10:06:00Z",
    },
    {
      id: "notif-1",
      tripId: trip.id,
      customerId: cust2.id,
      customerName: cust2.fullName,
      phone: cust2.phone,
      templateType: "receipt",
      messageBody: receiptMsg.messageBody,
      waDeepLink: receiptMsg.waDeepLink,
      deliveryMode: "wa_link",
      sentAt: "2026-10-25T10:05:30Z",
    },
  ];
}

const DEFAULT_STATE: EnCareAppState = {
  customers: INITIAL_CUSTOMERS,
  trips: INITIAL_TRIPS,
  stops: INITIAL_STOPS,
  notifications: createInitialNotifications(),
  activeTripId: INITIAL_TRIPS[0].id,
  activeCustomerId: "cust-3", // Default to Kumari Wickramasinghe (Yatiyantota - Next Stop!)
};

interface EnCareContextValue extends EnCareAppState {
  activeTrip: Trip;
  activeCustomer: Customer;
  activeTripStops: TripStop[];
  isSimulatingGps: boolean;
  mobileFramePreview: boolean;
  setMobileFramePreview: (val: boolean) => void;
  setActiveCustomerId: (id: string) => void;
  setActiveTripId: (id: string) => void;
  toggleGpsBroadcast: () => void;
  toggleGpsSimulation: () => void;
  updateTruckLocation: (lat: number, lng: number) => void;
  completeStop: (params: {
    stopId: string;
    bagsCollected: number;
    bagOrder: BagQuantities;
    notes?: string;
  }) => NotificationLog[];
  markStopUnreachable: (stopId: string, reason: string) => NotificationLog | null;
  confirmCustomerPickup: (params: {
    customerId: string;
    wasteTypes: WasteTypeId[];
    bagOrder: BagQuantities;
    notes: string;
  }) => void;
  registerCustomer: (params: {
    fullName: string;
    phone: string;
    district: string;
    town: string;
    address: string;
    landmarkNotes: string;
    lat: number;
    lng: number;
    wasteTypes: WasteTypeId[];
    bagOrder: BagQuantities;
  }) => Customer;
  updateCustomerProfile: (params: {
    id: string;
    fullName?: string;
    phone?: string;
    district?: string;
    town?: string;
    address?: string;
    landmarkNotes?: string;
    lat?: number;
    lng?: number;
  }) => void;
  optimizeActiveRoute: () => void;
  broadcastTripSchedule: (tripId: string) => NotificationLog[];
  createNewTrip: (params: {
    title: string;
    district: string;
    corridorTowns: string[];
    scheduledDate: string;
    driverName: string;
    driverPhone: string;
    vehicleNo: string;
    stock: BagQuantities;
  }) => Trip;
  resetDemoData: () => void;
}

const EnCareContext = createContext<EnCareContextValue | null>(null);

export function EnCareProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EnCareAppState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const [mobileFramePreview, setMobileFramePreview] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Hydrate from localStorage + setup cross-tab BroadcastChannel + optional Supabase Realtime
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EnCareAppState;
        if (parsed?.customers?.length && parsed?.trips?.length) {
          setState(parsed);
        }
      }
    } catch {
      // Ignore storage parse error
    }
    setIsHydrated(true);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL);
      bc.onmessage = (ev) => {
        if (ev.data?.type === "STATE_SYNC" && ev.data?.payload) {
          setState(ev.data.payload);
        }
      };
      channelRef.current = bc;
      return () => bc.close();
    }
  }, []);

  // Optional Supabase Ephemeral Broadcast Channel (0 DB write cost for live GPS)
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;
    const channel = client
      .channel("encare-live-gps")
      .on("broadcast", { event: "gps_ping" }, ({ payload }) => {
        if (payload?.tripId && typeof payload.lat === "number") {
          setState((prev) => ({
            ...prev,
            trips: prev.trips.map((t) =>
              t.id === payload.tripId
                ? {
                    ...t,
                    currentLat: payload.lat,
                    currentLng: payload.lng,
                    lastGpsAt: new Date().toISOString(),
                  }
                : t
            ),
          }));
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const persistAndBroadcast = useCallback(
    (updater: (prev: EnCareAppState) => EnCareAppState) => {
      setState((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          channelRef.current?.postMessage({ type: "STATE_SYNC", payload: next });
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
    },
    []
  );

  const activeTrip = useMemo(
    () =>
      state.trips.find((t) => t.id === state.activeTripId) || state.trips[0],
    [state.trips, state.activeTripId]
  );

  const activeCustomer = useMemo(
    () =>
      state.customers.find((c) => c.id === state.activeCustomerId) ||
      state.customers[0],
    [state.customers, state.activeCustomerId]
  );

  const activeTripStops = useMemo(
    () =>
      state.stops
        .filter((s) => s.tripId === activeTrip.id)
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder),
    [state.stops, activeTrip.id]
  );

  const updateTruckLocation = useCallback(
    (lat: number, lng: number) => {
      persistAndBroadcast((prev) => ({
        ...prev,
        trips: prev.trips.map((t) =>
          t.id === prev.activeTripId
            ? {
                ...t,
                currentLat: Number(lat.toFixed(5)),
                currentLng: Number(lng.toFixed(5)),
                lastGpsAt: new Date().toISOString(),
              }
            : t
        ),
      }));

      // Send ephemeral broadcast if Supabase is connected (Free-tier friendly)
      if (isSupabaseConfigured && supabase) {
        supabase.channel("encare-live-gps").send({
          type: "broadcast",
          event: "gps_ping",
          payload: { tripId: activeTrip.id, lat, lng },
        });
      }
    },
    [persistAndBroadcast, activeTrip.id]
  );

  // Built-in GPS Truck Simulator: Smoothly moves the truck toward the next pending stop
  useEffect(() => {
    if (!isSimulatingGps) return;
    const timer = setInterval(() => {
      setState((prev) => {
        const trip =
          prev.trips.find((t) => t.id === prev.activeTripId) || prev.trips[0];
        if (!trip) return prev;

        const nextStop = prev.stops
          .filter(
            (s) =>
              s.tripId === trip.id &&
              s.status !== "completed" &&
              s.status !== "unreachable"
          )
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder)[0];

        if (!nextStop) return prev;
        const targetCust = prev.customers.find(
          (c) => c.id === nextStop.customerId
        );
        if (!targetCust) return prev;

        const dLat = targetCust.lat - trip.currentLat;
        const dLng = targetCust.lng - trip.currentLng;
        const dist = haversineDistanceKm(
          trip.currentLat,
          trip.currentLng,
          targetCust.lat,
          targetCust.lng
        );

        // If very close to target stop, nudge slightly or loop back slightly
        const stepFactor = dist < 0.15 ? 0.05 : 0.18;
        const newLat = Number((trip.currentLat + dLat * stepFactor).toFixed(5));
        const newLng = Number((trip.currentLng + dLng * stepFactor).toFixed(5));

        const next: EnCareAppState = {
          ...prev,
          trips: prev.trips.map((t) =>
            t.id === trip.id
              ? {
                  ...t,
                  isBroadcasting: true,
                  currentLat: newLat,
                  currentLng: newLng,
                  lastGpsAt: new Date().toISOString(),
                }
              : t
          ),
        };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          channelRef.current?.postMessage({ type: "STATE_SYNC", payload: next });
        } catch {
          // ignore
        }
        return next;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [isSimulatingGps]);

  const setActiveCustomerId = useCallback(
    (id: string) => {
      persistAndBroadcast((prev) => ({ ...prev, activeCustomerId: id }));
    },
    [persistAndBroadcast]
  );

  const setActiveTripId = useCallback(
    (id: string) => {
      persistAndBroadcast((prev) => ({ ...prev, activeTripId: id }));
    },
    [persistAndBroadcast]
  );

  const toggleGpsBroadcast = useCallback(() => {
    persistAndBroadcast((prev) => ({
      ...prev,
      trips: prev.trips.map((t) =>
        t.id === prev.activeTripId
          ? {
              ...t,
              isBroadcasting: !t.isBroadcasting,
              lastGpsAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  }, [persistAndBroadcast]);

  const toggleGpsSimulation = useCallback(() => {
    setIsSimulatingGps((prev) => !prev);
  }, []);

  /**
   * Marks a stop as Completed, records bags collected & sold, moves truck pin to that stop,
   * and automatically generates:
   * 1. Digital Receipt WhatsApp message for the completed customer
   * 2. "EnCare is 1-2 stops away (~15 mins)" WhatsApp alert for the next 2 stops!
   */
  const completeStop = useCallback(
    (params: {
      stopId: string;
      bagsCollected: number;
      bagOrder: BagQuantities;
      notes?: string;
    }): NotificationLog[] => {
      let generatedLogs: NotificationLog[] = [];

      persistAndBroadcast((prev) => {
        const stop = prev.stops.find((s) => s.id === params.stopId);
        if (!stop) return prev;

        const trip =
          prev.trips.find((t) => t.id === stop.tripId) || prev.trips[0];
        const customer = prev.customers.find((c) => c.id === stop.customerId);
        if (!trip || !customer) return prev;

        const amountLkr = calculateBagOrderTotalLkr(params.bagOrder);
        const nowIso = new Date().toISOString();

        // 1. Receipt Notification for completed stop
        const receipt = generateWhatsAppMessage({
          templateType: "receipt",
          customer,
          trip,
          bagsCollected: params.bagsCollected,
          bagOrder: params.bagOrder,
          amountLkr,
        });

        const newLogs: NotificationLog[] = [
          {
            id: `notif-${Date.now()}-receipt`,
            tripId: trip.id,
            customerId: customer.id,
            customerName: customer.fullName,
            phone: customer.phone,
            templateType: "receipt",
            messageBody: receipt.messageBody,
            waDeepLink: receipt.waDeepLink,
            deliveryMode: "wa_link",
            sentAt: nowIso,
          },
        ];

        // Find remaining stops after this one
        const remainingStops = prev.stops
          .filter(
            (s) =>
              s.tripId === trip.id &&
              s.id !== stop.id &&
              s.status !== "completed" &&
              s.status !== "unreachable"
          )
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

        const nextFirstId = remainingStops[0]?.id;
        const alertTargets = remainingStops.slice(0, 2); // Next 2 stops get ETA alerts

        alertTargets.forEach((upcomingStop, idx) => {
          const upCust = prev.customers.find(
            (c) => c.id === upcomingStop.customerId
          );
          if (!upCust) return;
          const { etaMinutes } = estimateStopEta(
            customer.lat,
            customer.lng,
            upCust.lat,
            upCust.lng,
            idx
          );
          const etaMsg = generateWhatsAppMessage({
            templateType: "eta_approaching",
            customer: upCust,
            trip,
            stopsAway: idx + 1,
            etaMinutes,
          });
          newLogs.unshift({
            id: `notif-${Date.now()}-eta-${idx}`,
            tripId: trip.id,
            customerId: upCust.id,
            customerName: upCust.fullName,
            phone: upCust.phone,
            templateType: "eta_approaching",
            messageBody: etaMsg.messageBody,
            waDeepLink: etaMsg.waDeepLink,
            deliveryMode: "wa_link",
            sentAt: nowIso,
          });
        });

        generatedLogs = newLogs;

        const updatedStops = prev.stops.map((s) => {
          if (s.id === stop.id) {
            return {
              ...s,
              status: "completed" as const,
              bagsCollected: params.bagsCollected,
              bagOrder: params.bagOrder,
              amountCollectedLkr: amountLkr,
              notes: params.notes ?? s.notes,
              completedAt: nowIso,
            };
          }
          if (s.id === nextFirstId) {
            return {
              ...s,
              status: "approaching" as const,
              etaAlertSent: true,
            };
          }
          if (alertTargets.some((t) => t.id === s.id)) {
            return {
              ...s,
              etaAlertSent: true,
            };
          }
          return s;
        });

        const updatedTrips = prev.trips.map((t) =>
          t.id === trip.id
            ? {
                ...t,
                currentLat: customer.lat,
                currentLng: customer.lng,
                lastGpsAt: nowIso,
              }
            : t
        );

        return {
          ...prev,
          stops: updatedStops,
          trips: updatedTrips,
          notifications: [...newLogs, ...prev.notifications],
        };
      });

      return generatedLogs;
    },
    [persistAndBroadcast]
  );

  const markStopUnreachable = useCallback(
    (stopId: string, reason: string): NotificationLog | null => {
      let createdLog: NotificationLog | null = null;

      persistAndBroadcast((prev) => {
        const stop = prev.stops.find((s) => s.id === stopId);
        if (!stop) return prev;
        const trip =
          prev.trips.find((t) => t.id === stop.tripId) || prev.trips[0];
        const customer = prev.customers.find((c) => c.id === stop.customerId);
        if (!trip || !customer) return prev;

        const nowIso = new Date().toISOString();
        const missedMsg = generateWhatsAppMessage({
          templateType: "missed_stop",
          customer,
          trip,
        });

        const newLog: NotificationLog = {
          id: `notif-${Date.now()}-missed`,
          tripId: trip.id,
          customerId: customer.id,
          customerName: customer.fullName,
          phone: customer.phone,
          templateType: "missed_stop",
          messageBody: missedMsg.messageBody,
          waDeepLink: missedMsg.waDeepLink,
          deliveryMode: "wa_link",
          sentAt: nowIso,
        };
        createdLog = newLog;

        const remainingStops = prev.stops
          .filter(
            (s) =>
              s.tripId === trip.id &&
              s.id !== stop.id &&
              s.status !== "completed" &&
              s.status !== "unreachable"
          )
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

        const nextFirstId = remainingStops[0]?.id;

        return {
          ...prev,
          stops: prev.stops.map((s) => {
            if (s.id === stop.id) {
              return {
                ...s,
                status: "unreachable" as const,
                notes: reason || "Customer phone unreachable",
                completedAt: nowIso,
              };
            }
            if (s.id === nextFirstId) {
              return { ...s, status: "approaching" as const };
            }
            return s;
          }),
          notifications: [newLog, ...prev.notifications],
        };
      });

      return createdLog;
    },
    [persistAndBroadcast]
  );

  const confirmCustomerPickup = useCallback(
    (params: {
      customerId: string;
      wasteTypes: WasteTypeId[];
      bagOrder: BagQuantities;
      notes: string;
    }) => {
      persistAndBroadcast((prev) => {
        const existingStop = prev.stops.find(
          (s) =>
            s.tripId === prev.activeTripId && s.customerId === params.customerId
        );

        if (existingStop) {
          return {
            ...prev,
            stops: prev.stops.map((s) =>
              s.id === existingStop.id
                ? {
                    ...s,
                    status:
                      s.status === "pending" || s.status === "unreachable"
                        ? "confirmed"
                        : s.status,
                    wasteTypes: params.wasteTypes,
                    bagOrder: params.bagOrder,
                    notes: params.notes,
                  }
                : s
            ),
          };
        }

        const maxSeq = prev.stops
          .filter((s) => s.tripId === prev.activeTripId)
          .reduce((max, s) => Math.max(max, s.sequenceOrder), 0);

        const newStop: TripStop = {
          id: `stop-${Date.now()}`,
          tripId: prev.activeTripId,
          customerId: params.customerId,
          sequenceOrder: maxSeq + 1,
          status: "confirmed",
          wasteTypes: params.wasteTypes,
          bagsCollected: 0,
          bagOrder: params.bagOrder,
          amountCollectedLkr: 0,
          notes: params.notes,
          etaAlertSent: false,
        };

        return {
          ...prev,
          stops: [...prev.stops, newStop],
        };
      });
    },
    [persistAndBroadcast]
  );

  const registerCustomer = useCallback(
    (params: {
      fullName: string;
      phone: string;
      district: string;
      town: string;
      address: string;
      landmarkNotes: string;
      lat: number;
      lng: number;
      wasteTypes: WasteTypeId[];
      bagOrder: BagQuantities;
    }): Customer => {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        fullName: params.fullName,
        phone: params.phone.startsWith("+")
          ? params.phone
          : `+94${params.phone.replace(/^0/, "")}`,
        district: params.district,
        town: params.town,
        address: params.address,
        landmarkNotes: params.landmarkNotes,
        lat: params.lat,
        lng: params.lng,
        preferredLang: "si",
        createdAt: new Date().toISOString(),
      };

      persistAndBroadcast((prev) => {
        const maxSeq = prev.stops
          .filter((s) => s.tripId === prev.activeTripId)
          .reduce((max, s) => Math.max(max, s.sequenceOrder), 0);

        const newStop: TripStop = {
          id: `stop-${Date.now()}`,
          tripId: prev.activeTripId,
          customerId: newCust.id,
          sequenceOrder: maxSeq + 1,
          status: "confirmed",
          wasteTypes: params.wasteTypes,
          bagsCollected: 0,
          bagOrder: params.bagOrder,
          amountCollectedLkr: 0,
          notes: params.landmarkNotes,
          etaAlertSent: false,
        };

        return {
          ...prev,
          customers: [...prev.customers, newCust],
          stops: [...prev.stops, newStop],
          activeCustomerId: newCust.id,
        };
      });

      return newCust;
    },
    [persistAndBroadcast]
  );

  const updateCustomerProfile = useCallback(
    (params: {
      id: string;
      fullName?: string;
      phone?: string;
      district?: string;
      town?: string;
      address?: string;
      landmarkNotes?: string;
      lat?: number;
      lng?: number;
    }) => {
      persistAndBroadcast((prev) => ({
        ...prev,
        customers: prev.customers.map((c) =>
          c.id === params.id ? { ...c, ...params } : c
        ),
      }));
    },
    [persistAndBroadcast]
  );

  const optimizeActiveRoute = useCallback(() => {
    persistAndBroadcast((prev) => {
      const trip =
        prev.trips.find((t) => t.id === prev.activeTripId) || prev.trips[0];
      if (!trip) return prev;

      const tripStops = prev.stops.filter((s) => s.tripId === trip.id);
      const otherStops = prev.stops.filter((s) => s.tripId !== trip.id);
      const optimized = optimizeStopSequence(
        trip.currentLat,
        trip.currentLng,
        tripStops,
        prev.customers
      );

      return {
        ...prev,
        stops: [...otherStops, ...optimized],
      };
    });
  }, [persistAndBroadcast]);

  const broadcastTripSchedule = useCallback(
    (tripId: string): NotificationLog[] => {
      let logs: NotificationLog[] = [];
      persistAndBroadcast((prev) => {
        const trip = prev.trips.find((t) => t.id === tripId);
        if (!trip) return prev;
        const tripStops = prev.stops.filter((s) => s.tripId === trip.id);
        const nowIso = new Date().toISOString();

        logs = tripStops
          .map((s, idx): NotificationLog | null => {
            const cust = prev.customers.find((c) => c.id === s.customerId);
            if (!cust) return null;
            const msg = generateWhatsAppMessage({
              templateType: "schedule_broadcast",
              customer: cust,
              trip,
            });
            return {
              id: `notif-${Date.now()}-bcast-${idx}`,
              tripId: trip.id,
              customerId: cust.id,
              customerName: cust.fullName,
              phone: cust.phone,
              templateType: "schedule_broadcast",
              messageBody: msg.messageBody,
              waDeepLink: msg.waDeepLink,
              deliveryMode: "wa_link",
              sentAt: nowIso,
            };
          })
          .filter((x): x is NotificationLog => x !== null);

        return {
          ...prev,
          notifications: [...logs, ...prev.notifications],
        };
      });
      return logs;
    },
    [persistAndBroadcast]
  );

  const createNewTrip = useCallback(
    (params: {
      title: string;
      district: string;
      corridorTowns: string[];
      scheduledDate: string;
      driverName: string;
      driverPhone: string;
      vehicleNo: string;
      stock: BagQuantities;
    }): Trip => {
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        title: params.title,
        district: params.district,
        corridorTowns: params.corridorTowns,
        scheduledDate: params.scheduledDate,
        driverName: params.driverName,
        driverPhone: params.driverPhone,
        vehicleNo: params.vehicleNo,
        status: "scheduled",
        isBroadcasting: false,
        currentLat: 7.0435,
        currentLng: 80.2812,
        lastGpsAt: new Date().toISOString(),
        initialStock: params.stock,
      };

      persistAndBroadcast((prev) => ({
        ...prev,
        trips: [newTrip, ...prev.trips],
        activeTripId: newTrip.id,
      }));

      return newTrip;
    },
    [persistAndBroadcast]
  );

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsSimulatingGps(false);
    setState(DEFAULT_STATE);
    channelRef.current?.postMessage({
      type: "STATE_SYNC",
      payload: DEFAULT_STATE,
    });
  }, []);

  const value = useMemo<EnCareContextValue>(
    () => ({
      ...state,
      activeTrip,
      activeCustomer,
      activeTripStops,
      isSimulatingGps,
      mobileFramePreview,
      setMobileFramePreview,
      setActiveCustomerId,
      setActiveTripId,
      toggleGpsBroadcast,
      toggleGpsSimulation,
      updateTruckLocation,
      completeStop,
      markStopUnreachable,
      confirmCustomerPickup,
      registerCustomer,
      updateCustomerProfile,
      optimizeActiveRoute,
      broadcastTripSchedule,
      createNewTrip,
      resetDemoData,
    }),
    [
      state,
      activeTrip,
      activeCustomer,
      activeTripStops,
      isSimulatingGps,
      mobileFramePreview,
      setActiveCustomerId,
      setActiveTripId,
      toggleGpsBroadcast,
      toggleGpsSimulation,
      updateTruckLocation,
      completeStop,
      markStopUnreachable,
      confirmCustomerPickup,
      registerCustomer,
      updateCustomerProfile,
      optimizeActiveRoute,
      broadcastTripSchedule,
      createNewTrip,
      resetDemoData,
    ]
  );

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 text-emerald-400 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
            🌿
          </div>
          <p className="text-xs font-medium tracking-wider uppercase text-slate-400">
            Loading EnCare Mobile Platform...
          </p>
        </div>
      </div>
    );
  }

  return (
    <EnCareContext.Provider value={value}>{children}</EnCareContext.Provider>
  );
}

export function useEnCare() {
  const ctx = useContext(EnCareContext);
  if (!ctx) {
    throw new Error("useEnCare must be used inside EnCareProvider");
  }
  return ctx;
}
