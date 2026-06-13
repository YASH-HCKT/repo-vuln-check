import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VulnLens – AI Security Scanner",
  description:
    "Scan any URL or GitHub repository for security vulnerabilities, misconfigurations, and dependency risks. Powered by OSV.dev.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-white text-[#1f1f1f] flex flex-col">
        {children}
      </body>
    </html>
  );
}
