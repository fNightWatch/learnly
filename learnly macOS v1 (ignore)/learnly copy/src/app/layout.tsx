import type { Metadata } from "next";
import { brand } from "@/lib/site/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: brand.descriptor ? `${brand.name} | ${brand.descriptor}` : brand.name,
  description: brand.metadataDescription
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
