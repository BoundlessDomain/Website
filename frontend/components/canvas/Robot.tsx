"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Group, Vector3 } from "three";
import * as THREE from "three";

// Helper for smooth angle interpolation (shortest path)
const lerpAngle = (start: number, end: number, t: number) => {
    const diff = (end - start + Math.PI) % (2 * Math.PI) - Math.PI;
    const shortestDiff = diff < -Math.PI ? diff + 2 * Math.PI : diff;
    return start + shortestDiff * t;
};

export default function Robot() {
    const headRef = useRef<Group>(null);
    const leftShoulderRef = useRef<Group>(null);
    const leftElbowRef = useRef<Group>(null);
    const rightShoulderRef = useRef<Group>(null);
    const rightElbowRef = useRef<Group>(null);
    const leftEyeRef = useRef<Mesh>(null);
    const rightEyeRef = useRef<Mesh>(null);

    // IK Parameters
    const UPPER_ARM_LENGTH = 1.0;
    const FOREARM_LENGTH = 1.0;
    const HAND_RADIUS = 0.25;

    // Effective length for IK (Forearm + Hand Center-to-Tip offset)
    const IK_FOREARM_LENGTH = FOREARM_LENGTH + HAND_RADIUS;

    // Robot Position Offset (World Y)
    const ROBOT_Y_OFFSET = -2.5;

    // Shoulder Local Positions (relative to Robot Root)
    const LEFT_SHOULDER_POS = new Vector3(-0.9, 2.2, 0);
    const RIGHT_SHOULDER_POS = new Vector3(0.9, 2.2, 0);

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
        // c^2 = a^2 + b^2 - 2ab cos(C)
        // Angle at Shoulder (alpha): angle between UpperArm and TargetVector
        // dist^2 + UPPER^2 - 2(dist)(UPPER)cos(alpha) = LOWER^2??? NO.
        // Triangle sides: a=UPPER, b=LOWER, c=DIST
        // we want angle alpha (at shoulder, between c and a)
        // b^2 = a^2 + c^2 - 2ac cos(alpha)
        // cos(alpha) = (a^2 + c^2 - b^2) / (2ac)

        const cosAlpha = (UPPER_ARM_LENGTH * UPPER_ARM_LENGTH + dist * dist - IK_FOREARM_LENGTH * IK_FOREARM_LENGTH)
            / (2 * UPPER_ARM_LENGTH * dist);

        // Clamp cosAlpha to [-1, 1] just in case
        const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));

        // 4. Global angle of the Target Vector
        // atan2(y, x) gives angle from X-axis. 
        // Our arms hang down (-PI/2) at rest, but let's just calculate rotations relative to X-axis first.
        const theta = Math.atan2(dy, dx);

        // 5. Calculate final Joint Angles
        // Shoulder Angle: theta +/- alpha (Left arm bends one way, Right arm bends the other?)
        // Actually typically both elbows bend "outwards" or "downwards".
        // Let's assume elbows bend "outwards" relative to the body?
        // Let's try: Left arm elbow bends Left (Clockwise relative to vector?), Right arm elbow bends Right.

        // Left Arm (on left side of screen): Elbow usually bends with negative angle relative to straight line?
        // Let's try: Shoulder = theta + alpha * direction

        const direction = isLeft ? 1 : -1;
        const shoulderAngle = theta + (alpha * direction);

        // Elbow Angle (beta): Angle at elbow between Upper and Lower.
        // Derived from Law of Cosines for angle opposite to DIST? OR just geometry?
        // Simple 2D geometry: The angle *change* at the elbow.
        // If arm was straight, elbow angle = 0.
        // The angle inside the triangle at the elbow (Gamma) is opposite to dist.
        // c^2 = a^2 + b^2 - 2ab cos(Gamma) -> dist^2 = UPPER^2 + LOWER^2 - 2*UPPER*LOWER*cos(Gamma)
        // cos(Gamma) = (UPPER^2 + LOWER^2 - dist^2) / (2*UPPER*LOWER)
        const cosGamma = (UPPER_ARM_LENGTH * UPPER_ARM_LENGTH + IK_FOREARM_LENGTH * IK_FOREARM_LENGTH - dist * dist)
            / (2 * UPPER_ARM_LENGTH * IK_FOREARM_LENGTH);
        const gamma = Math.acos(Math.max(-1, Math.min(1, cosGamma)));

        // The actual rotation of the forearm relative to upper arm is (PI - Gamma) * direction? 
        // Or just Gamma?
        // If triangles is folded (dist=0), Gamma=0? No, Gamma=180?
        // If dist = max, Gamma = 180 (straight line).
        // If arm is straight, we want local rotation 0.
        // So ElbowLocalRotation = Gamma - PI.
        const elbowAngle = (gamma - Math.PI) * direction * -1; // Tune this direction

        // Correction for T-Pose/Rest Pose assumptions
        // Our mesh groups are likely oriented: Y-up or something? 
        // Let's assume standard 0-rotation points UP or RIGHT?
        // For the arm groups defined below:
        // Shoulder Group: Positioned. Inside it, Upper Mesh.
        // We will apply rotation.z to Step Group.
        // To make 0 be "Down", we might need offset.
        // But `Math.atan2` gives 0 for Right, PI/2 for Up, -PI/2 for Down.
        // So we can apply calculating directly to Z rotation if 0 means Right.

        return { shoulderAngle, elbowAngle };
    };

    // Raycasting for accurate mouse tracking
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new Vector3(0, 0, 1), 0); // Plane at Z=0 normal to Z-axis
    const targetVector = new Vector3();

    useFrame((state) => {
        const mouse = state.mouse;

        // Use Raycaster to find the point on the Z=0 plane
        raycaster.setFromCamera(mouse, state.camera);
        raycaster.ray.intersectPlane(plane, targetVector);

        const worldX = targetVector.x;
        const worldY = targetVector.y;

        // --- HEAD TRACKING ---
        if (headRef.current) {
            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, mouse.x * 0.6, 0.1);
            headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -mouse.y * 0.5, 0.1);
        }

        // --- LEFT ARM IK ---
        if (leftShoulderRef.current && leftElbowRef.current) {
            if (mouse.x < -0.1) {
                // Correct the "direction" logic: 
                const { shoulderAngle, elbowAngle } = solveIK(worldX, worldY, LEFT_SHOULDER_POS, true);

                // Apply interpolations (Add PI/2 to align Y-up cylinder with X-axis angle)
                const targetShoulderRot = shoulderAngle + Math.PI / 2;
                const targetElbowRot = elbowAngle;

                leftShoulderRef.current.rotation.z = lerpAngle(leftShoulderRef.current.rotation.z, targetShoulderRot, 0.1);
                leftElbowRef.current.rotation.z = lerpAngle(leftElbowRef.current.rotation.z, targetElbowRot, 0.1);
            } else {
                // Reset to rest position
                leftShoulderRef.current.rotation.z = lerpAngle(leftShoulderRef.current.rotation.z, 0, 0.1);
                leftElbowRef.current.rotation.z = lerpAngle(leftElbowRef.current.rotation.z, 0, 0.1);
            }
        }

        // --- RIGHT ARM IK ---
        if (rightShoulderRef.current && rightElbowRef.current) {
            if (mouse.x > 0.1) {
                const { shoulderAngle, elbowAngle } = solveIK(worldX, worldY, RIGHT_SHOULDER_POS, false);

                const targetShoulderRot = shoulderAngle + Math.PI / 2;
                const targetElbowRot = elbowAngle;

                rightShoulderRef.current.rotation.z = lerpAngle(rightShoulderRef.current.rotation.z, targetShoulderRot, 0.1);
                rightElbowRef.current.rotation.z = lerpAngle(rightElbowRef.current.rotation.z, targetElbowRot, 0.1);
            } else {
                // Reset to rest position
                rightShoulderRef.current.rotation.z = lerpAngle(rightShoulderRef.current.rotation.z, 0, 0.1);
                rightElbowRef.current.rotation.z = lerpAngle(rightElbowRef.current.rotation.z, 0, 0.1);
            }
        }

        // --- EYE TRACKING ---
        if (leftEyeRef.current) leftEyeRef.current.lookAt(worldX, worldY, 5);
        if (rightEyeRef.current) rightEyeRef.current.lookAt(worldX, worldY, 5);
    });

    return (
        <group position={[0, ROBOT_Y_OFFSET, 0]}>
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
                <group position={[-0.3, 0.1, 0.46]}>
                    <mesh ref={leftEyeRef}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
                        <mesh position={[0, 0, 0.12]}>
                            <sphereGeometry args={[0.06, 16, 16]} />
                            <meshStandardMaterial color="#000000" />
                        </mesh>
                    </mesh>
                </group>
                <group position={[0.3, 0.1, 0.46]}>
                    <mesh ref={rightEyeRef}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
                        <mesh position={[0, 0, 0.12]}>
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

