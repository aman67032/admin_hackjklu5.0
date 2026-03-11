'use client';

import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import { usePathname } from 'next/navigation';
import * as THREE from 'three';

function SacredFlame({ position }: { position: [number, number, number] }) {
    const pointsRef = useRef<THREE.Points>(null!);
    const timer = useMemo(() => new THREE.Timer(), []);
    const count = 40;

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = Math.random() * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            sizes[i] = Math.random();
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        return geometry;
    }, []);

    useFrame((state) => {
        timer.update(state.clock.elapsedTime * 1000);
        const t = timer.getElapsed();
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < count; i++) {
            positions[i * 3 + 1] += 0.02 + Math.random() * 0.02;
            if (positions[i * 3 + 1] > 2) {
                positions[i * 3 + 1] = 0;
                positions[i * 3] = (Math.random() - 0.5) * 0.5;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.rotation.y = t * 0.5;
    });

    return (
        <points ref={pointsRef} position={position} geometry={particles}>
            <pointsMaterial
                size={0.15}
                color="#FF4500"
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
                sizeAttenuation
            />
        </points>
    );
}


function OrbModel() {
    const { scene } = useGLTF('/3d/orb(option2).glb');
    const orbRef = useRef<THREE.Group>(null!);

    // Tint the orb Gold so it isn't pure white
    useMemo(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // Create a clear, glass-like material
                mesh.material = new THREE.MeshPhysicalMaterial({
                    color: '#d99b68', // Antique Amber/Glass
                    transmission: 0.7, // lowered transmission to show more color
                    opacity: 1,
                    roughness: 0.05,
                    ior: 1.5,
                    thickness: 2,
                    emissive: '#27a792',
                    emissiveIntensity: 0.3 // Much lower emission to prevent whitening
                });
            }
        });
    }, [scene]);


    return (
        <Float speed={2.5} rotationIntensity={0.8} floatIntensity={1.5}>
            <group ref={orbRef}>
                {/* Scaled down the Orb and applied glass material */}
                <primitive object={scene} scale={5} position={[0, -1, 0]} rotation={[Math.PI / 2, 0, 0]} />
            </group>
            <pointLight distance={15} intensity={3} color="#D4AF37" />
        </Float>
    );
}

// AI Generated Greek Pillar
function PillarModel({ position, rotation = [0, 0, 0], scale = 1, showFlame = false }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: number; showFlame?: boolean }) {
    const { scene } = useGLTF('/3d/pillar(option3).glb');
    // Clone scene so we can use it multiple times without glitches
    const copiedScene = useMemo(() => scene.clone(), [scene]);

    // Ensure materials react nicely to light
    useMemo(() => {
        copiedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    // Make pillars fully solid and reactive to light
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    mat.transparent = false;
                    mat.opacity = 1;
                    mat.needsUpdate = true;
                }
            }
        });
    }, [copiedScene]);

    const group = useRef<THREE.Group>(null!);
    const timer = useMemo(() => new THREE.Timer(), []);

    useFrame((state) => {
        timer.update(state.clock.elapsedTime * 1000);
        const t = timer.getElapsed();
        group.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.2;
    });

    return (
        <group ref={group} position={position} rotation={rotation as any} scale={scale}>
            {/* Targeted light specifically for this pillar to make it brighter */}
            <pointLight position={[0, 10, 10]} intensity={4.5} distance={50} color="#FFF8E7" />
            {/* Moved back down to the bottom as requested */}
            <primitive object={copiedScene} scale={9} position={[0, -2, 0]} />
            {showFlame && <SacredFlame position={[0, -5.5, 0]} />}
        </group>
    );
}

// Preload the GLTF to avoid popping
if (typeof window !== 'undefined') {
    useGLTF.preload('/3d/orb(option2).glb');
    useGLTF.preload('/3d/pillar(option3).glb');
}

