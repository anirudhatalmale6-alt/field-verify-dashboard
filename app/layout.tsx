import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldVerify Pro — Verification Dashboard",
  description: "Field verification management dashboard for address verification workflows",
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
