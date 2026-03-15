import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "AI Privacy Amanuensis",
  description: "A secure, privacy-first voice to PDF form filler.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-[var(--brand-primary)] selection:text-[var(--brand-bg)] transition-colors duration-300">
        <ThemeProvider>
          <main className="max-w-md mx-auto h-screen relative overflow-hidden bg-[var(--brand-bg)] shadow-2xl flex flex-col transition-colors duration-300">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
