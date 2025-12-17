import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import DebugOverlay from "@/components/ui/DebugOverlay";

export const metadata: Metadata = {
    title: "BobbyYu Website",
    description: "Personal website of BobbyYu",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased font-sans">
                <ThemeProvider>
                    <TopBar />
                    <DebugOverlay />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
