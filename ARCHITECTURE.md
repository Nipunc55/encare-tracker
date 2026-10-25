# EnCare Tracker & Dispatch Platform — Architecture & System Specification

## 1. Executive Summary & Domain Context

**EnCare** is a door-to-door sanitary, personal care, and domestic clinical waste disposal service operating in Sri Lanka. 

### 1.1 Waste Types Handled
- Baby & Adult Diapers
- Urinary Catheter Bags
- Sanitary Napkins
- PPE (Face Masks, Gloves)
- Expired / Discarded Household Medicines
- Cosmetics & Personal Hygiene Waste
- Wound Dressings / Bandages
- Shaving Razors, Hair & Nail Clippings

### 1.2 Existing Commercial Model
- **Registration Fee:** None (Free)
- **Collection / Transport Fee:** None (Free)
- **Monetization:** Per-bag purchase model upon bag replenishment:
  - **Small Bag:** LKR 310/=
  - **Medium Bag:** LKR 630/=
  - **Large Bag:** LKR 1,160/=

---

## 2. Analysis of the Current WhatsApp Operations

```
Current Flow:
[EnCare Broadcasts Area Schedule]
               │
               ▼
[Customers Reply "Need service" / Inquire about dates in group]
               │
               ▼
[Driver Travels Route & Admin manually types location ("Now in Hatton...")]
               │
               ▼
[Driver manually calls each customer, asks for directions / live pins]
               │
               ▼
[Customers repeatedly call driver while driving / group flooded with ETA questions]
               │
               ▼
[Bags collected, new bags sold for cash, manual updates in chat]
```

### Key Operational Pain Points Discovered
1. **Manual WhatsApp Broadcasting:** Admins post intermittent location updates (`Our vehicle is in - Yatiyanthota Area`), leading to customer anxiety and flood of "Did it pass my house?" messages.
2. **Driver Distraction & Safety Risk:** Customers call the driver repeatedly while he is driving on mountainous or narrow roads to ask for ETAs.
3. **Loss of Service Requests:** Single-message requests (`Matath one`, `Kotiyakumbura enne kawadda`) get buried in group chats, resulting in skipped stops.
4. **Inefficient Routing:** Drivers have to call each customer individually to request live WhatsApp location pins, decipher directions, and manually plan who to visit next.
5. **Customer Unreachability:** Drivers arrive in an area only to find customer phones switched off or unreachable, with no advance notice or reschedule workflow.

---

## 3. Proposed Online Platform Architecture (`EnCare Tracker`)

The objective is to replace the manual WhatsApp coordination with an automated, GPS-enabled Dispatch, Request, and Live Tracking platform.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EnCare Digital Platform                         │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│   Customer Portal   │    Driver Mobile App     │    Admin Dashboard    │
│       (PWA/Web)     │         (PWA)            │       (Web App)       │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ • 1-Click Request   │ • Turn-by-Turn Route     │ • Route Builder & ETA │
│ • Live GPS Tracking │ • GPS Beacon Broadcast   │ • Request Dispatcher  │
│ • Bag Ordering      │ • 1-Tap Customer Alerts  │ • Driver Oversight    │
│ • WhatsApp Alerts   │ • Status: Done/Skip/Fail │ • Bag Inventory & POS │
└──────────┬──────────┴────────────┬─────────────┴───────────┬───────────┘
           │                       │                         │
           └───────────────────────┼─────────────────────────┘
                                   │
                    ┌──────────────▼─────────────┐
                    │      Backend Engine        │
                    │  (Next.js / Node / PostGIS)│
                    └──────────────┬─────────────┘
                                   │
           ┌───────────────────────┼─────────────────────────┐
           ▼                       ▼                         ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  PostgreSQL/PostGIS │ │  Supabase Realtime  │ │ WhatsApp Cloud API  │
│  (Data & Geo-Fence) │ │ (Live GPS Streaming)│ │ (Automated Triggers)│
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

## 4. Core System Modules & Features

### 4.1 Customer Web App / PWA
- **Profile & Location Pin:** Customer registers once with phone number (OTP), home address, and an exact Google Maps GPS pin.
- **Trip Notifications:** When a trip is scheduled for their district (e.g. Kegalle / Matara), the customer receives an automated WhatsApp/SMS prompt:
  > *"EnCare vehicle will be in your area on Friday. Confirm your pickup here: [1-Click Link]"*
- **Live Vehicle Radar (Uber-like):**
  - Displays vehicle distance, remaining stops before their home, and estimated arrival time (ETA).
  - Obfuscates driver location until the vehicle enters the active operational zone (privacy).
- **Bag Re-ordering:** Select small, medium, or large bags needed on arrival.

### 4.2 Driver Field App (Mobile PWA)
- **Optimized Stop Sequence:** Shows the day's route sorted by optimal path (via routing engine) with one-click navigation launch (Google Maps / Waze).
- **Background GPS Beacon:** Broadcasts vehicle coordinates to the backend while on active duty.
- **Automated "Next Stop" Alert:** When driver marks a stop as *Complete*, the system automatically sends a WhatsApp/SMS alert to the next 2-3 customers:
  > *"EnCare is 2 stops away (~15 minutes). Please keep your sealed bags ready."*
- **Stop Outcome Handler:**
  - `Completed`: Record number of bags collected & bags sold.
  - `Unreachable / Rescheduled`: Logs note without blocking the driver.

### 4.3 Admin / Dispatcher Dashboard
- **Trip & Route Planner:** Group pending customer requests geographically into a trip for a specific date.
- **Live Fleet Monitor:** Real-time map view of active trucks, completed stops, pending stops, and delayed visits.
- **Inventory & Revenue Tracker:** Track bag stock in each vehicle and match cash collections against bags sold.

