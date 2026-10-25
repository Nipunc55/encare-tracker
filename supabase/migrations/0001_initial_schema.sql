-- =============================================================================
-- EnCare Tracker & Dispatch Platform (Sri Lanka)
-- Supabase Free Tier Optimized PostgreSQL + PostGIS Schema
-- =============================================================================

-- Enable PostGIS for spatial distance queries & geofencing
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Customers Table (Verified Phone + Permanent GPS Pin)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,            -- Format: +947XXXXXXXX
  district TEXT NOT NULL,                -- e.g., Kegalle, Nuwara Eliya, Ratnapura, Matara
  town TEXT NOT NULL,                    -- e.g., Yatiyantota, Kitulgala, Hatton, Kotiyakumbura
  address TEXT NOT NULL,
  landmark_notes TEXT DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED,
  preferred_lang TEXT NOT NULL DEFAULT 'si' CHECK (preferred_lang IN ('si', 'en', 'ta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_location ON public.customers USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_customers_district ON public.customers (district);

-- 2. Collection Trips Table (Area Schedules & Active Truck State)
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                   -- e.g., "Kegalle - Hatton Corridor Run"
  district TEXT NOT NULL,
  corridor_towns TEXT[] NOT NULL DEFAULT '{}',
  scheduled_date DATE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,              -- e.g., "WP LH-4821"
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed')),
  is_broadcasting BOOLEAN NOT NULL DEFAULT false,
  current_lat DOUBLE PRECISION NOT NULL,
  current_lng DOUBLE PRECISION NOT NULL,
  last_gps_at TIMESTAMPTZ DEFAULT now(),
  -- Bag Inventory Loaded onto Truck
  stock_small INT NOT NULL DEFAULT 60,   -- LKR 310/=
  stock_medium INT NOT NULL DEFAULT 45,  -- LKR 630/=
  stock_large INT NOT NULL DEFAULT 30,   -- LKR 1,160/=
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Trip Stops Table (Ordered Customer Pickups + Bag POS + Outcomes)
CREATE TABLE IF NOT EXISTS public.trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sequence_order INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'approaching', 'completed', 'unreachable', 'rescheduled')
  ),
  waste_types TEXT[] NOT NULL DEFAULT '{}',
  bags_collected INT NOT NULL DEFAULT 0,
  -- Replenishment Bags Requested / Sold
  order_small INT NOT NULL DEFAULT 0,
  order_medium INT NOT NULL DEFAULT 0,
  order_large INT NOT NULL DEFAULT 0,
  amount_collected_lkr INT NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  eta_alert_sent BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_seq ON public.trip_stops (trip_id, sequence_order);

-- 4. Notification Audit Logs (WhatsApp / SMS Alerts)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (
    template_type IN ('schedule_broadcast', 'eta_approaching', 'receipt', 'missed_stop')
  ),
  message_body TEXT NOT NULL,
  wa_deep_link TEXT NOT NULL,
  delivery_mode TEXT NOT NULL DEFAULT 'wa_link' CHECK (delivery_mode IN ('wa_link', 'cloud_api', 'sms')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Row Level Security (Permissive for Non-Profit MVP / Public Anon Key with App Auth)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for MVP" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for MVP" ON public.trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for MVP" ON public.trip_stops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for MVP" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);
