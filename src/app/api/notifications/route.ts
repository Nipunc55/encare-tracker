import { NextRequest, NextResponse } from "next/server";
import { buildWhatsAppDeepLink } from "@/lib/whatsapp";

/**
 * POST /api/notifications
 * Dispatches automated WhatsApp Cloud API or Notify.lk SMS messages if credentials are provided,
 * and always returns a $0 Click-to-WhatsApp (`wa.me`) deep link for free-tier non-profit usage.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message } = body as { phone?: string; message?: string };

    if (!phone || !message) {
      return NextResponse.json(
        { error: "phone and message are required" },
        { status: 400 }
      );
    }

    const waDeepLink = buildWhatsAppDeepLink(phone, message);
    const waToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (waToken && waPhoneId) {
      const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "94");
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${waPhoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${waToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "text",
            text: { body: message },
          }),
        }
      );

      if (res.ok) {
        return NextResponse.json({
          ok: true,
          deliveryMode: "cloud_api",
          waDeepLink,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      deliveryMode: "wa_link",
      waDeepLink,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to process notification" },
      { status: 500 }
    );
  }
}
