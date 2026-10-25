import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EnCareProvider } from "@/lib/store";
import MobileAppShell from "@/components/MobileAppShell";

export const metadata: Metadata = {
  title: "EnCare Tracker — Sanitary & Clinical Waste Dispatch (Sri Lanka)",
  description:
    "Mobile-first pickup request, live vehicle radar, and driver route dispatch platform for EnCare Sri Lanka.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950">
        <EnCareProvider>
          <MobileAppShell>{children}</MobileAppShell>
        </EnCareProvider>
      </body>
    </html>
  );
}
