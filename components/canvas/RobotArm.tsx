"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

export default function RobotArm() {
    const armRef = useRef<Mesh>(null);

    useFrame((state) => {
        if (armRef.current) {
            armRef.current.rotation.y = Math.sin(state.clock.getElapsedTime()) * 0.5;
        }
    });

    return (
        <group position={[0, -1, 0]}>
            {/* Base */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            {/* Arm */}
            <mesh ref={armRef} position={[0, 1, 0]}>
                <boxGeometry args={[0.2, 2, 0.2]} />
                <meshStandardMaterial color="orange" />
            </mesh>
        </group>
    );
}
