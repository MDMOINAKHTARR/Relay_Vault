import type { Metadata } from "next";
import { ToastProvider } from "@/components/ToastProvider";
import { Web3Provider } from "@/components/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RelayVault — Programmable Agent Economy Infrastructure",
  description: "The financial layer for autonomous AI agent economies. Programmable wallets, trustless escrow, and on-chain negotiation — built on Monad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Web3Provider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
