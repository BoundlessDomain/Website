import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import DevTitleHandler from "@/components/ui/DevTitleHandler";
import BackgroundManager from "@/components/themes/BackgroundManager";

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
                    <BackgroundManager />
                    <DevTitleHandler />
                    <TopBar />
                    {children}
                </ThemeProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
