import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PureGlow — Salon Management",
  description: "Sunbed salon management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