---

## 5. Recommended Technology Stack

| Component | Recommended Technology | Why Chosen |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (React 19)** + TypeScript | Full-stack simplicity, fast SSR, zero deployment friction on Vercel. |
| **Styling & UI** | **Tailwind CSS + Shadcn UI** + Lucide Icons | Clean, accessible, modern mobile-first UI for customers and drivers. |
| **Database & Auth** | **Supabase (PostgreSQL + PostGIS)** | Native geospatial support (`ST_Distance`, `ST_DWithin`), built-in Phone OTP auth, and zero-infra overhead. |
| **Realtime Tracking** | **Supabase Realtime / WebSockets** | Low-latency vehicle GPS coordinate streaming to customer tracking maps. |
| **Maps & Routing** | **Leaflet / Mapbox GL + OSRM / Google Maps API** | Accurate street routing, distance calculation, and interactive map displays. |
| **Notifications** | **WhatsApp Business Cloud API** / Notify.lk | Automated WhatsApp messages (templates for reminders, 15-min ETA alerts, receipts). |

---

## 6. Phased Implementation Roadmap

### Phase 1: MVP — Request & Schedule Hub
1. Customer registration with GPS location pin.
2. Admin schedule creator (Dates & Target areas).
3. Customer pickup confirmation screen.
4. Driver stop list with Google Maps navigation buttons.

### Phase 2: Live Tracking & Automated WhatsApp Alerts
1. Driver GPS streaming toggle.
2. Customer real-time tracking page (Vehicle on map + ETA + stops remaining).
3. Automated WhatsApp notifications (Trip announcement, 15-minute advance notice, completion receipt).

### Phase 3: Bag Inventory & Operational Analytics
1. Driver bag inventory checkout and cash reconciliation.
2. Route density & frequency heatmaps (identifying areas requiring more frequent runs, e.g. Embilipitiya vs. Yatiyantota).

---

## 7. Implemented Project Structure & Free-Tier Architecture (`$0/month` Non-Profit Mode)

The application is implemented as a mobile-first **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Leaflet** Progressive Web App optimized for **Vercel/Netlify Free Tier** and **Supabase Free Tier**:

### 7.1 Key Directories & Modules
- **[`supabase/migrations/0001_initial_schema.sql`](file:///d:/My%20Side%20Projects/encare-tracker/supabase/migrations/0001_initial_schema.sql)**: PostgreSQL + PostGIS schema (`customers`, `trips`, `trip_stops`, `notification_logs`) with spatial `GIST` indexes and RLS policies.
- **[`supabase/seed.sql`](file:///d:/My%20Side%20Projects/encare-tracker/supabase/seed.sql)**: Pre-seeded Sri Lankan corridor data (*Kotiyakumbura → Karawanella → Yatiyantota → Kitulgala → Ginigathhena → Watawala → Hatton*).
- **[`src/lib/store.tsx`](file:///d:/My%20Side%20Projects/encare-tracker/src/lib/store.tsx)**: Dual-mode reactive state provider (`EnCareProvider`) supporting cross-tab `BroadcastChannel` + `localStorage` sync and throttled Supabase Realtime ephemeral `broadcast` channels (`encare-live-gps`) with built-in GPS truck simulation.
- **[`src/lib/geo.ts`](file:///d:/My%20Side%20Projects/encare-tracker/src/lib/geo.ts)**: Haversine distance, Sri Lankan hill-country road ETA estimator (`1.35x` road winding factor), Nearest-Neighbor stop sequence optimizer, and Google Maps / Waze mobile deep links.
- **[`src/lib/whatsapp.ts`](file:///d:/My%20Side%20Projects/encare-tracker/src/lib/whatsapp.ts)**: Bilingual (Sinhala + English) message generator and `$0` Click-to-WhatsApp (`https://wa.me/94...`) deep-link builder.
- **[`src/components/map/LiveTrackingMap.tsx`](file:///d:/My%20Side%20Projects/encare-tracker/src/components/map/LiveTrackingMap.tsx)** & **[`LocationPinPicker.tsx`](file:///d:/My%20Side%20Projects/encare-tracker/src/components/map/LocationPinPicker.tsx)**: Zero-cost OpenStreetMap + Leaflet interactive maps with privacy geofencing.
- **[`src/app/customer/page.tsx`](file:///d:/My%20Side%20Projects/encare-tracker/src/app/customer/page.tsx)** & **[`register/page.tsx`](file:///d:/My%20Side%20Projects/encare-tracker/src/app/customer/register/page.tsx)**: Customer Mobile Portal (Uber-like live radar, 1-click waste pickup confirmation, bio-safe bag ordering at `LKR 310 / 630 / 1,160`, and permanent GPS pin registration).
- **[`src/app/driver/page.tsx`](file:///d:/My%20Side%20Projects/encare-tracker/src/app/driver/page.tsx)**: Driver Field PWA (oversized mobile controls, 1-tap Google Maps/Waze launch, bag POS calculator, unreachable stop handler, and automatic "Next 2 Stops" WhatsApp alert generator).
- **[`src/app/admin/page.tsx`](file:///d:/My%20Side%20Projects/encare-tracker/src/app/admin/page.tsx)**: Admin & Dispatch Hub (live fleet monitor, 1-click route optimizer, vehicle bag stock & LKR cash reconciliation, corridor schedule creator, and WhatsApp notification audit log).
- **[`src/app/api/keep-alive/route.ts`](file:///d:/My%20Side%20Projects/encare-tracker/src/app/api/keep-alive/route.ts)** & **[`vercel.json`](file:///d:/My%20Side%20Projects/encare-tracker/vercel.json)**: Scheduled every 5 days to prevent Supabase Free Tier database pausing.
