import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koteshwari Onfield Services — Field Verify",
  description: "Field verification management by Koteshwari Onfield Services Pvt Ltd",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
