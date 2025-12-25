"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import CyberpunkBackground from "./CyberpunkBackground";
import MatrixBackground from "./MatrixBackground";
import SynthwaveBackground from "./SynthwaveBackground";
import SunsetBackground from "./SunsetBackground";
import GlacierBackground from "./GlacierBackground";
import ChristmasBackground from "./ChristmasBackground";
import { ThemeKey } from "@/utils/theme";

export default function BackgroundManager() {
    const { theme } = useTheme();

    const backgrounds: Record<ThemeKey, React.ReactNode> = {
        cyberpunk: <CyberpunkBackground />,
        matrix: <MatrixBackground />,
        synthwave: <SynthwaveBackground />,
        sunset: <SunsetBackground />,
        glacier: <GlacierBackground />,
        christmas: <ChristmasBackground />,
    };

    return (
        <>
            {backgrounds[theme] || null}
        </>
    );
}
