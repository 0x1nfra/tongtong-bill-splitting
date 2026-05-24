import type { Metadata } from "next";
import { Shadows_Into_Light_Two } from "next/font/google";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

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
    <html lang="en" className={`${shadowsIntoLightTwo.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
