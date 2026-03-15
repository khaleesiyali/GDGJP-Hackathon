import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-black text-yellow-400 min-h-screen antialiased selection:bg-yellow-400 selection:text-black">
        <main className="max-w-md mx-auto h-screen relative overflow-hidden bg-black shadow-2xl flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
