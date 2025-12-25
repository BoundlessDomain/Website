"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import Robot from "./Robot";

// Add props interface
interface RobotSceneProps {
    layoutMode: 'mobile' | 'narrow' | 'wide';
    theme: string;
}

export default function RobotScene({ layoutMode, theme }: RobotSceneProps) {
    const [eventSource, setEventSource] = useState<HTMLElement | undefined>(undefined);

    useEffect(() => {
        setEventSource(document.body);
    }, []);

    // Determine Camera & Robot positions based on Layout Mode
    let cameraPos: [number, number, number] = [0, 1, 6];
    let robotPos: [number, number, number] = [0, 0, 0]; // Default center (Robot internal offset handles Y)

    if (layoutMode === 'narrow') {
        robotPos = [2.5, 0, 0]; // Shift Right (reduced from 3.5 to keep it safe)
        cameraPos = [0, 1, 6];
    } else if (layoutMode === 'mobile') {
        robotPos = [0, -1.5, 0]; // Shift Down slightly (internal -2.5 + -1.5 = -4.0 total)
        cameraPos = [0, 1, 7]; // Zoom out a bit for mobile
    }

    return (
        <Canvas
            camera={{ position: cameraPos, fov: 45 }}
            shadows
            eventSource={eventSource}
            eventPrefix="client"
            dpr={[1, 2]} // Cap DPR
            gl={{ preserveDrawingBuffer: true, powerPreference: "high-performance", alpha: true }}
        >
            <Suspense fallback={null}>
                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[5, 5, 5]} intensity={1.5} color="#06b6d4" />
                <pointLight position={[-5, 5, -5]} intensity={1.5} color="#a855f7" />
                <spotLight
                    position={[0, 5, 2]}
                    angle={0.5}
                    penumbra={1}
                    intensity={2}
                    castShadow
                    shadow-mapSize={[512, 512]}
                />

                {/* Robot with Layout-based Position */}
                <group position={robotPos}>
                    <Robot layoutMode={layoutMode} theme={theme} />
                </group>

                {/* Contact Shadows instead of Mesh Floor */}
                <ContactShadows
                    position={[0, -2.5, 0]} // Keep shadows at floor level relative to world
                    opacity={0.4}
                    scale={10}
                    blur={1.5}
                    far={4.0}
                />

                <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
            </Suspense>
        </Canvas>
    );
}
