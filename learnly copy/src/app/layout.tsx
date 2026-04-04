import type { Metadata } from "next";
import { brand } from "@/lib/site/brand";
import "./globals.css";

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem("languagehack-theme") || localStorage.getItem("lemma-theme");
      var resolved = saved === "dark" || saved === "light"
        ? saved
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = resolved;
    } catch (error) {
      document.documentElement.dataset.theme = "light";
    }
  })();
`;

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load Manrope async so it never blocks first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          var l=document.createElement('link');l.rel='stylesheet';
          l.href='https://fonts.googleapis.com/css2?family=Manrope:wght@500;600&display=swap';
          document.head.appendChild(l);
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
