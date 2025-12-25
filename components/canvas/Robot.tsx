"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Group, Vector3, Raycaster, Plane } from "three";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useUIStore } from "@/store/uiStore";

// Helper for smooth angle interpolation (shortest path)
const lerpAngle = (start: number, end: number, t: number) => {
    const diff = (end - start + Math.PI) % (2 * Math.PI) - Math.PI;
    const shortestDiff = diff < -Math.PI ? diff + 2 * Math.PI : diff;
    return start + shortestDiff * t;
};

// --- Zzz PARTICLE SYSTEM ---
const ZzzParticles = React.memo(function ZzzParticles() {
    // Static Zs for Low Power Mode (No Animation)
    return (
        <group>
            <Text
                position={[0.5, 3.5, 0]}
                fontSize={0.4}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#a855f7"
            >
                Z
            </Text>
            <Text
                position={[1.2, 4.2, 0]}
                fontSize={0.6}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#a855f7"
            >
                Z
            </Text>
            <Text
                position={[2.0, 5.0, 0]}
                fontSize={0.8}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#a855f7"
            >
                Z
            </Text>
        </group>
    );
});

// --- SANTA HAT COMPONENT ---
const SantaHat = () => (
    <group position={[0, 0.45, 0]}>
        {/* White Trim */}
        <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.6, 0.15, 16, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        {/* Red Cone Body */}
        <mesh position={[0, 0.6, -0.1]} rotation={[-0.2, 0, 0]}>
            <coneGeometry args={[0.55, 1.2, 32]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
        </mesh>
        {/* White Pom-Pom */}
        <mesh position={[0, 1.2, -0.25]} rotation={[-0.2, 0, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
    </group>
);

interface RobotProps {
    layoutMode?: 'mobile' | 'narrow' | 'wide';
    theme?: string;
}

export default function Robot({ layoutMode = 'wide', theme }: RobotProps) {
    const headRef = useRef<Group>(null);
    const leftShoulderRef = useRef<Group>(null);
    const leftElbowRef = useRef<Group>(null);
    const rightShoulderRef = useRef<Group>(null);
    const rightElbowRef = useRef<Group>(null);

    // Eye & Pupil Refs (Independent control)
    const leftEyeRef = useRef<Mesh>(null);
    const rightEyeRef = useRef<Mesh>(null);
    const leftPupilRef = useRef<Mesh>(null);
    const rightPupilRef = useRef<Mesh>(null);

    // IK Parameters
    const UPPER_ARM_LENGTH = 1.0;
    const FOREARM_LENGTH = 1.0;
    const HAND_RADIUS = 0.25;

    // Effective length for IK (Forearm + Hand Center-to-Tip offset)
    const IK_FOREARM_LENGTH = FOREARM_LENGTH + HAND_RADIUS;

    // Robot Position Offset (World Y)
    const ROBOT_Y_OFFSET = -2.5;

    // Shoulder Local Positions (relative to Robot Root)
    // Memoize constant vectors
    const LEFT_SHOULDER_POS = useMemo(() => new Vector3(-0.9, 2.2, 0), []);
    const RIGHT_SHOULDER_POS = useMemo(() => new Vector3(0.9, 2.2, 0), []);

    const raycaster = useMemo(() => new Raycaster(), []);
    const plane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), []);
    const targetVector = useMemo(() => new Vector3(), []);

    const navState = useUIStore((state) => state.navState);
    const isLoginOpen = useUIStore((state) => state.isLoginOpen);
    const isLowPowerMode = useUIStore((state) => state.isLowPowerMode);

    const { viewport } = useThree();

    // IK Solver Function
    const solveIK = (
        targetX: number,
        targetY: number,
        shoulderPos: Vector3,
        isLeft: boolean
    ) => {
        // 1. Calculate vector from Shoulder to Target
        // Shoulders are in local space relative to robot root.
        // Robot root is at [0, ROBOT_Y_OFFSET, 0].
        // So global shoulder pos = shoulderPos + [0, ROBOT_Y_OFFSET, 0].

        const shoulderWorldX = shoulderPos.x;
        const shoulderWorldY = shoulderPos.y + ROBOT_Y_OFFSET;

        let dx = targetX - shoulderWorldX;
        let dy = targetY - shoulderWorldY;

        // Distance from shoulder to target
        let dist = Math.sqrt(dx * dx + dy * dy);

        // 2. Clamp distance to max reach (minus tiny epsilon to avoid singularities)
        const maxReach = UPPER_ARM_LENGTH + IK_FOREARM_LENGTH - 0.01;
        if (dist > maxReach) {
            const ratio = maxReach / dist;
            dx *= ratio;
            dy *= ratio;
            dist = maxReach;
        }

        // 3. Law of Cosines for internal angles
        const cosAlpha = (UPPER_ARM_LENGTH * UPPER_ARM_LENGTH + dist * dist - IK_FOREARM_LENGTH * IK_FOREARM_LENGTH)
            / (2 * UPPER_ARM_LENGTH * dist);

        // Clamp cosAlpha to [-1, 1] just in case
        const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));

        // 4. Global angle of the Target Vector
        const theta = Math.atan2(dy, dx);

        // 5. Calculate final Joint Angles
        const direction = isLeft ? 1 : -1;
        const shoulderAngle = theta + (alpha * direction);

        const cosGamma = (UPPER_ARM_LENGTH * UPPER_ARM_LENGTH + IK_FOREARM_LENGTH * IK_FOREARM_LENGTH - dist * dist)
            / (2 * UPPER_ARM_LENGTH * IK_FOREARM_LENGTH);
        const gamma = Math.acos(Math.max(-1, Math.min(1, cosGamma)));

        const elbowAngle = (gamma - Math.PI) * direction * -1; // Tune this direction

        return { shoulderAngle, elbowAngle };
    };

    useFrame((state) => {
        // --- LOW POWER MODE CHECK ---
        // If Low Power Mode is ON, skip all IK calculations and animations.
        // VISUAL: Enter Sleep Pose (Head Down, Eyes Closed, Arms Relaxed)
        if (useUIStore.getState().isLowPowerMode) {
            // Smoothly lerp to sleep pose so it doesn't snap if toggled live
            const dt = 0.1;

            // Head: Look Down
            if (headRef.current) {
                headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.5, dt); // Look down
                headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, dt);   // Center
            }

            // Eyes: "Close" (Squash Y scale)
            if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, 0.05, dt);
            if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, 0.05, dt);

            // HIDE PUPILS when sleeping
            if (leftPupilRef.current) leftPupilRef.current.visible = false;
            if (rightPupilRef.current) rightPupilRef.current.visible = false;

            // Arms: Relax sides (Shoulders rot Z ~0, Elbows ~0)
            if (leftShoulderRef.current) leftShoulderRef.current.rotation.z = lerpAngle(leftShoulderRef.current.rotation.z, 0, dt);
            if (leftElbowRef.current) leftElbowRef.current.rotation.z = lerpAngle(leftElbowRef.current.rotation.z, 0, dt);

            if (rightShoulderRef.current) rightShoulderRef.current.rotation.z = lerpAngle(rightShoulderRef.current.rotation.z, 0, dt);
            if (rightElbowRef.current) rightElbowRef.current.rotation.z = lerpAngle(rightElbowRef.current.rotation.z, 0, dt);

            return;
        }

        // WAKE UP: Restore Eye Scale and Visibility
        if (leftPupilRef.current) leftPupilRef.current.visible = true;
        if (rightPupilRef.current) rightPupilRef.current.visible = true;

        if (leftEyeRef.current && leftEyeRef.current.scale.y < 0.9) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, 1, 0.1);
        if (rightEyeRef.current && rightEyeRef.current.scale.y < 0.9) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, 1, 0.1);

        // Skip animation if login is open to save resources (and prevent occlusion)
        // OR if we are in 'redirecting' state (page has visually successfully exited)
        if (useUIStore.getState().isLoginOpen) return;
        const navState = useUIStore.getState().navState; // Read fresh state
        if (navState === 'redirecting') return;

        let targetX = state.mouse.x;
        let targetY = state.mouse.y;

        const mouse = state.mouse;

        // Use Raycaster to find the point on the Z=0 plane
        raycaster.setFromCamera(mouse, state.camera);
        raycaster.ray.intersectPlane(plane, targetVector);

        let worldX = targetVector.x;
        let worldY = targetVector.y;

        // OVERRIDE FOR ANIMATION
        if (navState === 'grabbing') {
            worldX = 0;
            worldY = 0; // Look at center
        } else if (navState === 'expanding') {
            worldX = 0;
            worldY = 0;
        }

        // --- HEAD TRACKING ---
        if (headRef.current) {
            const targetHeadX = (navState !== 'idle') ? 0 : mouse.x * 0.6;
            const targetHeadY = (navState !== 'idle') ? 0 : -mouse.y * 0.5;

            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetHeadX, 0.1);
            headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadY, 0.1);
        }

        // --- LEFT ARM IK ---
        if (leftShoulderRef.current && leftElbowRef.current) {
            // OPTIMIZATION: If navState is idle and mouse is far, skip complex IK or just lerp to rest
            // We still run lerp to rest, but we skip the solveIK math if we know we are returning to 0

            // LOGIC SPLIT:
            // Desktop (Wide/Narrow): Left arm tracks if mouse < -0.1
            // Mobile: Both arms track if mouse.y > 0 (Top half where buttons are)
            const isActive = layoutMode === 'mobile'
                ? (mouse.y > 0 || Math.abs(mouse.x) > 0.1) // Mobile: Track if top half OR side interactions
                : (mouse.x < -0.1);

            if ((isActive && navState === 'idle') || navState !== 'idle') {
                let ikTargetX = worldX;
                let ikTargetY = worldY;

                if (navState === 'grabbing') {
                    ikTargetX = -1.2; // Hold Left Side of Card
                    ikTargetY = 0;    // Center Height
                } else if (navState === 'expanding') {
                    ikTargetX = -6.0; // Push Outwards
                    ikTargetY = 0;
                }

                const { shoulderAngle, elbowAngle } = solveIK(ikTargetX, ikTargetY, LEFT_SHOULDER_POS, true);

                // Apply interpolations
                const targetShoulderRot = shoulderAngle + Math.PI / 2;
                const targetElbowRot = elbowAngle;

                leftShoulderRef.current.rotation.z = lerpAngle(leftShoulderRef.current.rotation.z, targetShoulderRot, 0.1);
                leftElbowRef.current.rotation.z = lerpAngle(leftElbowRef.current.rotation.z, targetElbowRot, 0.1);
            } else {
                // Reset to rest position
                // Optimization: If already close to 0, stop lerping to save CPU
                if (Math.abs(leftShoulderRef.current.rotation.z) > 0.001) {
                    leftShoulderRef.current.rotation.z = lerpAngle(leftShoulderRef.current.rotation.z, 0, 0.1);
                }
                if (Math.abs(leftElbowRef.current.rotation.z) > 0.001) {
                    leftElbowRef.current.rotation.z = lerpAngle(leftElbowRef.current.rotation.z, 0, 0.1);
                }
            }
        }

        // --- RIGHT ARM IK ---
        if (rightShoulderRef.current && rightElbowRef.current) {
            // Activate if mouse is on right OR if animating

            // LOGIC SPLIT:
            // Desktop: Right arm tracks if mouse > 0.1
            // Mobile: Both arms track if mouse.y > 0
            const isActive = layoutMode === 'mobile'
                ? (mouse.y > 0 || Math.abs(mouse.x) > 0.1)
                : (mouse.x > 0.1);

            if ((isActive && navState === 'idle') || navState !== 'idle') {
                let ikTargetX = worldX;
                let ikTargetY = worldY;

                if (navState === 'grabbing') {
                    ikTargetX = 1.2; // Hold Right Side of Card
                    ikTargetY = 0;
                } else if (navState === 'expanding') {
                    ikTargetX = 6.0; // Push Outwards
                    ikTargetY = 0;
                }

                const { shoulderAngle, elbowAngle } = solveIK(ikTargetX, ikTargetY, RIGHT_SHOULDER_POS, false);

                const targetShoulderRot = shoulderAngle + Math.PI / 2;
                const targetElbowRot = elbowAngle;

                rightShoulderRef.current.rotation.z = lerpAngle(rightShoulderRef.current.rotation.z, targetShoulderRot, 0.1);
                rightElbowRef.current.rotation.z = lerpAngle(rightElbowRef.current.rotation.z, targetElbowRot, 0.1);
            } else {
                // Reset to rest position
                if (Math.abs(rightShoulderRef.current.rotation.z) > 0.001) {
                    rightShoulderRef.current.rotation.z = lerpAngle(rightShoulderRef.current.rotation.z, 0, 0.1);
                }
                if (Math.abs(rightElbowRef.current.rotation.z) > 0.001) {
                    rightElbowRef.current.rotation.z = lerpAngle(rightElbowRef.current.rotation.z, 0, 0.1);
                }
            }
        }

        // Eyes follow center during animation
        if (navState !== 'idle') {
            if (leftEyeRef.current) leftEyeRef.current.lookAt(0, 0, 5);
            if (rightEyeRef.current) rightEyeRef.current.lookAt(0, 0, 5);
            return; // Skip normal eye tracking
        }

        // --- EYE TRACKING ---
        if (leftEyeRef.current) leftEyeRef.current.lookAt(worldX, worldY, 5);
        if (rightEyeRef.current) rightEyeRef.current.lookAt(worldX, worldY, 5);
    });

    return (
        <group position={[0, ROBOT_Y_OFFSET, 0]}>
            {/* --- Zzz PARTICLES for SLEEP MODE --- */}
            {isLowPowerMode && <ZzzParticles />}

            {/* --- STATIC BODY --- */}
            <group position={[0, 0, 0]}>
                {/* Torso */}
                <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.5, 2, 0.8]} />
                    <meshStandardMaterial color="#4ade80" emissive="#166534" emissiveIntensity={0.2} roughness={0.3} metalness={0.8} />
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

            {/* --- HEAD --- */}
            <group ref={headRef} position={[0, 2.6, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[1.2, 0.8, 0.9]} />
                    <meshStandardMaterial color="#a855f7" roughness={0.2} metalness={0.9} />
                </mesh>
                {theme === 'christmas' && <SantaHat />}
                <group position={[-0.3, 0.1, 0.46]}>
                    <mesh ref={leftEyeRef}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
                        <mesh ref={leftPupilRef} position={[0, 0, 0.12]}>
                            <sphereGeometry args={[0.06, 16, 16]} />
                            <meshStandardMaterial color="#000000" />
                        </mesh>
                    </mesh>
                </group>
                <group position={[0.3, 0.1, 0.46]}>
                    <mesh ref={rightEyeRef}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
                        <mesh ref={rightPupilRef} position={[0, 0, 0.12]}>
                            <sphereGeometry args={[0.06, 16, 16]} />
                            <meshStandardMaterial color="#000000" />
                        </mesh>
                    </mesh>
                </group>
                <mesh position={[0, -0.2, 0.46]}>
                    <planeGeometry args={[0.6, 0.15]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            </group>

            {/* --- JOINTED ARMS --- */}

            {/* LEFT ARM */}
            <group ref={leftShoulderRef} position={[LEFT_SHOULDER_POS.x, LEFT_SHOULDER_POS.y, LEFT_SHOULDER_POS.z]}>
                {/* Upper Arm Mesh (Origin at top) */}
                <mesh position={[0, -UPPER_ARM_LENGTH / 2, 0]} castShadow>
                    <boxGeometry args={[0.35, UPPER_ARM_LENGTH, 0.35]} />
                    <meshStandardMaterial color="#6366f1" />
                </mesh>

                {/* Elbow Group (Relative to Shoulder) */}
                <group ref={leftElbowRef} position={[0, -UPPER_ARM_LENGTH, 0]}>
                    {/* Elbow Joint Sphere */}
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.25]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    {/* Forearm Mesh (Origin at top) */}
                    <mesh position={[0, -FOREARM_LENGTH / 2, 0]} castShadow>
                        <boxGeometry args={[0.3, FOREARM_LENGTH, 0.3]} />
                        <meshStandardMaterial color="#6366f1" />
                    </mesh>
                    {/* Hand */}
                    <mesh position={[0, -FOREARM_LENGTH, 0]}>
                        <sphereGeometry args={[0.25]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                </group>
            </group>

            {/* RIGHT ARM */}
            <group ref={rightShoulderRef} position={[RIGHT_SHOULDER_POS.x, RIGHT_SHOULDER_POS.y, RIGHT_SHOULDER_POS.z]}>
                {/* Upper Arm Mesh */}
                <mesh position={[0, -UPPER_ARM_LENGTH / 2, 0]} castShadow>
                    <boxGeometry args={[0.35, UPPER_ARM_LENGTH, 0.35]} />
                    <meshStandardMaterial color="#6366f1" />
                </mesh>

                {/* Elbow Group */}
                <group ref={rightElbowRef} position={[0, -UPPER_ARM_LENGTH, 0]}>
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.25]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[0, -FOREARM_LENGTH / 2, 0]} castShadow>
                        <boxGeometry args={[0.3, FOREARM_LENGTH, 0.3]} />
                        <meshStandardMaterial color="#6366f1" />
                    </mesh>
                    <mesh position={[0, -FOREARM_LENGTH, 0]}>
                        <sphereGeometry args={[0.25]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                </group>
            </group>

        </group>
    );
}
