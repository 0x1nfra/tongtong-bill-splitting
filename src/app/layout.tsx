import type { Metadata } from "next";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
