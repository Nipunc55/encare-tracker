import { Customer, Trip, TripStop, NotificationLog } from "./types";
import { supabase } from "./supabase";

export function customerFromRow(row: any): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    district: row.district,
    town: row.town,
    address: row.address,
    landmarkNotes: row.landmark_notes || "",
    lat: Number(row.lat),
    lng: Number(row.lng),
    preferredLang: row.preferred_lang || "si",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function customerToRow(c: Partial<Customer>) {
  const row: Record<string, any> = {};
  if (c.id) row.id = c.id;
  if (c.fullName !== undefined) row.full_name = c.fullName;
  if (c.phone !== undefined) row.phone = c.phone;
  if (c.district !== undefined) row.district = c.district;
  if (c.town !== undefined) row.town = c.town;
  if (c.address !== undefined) row.address = c.address;
  if (c.landmarkNotes !== undefined) row.landmark_notes = c.landmarkNotes;
  if (c.lat !== undefined) row.lat = c.lat;
  if (c.lng !== undefined) row.lng = c.lng;
  if (c.preferredLang !== undefined) row.preferred_lang = c.preferredLang;
  return row;
}

export function tripFromRow(row: any): Trip {
  return {
    id: row.id,
    title: row.title,
    district: row.district,
    corridorTowns: row.corridor_towns || [],
    scheduledDate: row.scheduled_date,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    vehicleNo: row.vehicle_no,
    status: row.status,
    isBroadcasting: Boolean(row.is_broadcasting),
    currentLat: Number(row.current_lat),
    currentLng: Number(row.current_lng),
    lastGpsAt: row.last_gps_at || new Date().toISOString(),
    initialStock: {
      small: row.stock_small ?? 50,
      medium: row.stock_medium ?? 40,
      large: row.stock_large ?? 25,
    },
  };
}

export function tripToRow(t: Partial<Trip>) {
  const row: Record<string, any> = {};
  if (t.id) row.id = t.id;
  if (t.title !== undefined) row.title = t.title;
  if (t.district !== undefined) row.district = t.district;
  if (t.corridorTowns !== undefined) row.corridor_towns = t.corridorTowns;
  if (t.scheduledDate !== undefined) row.scheduled_date = t.scheduledDate;
  if (t.driverName !== undefined) row.driver_name = t.driverName;
  if (t.driverPhone !== undefined) row.driver_phone = t.driverPhone;
  if (t.vehicleNo !== undefined) row.vehicle_no = t.vehicleNo;
  if (t.status !== undefined) row.status = t.status;
  if (t.isBroadcasting !== undefined) row.is_broadcasting = t.isBroadcasting;
  if (t.currentLat !== undefined) row.current_lat = t.currentLat;
  if (t.currentLng !== undefined) row.current_lng = t.currentLng;
  if (t.lastGpsAt !== undefined) row.last_gps_at = t.lastGpsAt;
  if (t.initialStock) {
    row.stock_small = t.initialStock.small;
    row.stock_medium = t.initialStock.medium;
    row.stock_large = t.initialStock.large;
  }
  return row;
}

export function stopFromRow(row: any): TripStop {
  return {
    id: row.id,
    tripId: row.trip_id,
    customerId: row.customer_id,
    sequenceOrder: row.sequence_order,
    status: row.status,
    wasteTypes: row.waste_types || [],
    bagsCollected: row.bags_collected || 0,
    bagOrder: {
      small: row.order_small || 0,
      medium: row.order_medium || 0,
      large: row.order_large || 0,
    },
    amountCollectedLkr: row.amount_collected_lkr || 0,
    notes: row.notes || "",
    etaAlertSent: Boolean(row.eta_alert_sent),
    completedAt: row.completed_at || undefined,
  };
}

export function stopToRow(s: Partial<TripStop>) {
  const row: Record<string, any> = {};
  if (s.id) row.id = s.id;
  if (s.tripId !== undefined) row.trip_id = s.tripId;
  if (s.customerId !== undefined) row.customer_id = s.customerId;
  if (s.sequenceOrder !== undefined) row.sequence_order = s.sequenceOrder;
  if (s.status !== undefined) row.status = s.status;
  if (s.wasteTypes !== undefined) row.waste_types = s.wasteTypes;
  if (s.bagsCollected !== undefined) row.bags_collected = s.bagsCollected;
  if (s.bagOrder) {
    row.order_small = s.bagOrder.small;
    row.order_medium = s.bagOrder.medium;
    row.order_large = s.bagOrder.large;
  }
  if (s.amountCollectedLkr !== undefined)
    row.amount_collected_lkr = s.amountCollectedLkr;
  if (s.notes !== undefined) row.notes = s.notes;
  if (s.etaAlertSent !== undefined) row.eta_alert_sent = s.etaAlertSent;
  if (s.completedAt !== undefined) row.completed_at = s.completedAt;
  return row;
}
