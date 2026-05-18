import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, MobileTopbar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "KayaOS v3",
  description: "AI clinic operating system for Kaya Skin Clinic",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <MobileTopbar />
            <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-screen-2xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
