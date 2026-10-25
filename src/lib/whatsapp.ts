import { BagQuantities, Customer, NotificationTemplateType, Trip } from "./types";
import { calculateBagOrderTotalLkr } from "./geo";

/**
 * Normalizes Sri Lankan phone numbers (e.g. 0772345601 or +94772345601) into WhatsApp wa.me format (94772345601)
 */
export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `94${digits.slice(1)}`;
  }
  if (digits.startsWith("94")) {
    return digits;
  }
  return `94${digits}`;
}

/**
 * Builds a $0 Click-to-WhatsApp deep link (`https://wa.me/94...`) with pre-filled bilingual message.
 */
export function buildWhatsAppDeepLink(phone: string, message: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates bilingual (Sinhala + English) automated WhatsApp messages for EnCare operations.
 */
export function generateWhatsAppMessage(params: {
  templateType: NotificationTemplateType;
  customer: Customer;
  trip: Trip;
  stopsAway?: number;
  etaMinutes?: number;
  bagsCollected?: number;
  bagOrder?: BagQuantities;
  amountLkr?: number;
}): { messageBody: string; waDeepLink: string } {
  const {
    templateType,
    customer,
    trip,
    stopsAway = 2,
    etaMinutes = 15,
    bagsCollected = 1,
    bagOrder = { small: 0, medium: 0, large: 0 },
    amountLkr,
  } = params;

  const totalLkr = amountLkr ?? calculateBagOrderTotalLkr(bagOrder);
  let messageBody = "";

  switch (templateType) {
    case "schedule_broadcast":
      messageBody =
        `🌿 *EnCare Sanitary Waste Service*\n` +
        `ආයුබෝවන් ${customer.fullName},\n` +
        `අපගේ රථය (${trip.vehicleNo}) *${trip.scheduledDate}* දින *${customer.town}* ප්‍රදේශයට පැමිණේ.\n` +
        `EnCare vehicle will visit *${customer.town}* on *${trip.scheduledDate}*.\n\n` +
        `✅ Confirm your pickup & bag order (1-Click): https://encare-tracker.vercel.app/customer`;
      break;

    case "eta_approaching":
      messageBody =
        `🚛 *EnCare Live Alert (${customer.town})*\n` +
        `ආයුබෝවන් ${customer.fullName}, EnCare රථය දැන් ඔබගේ නිවසට නැවතුම් *${stopsAway}* ක් පමණක් දුරින් ඇත (විනාඩි ~${etaMinutes} කින් ළඟා වේ).\n` +
        `කරුණාකර ඔබගේ මුද්‍රා තැබූ බෑග් සූදානම් කර තබන්න.\n\n` +
        `EnCare is *${stopsAway} stop(s) away* (~${etaMinutes} mins). Please keep your sealed waste bags ready!\n` +
        `📍 Live Radar: https://encare-tracker.vercel.app/customer`;
      break;

    case "receipt": {
      const bagParts: string[] = [];
      if (bagOrder.small > 0) bagParts.push(`Small x${bagOrder.small}`);
      if (bagOrder.medium > 0) bagParts.push(`Medium x${bagOrder.medium}`);
      if (bagOrder.large > 0) bagParts.push(`Large x${bagOrder.large}`);
      const bagSummary = bagParts.length > 0 ? bagParts.join(", ") : "None";

      messageBody =
        `🧾 *EnCare Collection Receipt*\n` +
        `ස්තූතියි ${customer.fullName}! (${customer.town})\n` +
        `• Waste Bags Collected: *${bagsCollected}*\n` +
        `• New Bags Issued: *${bagSummary}*\n` +
        `• Total Paid: *LKR ${totalLkr.toLocaleString()}/=*\n` +
        `• Collection & Transport Fee: *FREE (LKR 0)*\n\n` +
        `Thank you for keeping Sri Lanka clean & safe! 🌿`;
      break;
    }

    case "missed_stop":
      messageBody =
        `⚠️ *EnCare Missed Pickup Notice*\n` +
        `ආයුබෝවන් ${customer.fullName}, අපගේ රථය *${customer.town}* ඔබගේ නිවස අසලට පැමිණියද දුරකථනය සම්බන්ධ කරගැනීමට නොහැකි විය.\n` +
        `We visited your location in *${customer.town}*, but could not reach you by phone. Tap below to reschedule for the next run:\n` +
        `🔄 https://encare-tracker.vercel.app/customer`;
      break;
  }

  return {
    messageBody,
    waDeepLink: buildWhatsAppDeepLink(customer.phone, messageBody),
  };
}
