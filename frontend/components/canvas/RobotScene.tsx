"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import Robot from "./Robot";

export default function RobotScene() {
    const [eventSource, setEventSource] = useState<HTMLElement | undefined>(undefined);

    useEffect(() => {
        setEventSource(document.body);
    }, []);

    return (
        <Canvas
            camera={{ position: [0, 1, 6], fov: 45 }}
            shadows
            eventSource={eventSource}
            eventPrefix="client"
            dpr={[1, 2]} // Cap DPR to save resources on high-DPI screens
            gl={{ preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        >
            <Suspense fallback={null}>
                {/* Lighting for Cyberpunk feel */}
                <ambientLight intensity={0.2} />
                <pointLight position={[5, 5, 5]} intensity={1.5} color="#06b6d4" />
                <pointLight position={[-5, 5, -5]} intensity={1.5} color="#a855f7" />
                <spotLight position={[0, 5, 2]} angle={0.5} penumbra={1} intensity={2} castShadow />

                <Robot />

                {/* Floor reflection effect */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
                </mesh>

                <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
            </Suspense>
        </Canvas>
    );
}
