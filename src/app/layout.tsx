import type { Metadata } from "next";
import { JetBrains_Mono, Bungee, Shadows_Into_Light_Two } from "next/font/google";
import localFont from "next/font/local";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const departureMono = localFont({
  src: "../../public/fonts/DepartureMono-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display",
});

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
    <ConvexAuthNextjsServerProvider>
      <html lang="en-MY" suppressHydrationWarning className={`${departureMono.variable} ${jetBrainsMono.variable} ${bungee.variable} ${shadowsIntoLightTwo.variable} h-full`}>
        <body className="min-h-full flex flex-col">
          <svg id="filters" aria-hidden="true">
            <defs>
              <filter id="ink-bleed">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
          <ThemeProvider>
            <nav aria-label="Site navigation">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10001] focus:px-4 focus:py-2 focus:bg-pen focus:text-white focus:text-sm focus:uppercase focus:tracking-widest"
              >
                Skip to content
              </a>
            </nav>
            <ThemeToggle />
            <ConvexClientProvider>{children}</ConvexClientProvider>
            <footer className="py-4 text-center">
              <p
                className="text-[0.625rem] uppercase tracking-widest text-ink-muted"
                style={{ fontFamily: "var(--font-display)" }}
              >
                POWERED BY VESSL TECH
              </p>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
