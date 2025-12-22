"use client";

import { useTheme } from "@/context/ThemeContext";
import CyberpunkBackground from "./CyberpunkBackground";
import MatrixBackground from "./MatrixBackground";
import SynthwaveBackground from "./SynthwaveBackground";
import SunsetBackground from "./SunsetBackground";
import GlacierBackground from "./GlacierBackground";
import { ThemeKey } from "@/utils/theme";

export default function BackgroundManager() {
    const { theme } = useTheme();

    const backgrounds: Record<ThemeKey, React.ReactNode> = {
        cyberpunk: <CyberpunkBackground />,
        matrix: <MatrixBackground />,
        synthwave: <SynthwaveBackground />,
        sunset: <SunsetBackground />,
        glacier: <GlacierBackground />,
    };

    return (
        <>
            {backgrounds[theme] || null}
        </>
    );
}
