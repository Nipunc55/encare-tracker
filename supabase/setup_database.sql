-- =============================================================================
-- EnCare Tracker & Dispatch Platform (Sri Lanka)
-- Combined Database Setup & Seed Script (Run once in Supabase SQL Editor)
-- =============================================================================

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  district TEXT NOT NULL,
  town TEXT NOT NULL,
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

-- 3. Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  district TEXT NOT NULL,
  corridor_towns TEXT[] NOT NULL DEFAULT '{}',
  scheduled_date DATE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed')),
  is_broadcasting BOOLEAN NOT NULL DEFAULT false,
  current_lat DOUBLE PRECISION NOT NULL,
  current_lng DOUBLE PRECISION NOT NULL,
  last_gps_at TIMESTAMPTZ DEFAULT now(),
  stock_small INT NOT NULL DEFAULT 60,
  stock_medium INT NOT NULL DEFAULT 45,
  stock_large INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Trip Stops Table
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

-- 5. Notification Logs Table
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

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write for MVP" ON public.customers;
CREATE POLICY "Allow public read/write for MVP" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write for MVP" ON public.trips;
CREATE POLICY "Allow public read/write for MVP" ON public.trips FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write for MVP" ON public.trip_stops;
CREATE POLICY "Allow public read/write for MVP" ON public.trip_stops FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write for MVP" ON public.notification_logs;
CREATE POLICY "Allow public read/write for MVP" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. Seed Initial Customers
INSERT INTO public.customers (id, full_name, phone, district, town, address, landmark_notes, lat, lng, preferred_lang)
VALUES
  ('c1111111-1111-4111-8111-111111111101', 'Nadeesha Perera', '+94772345601', 'Kegalle', 'Kotiyakumbura', 'No. 42, Avissawella Rd, Kotiyakumbura', 'Near Cooperative Filling Station, green gate', 7.0435, 80.2812, 'si'),
  ('c1111111-1111-4111-8111-111111111102', 'Ruwanpathirana Pharmacy & Home Care', '+94714589202', 'Kegalle', 'Karawanella', '18/A Kelani Valley Road, Karawanella', 'Opposite People''s Bank branch', 7.0189, 80.2641, 'si'),
  ('c1111111-1111-4111-8111-111111111103', 'Kumari Wickramasinghe', '+94768912303', 'Kegalle', 'Yatiyantota', 'No. 114, Colombo-Hatton Main Rd, Yatiyantota', '100m past Yatiyantota Bridge, white 2-story house', 7.0294, 80.2956, 'si'),
  ('c1111111-1111-4111-8111-111111111104', 'Mrs. S. Chandralatha', '+94779104404', 'Kegalle', 'Kitulgala', '27 Temple Lane, Kitulgala', 'Turn left at Rafting Center signboard', 6.9892, 80.4178, 'si'),
  ('c1111111-1111-4111-8111-111111111105', 'Dilantha Rajapakse', '+94713320905', 'Nuwara Eliya', 'Ginigathhena', 'No. 8, Ambagamuwa Rd, Ginigathhena', 'Next to Ginigathhena Police Station', 6.9875, 80.4932, 'en'),
  ('c1111111-1111-4111-8111-111111111106', 'Selvi Thangarajah', '+94756018806', 'Nuwara Eliya', 'Watawala', 'Rosella Estate Bungalow Rd, Watawala', 'Near Watawala Railway Station', 6.9511, 80.5378, 'ta'),
  ('c1111111-1111-4111-8111-111111111107', 'Dr. Ashan Jayawardena (Elderly Care)', '+94778823107', 'Nuwara Eliya', 'Hatton', 'No. 65, Dunbar Road, Hatton', 'Beside Hatton National Bank main branch', 6.8916, 80.5955, 'en')
ON CONFLICT (phone) DO NOTHING;

-- 8. Seed Initial Active Trip
INSERT INTO public.trips (id, title, district, corridor_towns, scheduled_date, driver_name, driver_phone, vehicle_no, status, is_broadcasting, current_lat, current_lng, stock_small, stock_medium, stock_large)
VALUES
  ('a2222222-2222-4222-8222-222222222201', 'Kegalle → Yatiyantota → Hatton Corridor', 'Kegalle / Nuwara Eliya', ARRAY['Kotiyakumbura', 'Karawanella', 'Yatiyantota', 'Kitulgala', 'Ginigathhena', 'Watawala', 'Hatton'], CURRENT_DATE, 'Kasun Bandara', '+94771122334', 'WP LH-4821', 'active', true, 7.0245, 80.2820, 50, 40, 25)
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Trip Stops
INSERT INTO public.trip_stops (trip_id, customer_id, sequence_order, status, waste_types, bags_collected, order_small, order_medium, order_large, amount_collected_lkr, notes)
VALUES
  ('a2222222-2222-4222-8222-222222222201', 'c1111111-1111-4111-8111-111111111101', 1, 'completed', ARRAY['diapers', 'sanitary'], 2, 2, 1, 0, 1250, 'Collected 2 sealed bags. Paid cash.'),
  ('a2222222-2222-4222-8222-222222222201', 'c1111111-1111-4111-8111-111111111102', 2, 'completed', ARRAY['diapers', 'catheter', 'dressings'], 3, 0, 2, 1, 2420, 'Elderly care home pickup complete.'),
  ('a2222222-2222-4222-8222-222222222201', 'c1111111-1111-4111-8111-111111111103', 3, 'approaching', ARRAY['diapers', 'sanitary', 'medicines'], 0, 1, 1, 0, 0, 'Please honk twice at the white gate.'),
  ('a2222222-2222-4222-8222-222222222201', 'c1111111-1111-4111-8111-111111111104', 4, 'confirmed', ARRAY['diapers', 'ppe'], 0, 2, 0, 0, 0, 'Keep bags at front porch if raining.'),
  ('a2222222-2222-4222-8222-222222222201', 'c1111111-1111-4111-8111-111111111105', 5, 'confirmed', ARRAY['catheter', 'dressings', 'medicines'], 0, 0, 1, 1, 0, ''),
  ('a2222222-2222-4222-8222-222222222201', 'c1111111-1111-4111-8111-111111111106', 6, 'pending', ARRAY['diapers', 'sanitary'], 0, 1, 0, 0, 0, ''),
  ('a2222222-2222-4222-8222-222222222201', 'c1111111-1111-4111-8111-111111111107', 7, 'confirmed', ARRAY['diapers', 'catheter', 'dressings', 'sharps_hair'], 0, 2, 2, 2, 0, 'Clinic back entrance on Dunbar Rd.')
ON CONFLICT (trip_id, customer_id) DO NOTHING;