function OlympianParticles() {
    const pointsRef = useRef<THREE.Points>(null!);
    const [count, setCount] = useState(1200);
    const timer = useMemo(() => new THREE.Timer(), []);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) setCount(500);
    }, []);

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const radius = 10 + Math.random() * 8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // GREEK DIVINE PALETTE
            const colorChoice = Math.random();
            if (colorChoice < 0.5) {
                // White Marble Glow
                colors[i3] = 0.98; colors[i3 + 1] = 0.98; colors[i3 + 2] = 1.0;
            } else if (colorChoice < 0.85) {
                // Antique Gold
                colors[i3] = 0.83; colors[i3 + 1] = 0.68; colors[i3 + 2] = 0.21;
            } else {
                // Aegean Blue Sparkle
                colors[i3] = 0.0; colors[i3 + 1] = 0.35; colors[i3 + 2] = 0.61;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geometry;
    }, [count]);

    useFrame((state) => {
        timer.update(state.clock.elapsedTime * 1000);
        const t = timer.getElapsed();
        pointsRef.current.rotation.y = t * 0.02;
        pointsRef.current.rotation.x = Math.sin(t * 0.1) * 0.05;
    });

    return (
        <points ref={pointsRef} geometry={particles}>
            <pointsMaterial
                size={0.15}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

function MeanderRing({ radius, color, speed, opacity = 0.3 }: { radius: number; color: string; speed: number; opacity?: number }) {
    const ringRef = useRef<THREE.Mesh>(null!);
    const timer = useMemo(() => new THREE.Timer(), []);

    useFrame((state) => {
        timer.update(state.clock.elapsedTime * 1000);
        const t = timer.getElapsed();
        ringRef.current.rotation.z = t * speed;
        ringRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
        // Aura pulse
        if (ringRef.current.material instanceof THREE.MeshPhongMaterial) {
            ringRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.3;
        }
    });

    return (
        <mesh ref={ringRef}>
            <torusGeometry args={[radius, 0.04, 8, 64]} />
            <meshPhongMaterial
                color={color}
                wireframe
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.5}
            />
        </mesh>
    );
}

export default function GreekScene() {
    const pathname = usePathname();
    const [fov, setFov] = useState(40);

    // Completely disable 3D background on routes that are full-screen 
    // and causes performance/visibility conflicts.

    useEffect(() => {
        // Significantly increase FOV on smaller screens so the pillars still fit
        if (window.innerWidth < 640) setFov(75);
        else if (window.innerWidth < 1024) setFov(55);
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none', background: 'radial-gradient(circle at center, #001A2C 0%, #000508 100%)' }}>
            <Canvas
                camera={{ position: [0, 0, 20], fov: fov }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                }}
            >
                {/* Smoother, warmer lighting setup so the white isn't blown out */}
                <ambientLight intensity={1.5} />
                <directionalLight position={[0, 5, 15]} intensity={1.5} color="#FFF8E7" />
                <directionalLight position={[-10, 0, 5]} intensity={1.0} color="#D4AF37" />
                <directionalLight position={[10, 0, 5]} intensity={1.0} color="#005A9C" />

                <pointLight position={[0, 5, 0]} intensity={1.5} color="#D4AF37" />

                <OlympianParticles />
                <Suspense fallback={null}>
                    <OrbModel />
                </Suspense>

                {/* Columns Framing the Scene (Moved further apart, adjusted for mobile if needed) */}
                <Suspense fallback={null}>
                    {/* On very small FOVs the columns might disappear or crowd, we let them sit out wide. Mobile fov handles the zoom */}
                    <PillarModel position={[-14, -2, -5]} rotation={[0, 0.5, 0]} scale={1.5} showFlame />
                    <PillarModel position={[14, -2, -5]} rotation={[0, -0.5, 0]} scale={1.5} showFlame />
                </Suspense>

                {/* Celestial Rings */}
                <MeanderRing radius={7} color="#D4AF37" speed={0.12} opacity={0.4} />
                <MeanderRing radius={10} color="#F5F5F5" speed={-0.07} opacity={0.2} />
                <MeanderRing radius={14} color="#005A9C" speed={0.04} opacity={0.15} />

                <fog attach="fog" args={['#000508', 15, 45]} />
            </Canvas>
        </div>
    );
}

