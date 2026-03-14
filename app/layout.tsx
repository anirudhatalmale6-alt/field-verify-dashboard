import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koteshwari Onfield Services — Field Verify",
  description: "Field verification management by Koteshwari Onfield Services Pvt Ltd",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/kospl-logo.jpg", type: "image/jpeg" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/kospl-logo.jpg",
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
