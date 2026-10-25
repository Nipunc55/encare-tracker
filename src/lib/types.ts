export type LanguageCode = "si" | "en" | "ta";

export type StopStatus =
  | "pending"
  | "confirmed"
  | "approaching"
  | "completed"
  | "unreachable"
  | "rescheduled";

export type TripStatus = "scheduled" | "active" | "completed";

export type WasteTypeId =
  | "diapers"
  | "catheter"
  | "sanitary"
  | "ppe"
  | "medicines"
  | "cosmetics"
  | "dressings"
  | "sharps_hair";

export interface BagQuantities {
  small: number;  // LKR 310
  medium: number; // LKR 630
  large: number;  // LKR 1,160
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string; // +947XXXXXXXX
  district: string;
  town: string;
  address: string;
  landmarkNotes: string;
  lat: number;
  lng: number;
  preferredLang: LanguageCode;
  createdAt: string;
}

export interface TripStop {
  id: string;
  tripId: string;
  customerId: string;
  sequenceOrder: number;
  status: StopStatus;
  wasteTypes: WasteTypeId[];
  bagsCollected: number;
  bagOrder: BagQuantities;
  amountCollectedLkr: number;
  notes: string;
  etaAlertSent: boolean;
  completedAt?: string;
}

export interface Trip {
  id: string;
  title: string;
  district: string;
  corridorTowns: string[];
  scheduledDate: string;
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  status: TripStatus;
  isBroadcasting: boolean;
  currentLat: number;
  currentLng: number;
  lastGpsAt: string;
  initialStock: BagQuantities;
}

export type NotificationTemplateType =
  | "schedule_broadcast"
  | "eta_approaching"
  | "receipt"
  | "missed_stop";

export interface NotificationLog {
  id: string;
  tripId: string;
  customerId: string;
  customerName: string;
  phone: string;
  templateType: NotificationTemplateType;
  messageBody: string;
  waDeepLink: string;
  deliveryMode: "wa_link" | "cloud_api" | "sms";
  sentAt: string;
}

export interface EnCareAppState {
  customers: Customer[];
  trips: Trip[];
  stops: TripStop[];
  notifications: NotificationLog[];
  activeTripId: string;
  activeCustomerId: string;
}
