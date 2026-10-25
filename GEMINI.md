# EnCare Tracker Project Guide

## Overview
EnCare Tracker is an online platform and dispatch management system for EnCare, a clinical and sanitary waste collection service in Sri Lanka.

## Architecture & System Documentation
- **[ARCHITECTURE.md](file:///d:/My%20Side%20Projects/encare-tracker/ARCHITECTURE.md)**: Contains the full domain context, analysis of the manual WhatsApp workflow, pain points, proposed online platform architecture, system modules, tech stack, implementation roadmap, and implemented codebase file map.

## Key Implemented Entry Points
- **Customer Portal (`/customer` & `/customer/register`)**: [src/app/customer/page.tsx](file:///d:/My%20Side%20Projects/encare-tracker/src/app/customer/page.tsx), [src/app/customer/register/page.tsx](file:///d:/My%20Side%20Projects/encare-tracker/src/app/customer/register/page.tsx)
- **Driver Field App (`/driver`)**: [src/app/driver/page.tsx](file:///d:/My%20Side%20Projects/encare-tracker/src/app/driver/page.tsx)
- **Admin Dispatcher Dashboard (`/admin`)**: [src/app/admin/page.tsx](file:///d:/My%20Side%20Projects/encare-tracker/src/app/admin/page.tsx)
- **State, Geospatial & WhatsApp Core**: [src/lib/store.tsx](file:///d:/My%20Side%20Projects/encare-tracker/src/lib/store.tsx), [src/lib/geo.ts](file:///d:/My%20Side%20Projects/encare-tracker/src/lib/geo.ts), [src/lib/whatsapp.ts](file:///d:/My%20Side%20Projects/encare-tracker/src/lib/whatsapp.ts)
- **Supabase PostGIS Schema & Keep-Alive**: [supabase/migrations/0001_initial_schema.sql](file:///d:/My%20Side%20Projects/encare-tracker/supabase/migrations/0001_initial_schema.sql), [src/app/api/keep-alive/route.ts](file:///d:/My%20Side%20Projects/encare-tracker/src/app/api/keep-alive/route.ts)
