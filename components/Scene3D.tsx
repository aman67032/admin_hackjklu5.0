'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleField() {
    const pointsRef = useRef<THREE.Points>(null!);
    const [count, setCount] = useState(900); // Default to desktop count

    // Adjust particle count for mobile
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) setCount(400); // Significantly fewer particles on mobile
    }, []);

    const particles = useMemo(() => {
        // Re-generate geometry only if count changes
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Radius: Slightly smaller spread on mobile if needed, but keeping similar for consistency
            const radius = 9 + Math.random() * 6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            const colorChoice = Math.random();
            // COFFEE PREMIUM PALETTE
            if (colorChoice < 0.4) {
                // Antique Brass / Gold
                colors[i3] = 0.81; colors[i3 + 1] = 0.61; colors[i3 + 2] = 0.48;
            } else if (colorChoice < 0.7) {
                // Deep Coffee
                colors[i3] = 0.44; colors[i3 + 1] = 0.29; colors[i3 + 2] = 0.22;
            } else {
                // Pale Gold / Cream
                colors[i3] = 0.90; colors[i3 + 1] = 0.76; colors[i3 + 2] = 0.61;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        return geometry;
    }, [count]);

    const startTime = useRef(performance.now());

    useFrame((state) => {
        // Use performance.now() to avoid deprecated THREE.Clock warning from state.clock
        const t = (performance.now() - startTime.current) / 1000;
        // Slow rotation for less distraction
        pointsRef.current.rotation.y = t * 0.03;
        pointsRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    });

    return (
        <points ref={pointsRef} geometry={particles}>
            <pointsMaterial
                size={0.12} // Slightly larger to compensate for fewer particles
                vertexColors
                transparent
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false} // Performance boost
            />
        </points>
    );
}

function WireframeRing({ radius, color, speed, opacity = 0.3 }: { radius: number; color: string; speed: number; opacity?: number }) {
    const ringRef = useRef<THREE.Mesh>(null!);

    const startTime = useRef(performance.now());

    useFrame((state) => {
        // Use performance.now() to avoid deprecated THREE.Clock warning from state.clock
        const t = (performance.now() - startTime.current) / 1000;
        ringRef.current.rotation.z = t * speed;
        ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    });

    return (
        <mesh ref={ringRef}>
            {/* Reduced segments for performance (64 -> 48) */}
            <torusGeometry args={[radius, 0.03, 6, 48]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
        </mesh>
    );
}

export default function CosmicScene() {
    const [fov, setFov] = useState(45);

    useEffect(() => {
        // Widen FOV on mobile to see more of the scene with less zooming
        if (window.innerWidth < 768) setFov(60);
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <Canvas
                camera={{ position: [0, 0, 18], fov: fov }}
                dpr={[1, 1.5]} // Limit pixel ratio for performance
                gl={{
                    antialias: false, // Disable AA for performance (particles hide jaggedness)
                    alpha: true,
                    powerPreference: 'high-performance',
                    depth: false, // Disable depth buffer for background scene
                    stencil: false // Disable stencil buffer
                }}
            >
                {/* No lights needed for basic material/points, saves calculations */}

                <ParticleField />

                {/* Coffee Theme Rings */}
                <WireframeRing radius={6} color="#CF9D7B" speed={0.1} opacity={0.3} />
                <WireframeRing radius={8} color="#724B39" speed={-0.08} opacity={0.2} />
                <WireframeRing radius={11} color="#E8C39E" speed={0.05} opacity={0.15} />
            </Canvas>
        </div>
    );
}