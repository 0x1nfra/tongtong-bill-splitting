import type { Metadata } from "next";
import { JetBrains_Mono, Bungee, Shadows_Into_Light_Two } from "next/font/google";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const bungee = Bungee({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-stamp",
});

const shadowsIntoLightTwo = Shadows_Into_Light_Two({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-handwriting",
});

export const metadata: Metadata = {
  title: "TongTong — Kongsi Tak Susah",
  description: "Split bills with friends. No more eh you transfer ah? drama.",
  openGraph: {
    title: "TongTong — Kongsi Tak Susah",
    description: "Split bills with friends. No more eh you transfer ah? drama.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetBrainsMono.variable} ${bungee.variable} ${shadowsIntoLightTwo.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <svg id="filters" aria-hidden="true">
          <defs>
            <filter id="ink-bleed">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
