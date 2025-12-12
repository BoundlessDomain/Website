"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Mesh } from "three";

interface FloatingBubbleProps {
    position: [number, number, number];
    label: string;
}

export default function FloatingBubble({ position, label }: FloatingBubbleProps) {
    const meshRef = useRef<Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() + position[0]) * 0.1;
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <sphereGeometry args={[0.4, 32, 32]} />
                <meshStandardMaterial
                    color={hovered ? "hotpink" : "lightblue"}
                    transparent
                    opacity={0.8}
                    roughness={0.1}
                />
            </mesh>
            <Html position={[0, -0.6, 0]} center transform={false} distanceFactor={10}>
                <div className="text-white text-sm font-bold bg-black/50 px-2 py-1 rounded select-none whitespace-nowrap">
                    {label}
                </div>
            </Html>
        </group>
    );
}
