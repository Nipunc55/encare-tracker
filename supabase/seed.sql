-- =============================================================================
-- Seed Data: Realistic Sri Lankan EnCare Collection Routes
-- Corridor: Kotiyakumbura -> Karawanella -> Yatiyantota -> Kitulgala -> Ginigathhena -> Hatton
-- =============================================================================

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

INSERT INTO public.trips (id, title, district, corridor_towns, scheduled_date, driver_name, driver_phone, vehicle_no, status, is_broadcasting, current_lat, current_lng, stock_small, stock_medium, stock_large)
VALUES
  ('a2222222-2222-4222-8222-222222222201', 'Kegalle → Yatiyantota → Hatton Corridor', 'Kegalle / Nuwara Eliya', ARRAY['Kotiyakumbura', 'Karawanella', 'Yatiyantota', 'Kitulgala', 'Ginigathhena', 'Watawala', 'Hatton'], CURRENT_DATE, 'Kasun Bandara', '+94771122334', 'WP LH-4821', 'active', true, 7.0245, 80.2820, 50, 40, 25)
ON CONFLICT (id) DO NOTHING;

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
