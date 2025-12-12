"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Group, Vector3 } from "three";

export default function Robot() {
    const headRef = useRef<Group>(null);
    const leftArmRef = useRef<Group>(null);
    const rightArmRef = useRef<Group>(null);

    // Helper vector for calculations
    const vec = new Vector3();

    const { viewport } = useThree();

    useFrame((state) => {
        const mouseX = state.mouse.x; // -1 to 1
        const mouseY = state.mouse.y; // -1 to 1

        // Convert normalized mouse to world coordinates (approximate at z=0)
        // Camera is at z=6, looking at z=0. 
        // We can project standard mouse coordinates to world units.
        const worldX = (mouseX * viewport.width) / 2;
        const worldY = (mouseY * viewport.height) / 2;

        // --- HEAD TRACKING ---
        // Always looks at cursor
        if (headRef.current) {
            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, mouseX * 0.6, 0.1);
            headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -mouseY * 0.5, 0.1);
        }

        // --- LEFT ARM TRACKING ---
        if (leftArmRef.current) {
            if (mouseX < -0.1) {
                // Calculator vector from shoulder to mouse
                // Left Shoulder Pos approx: [-0.9, 2.2]
                const angle = Math.atan2(worldY - 2.2, worldX - (-0.9));
                // Offset by PI/2 because arm points down by default (rotation 0)
                // We want it to point at target.
                const targetRotation = angle - Math.PI / 2;
                leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, targetRotation, 0.1);
            } else {
                // Reset to rest position
                leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0, 0.1);
            }
        }

        // --- RIGHT ARM TRACKING ---
        if (rightArmRef.current) {
            if (mouseX > 0.1) {
                // Right Shoulder Pos approx: [0.9, 2.2]
                const angle = Math.atan2(worldY - 2.2, worldX - 0.9);
                const targetRotation = angle - Math.PI / 2;
                rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetRotation, 0.1);
            } else {
                // Reset to rest position
                rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0, 0.1);
            }
        }
    });

    return (
        <group position={[0, -1, 0]}>
            {/* --- STATIC BODY --- */}
            <group position={[0, 0, 0]}>
                {/* Torso */}
                <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.5, 2, 0.8]} />
                    <meshStandardMaterial color="#4ade80" emissive="#166534" emissiveIntensity={0.2} roughness={0.3} metallic={0.8} />
                </mesh>
                {/* Chest Plates */}
                <mesh position={[-0.4, 2, 0.41]}>
                    <planeGeometry args={[0.5, 0.3]} />
                    <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
                </mesh>
                <mesh position={[0.4, 2, 0.41]}>
                    <planeGeometry args={[0.5, 0.8]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
                </mesh>
            </group>

            {/* --- MOVING HEAD --- */}
            <group ref={headRef} position={[0, 2.6, 0]}>
                {/* Head Shape */}
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[1.2, 0.8, 0.9]} />
                    <meshStandardMaterial color="#a855f7" roughness={0.2} metallic={0.9} />
                </mesh>
                {/* Eyes */}
                <mesh position={[-0.3, 0.1, 0.46]}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} />
                </mesh>
                <mesh position={[0.3, 0.1, 0.46]}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} />
                </mesh>
                {/* Mouth/Grill */}
                <mesh position={[0, -0.2, 0.46]}>
                    <planeGeometry args={[0.6, 0.15]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            </group>

            {/* --- MOVING ARMS --- */}
            {/* Left Arm */}
            <group ref={leftArmRef} position={[-0.9, 2.2, 0]}>
                <mesh position={[-0.2, -0.8, 0]} castShadow>
                    <boxGeometry args={[0.4, 1.8, 0.4]} />
                    <meshStandardMaterial color="#6366f1" />
                </mesh>
                {/* Hand */}
                <mesh position={[-0.2, -1.8, 0]}>
                    <sphereGeometry args={[0.25]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>

            {/* Right Arm */}
            <group ref={rightArmRef} position={[0.9, 2.2, 0]}>
                <mesh position={[0.2, -0.8, 0]} castShadow>
                    <boxGeometry args={[0.4, 1.8, 0.4]} />
                    <meshStandardMaterial color="#6366f1" />
                </mesh>
                {/* Hand */}
                <mesh position={[0.2, -1.8, 0]}>
                    <sphereGeometry args={[0.25]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>
        </group>
    );
}

import * as THREE from "three";
