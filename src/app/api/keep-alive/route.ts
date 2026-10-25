import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/**
 * GET /api/keep-alive
 * Triggered automatically every 5 days by Vercel Cron (vercel.json)
 * to prevent the Supabase Free Tier PostgreSQL database from pausing after 7 days of inactivity.
 */
export async function GET() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      ok: true,
      mode: "local_demo",
      message:
        "Supabase env vars not set yet; running in zero-cost local demo mode.",
      timestamp: new Date().toISOString(),
    });
  }

  const { count, error } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    mode: "supabase_free_tier",
    tripsCount: count ?? 0,
    timestamp: new Date().toISOString(),
  });
}
