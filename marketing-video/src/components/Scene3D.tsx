
import React, { Suspense, useRef } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useFrame } from '@react-three/fiber';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import { Environment, ContactShadows, MeshReflectorMaterial, Sparkles, Float } from '@react-three/drei';
import { PhoneModel } from './PhoneModel';
import { MarketingText3D } from './MarketingText3D';

// Camera controller component
const CameraRig: React.FC = () => {
    const frame = useCurrentFrame();
    useFrame((state) => {
        // Orbital movement
        const angle = frame * 0.005; // Slower rotation
        const radius = 11;
        state.camera.position.x = Math.sin(angle) * radius;
        state.camera.position.z = Math.cos(angle) * radius;
        state.camera.lookAt(0, 0, 0);
    });
    return null;
};

// Neon Ring Component
const NeonRing: React.FC<{ radius: number; speed: number; color: string; rotation: [number, number, number] }> = ({ radius, speed, color, rotation }) => {
    const ringRef = useRef<THREE.Mesh>(null);
    const frame = useCurrentFrame();

    useFrame(() => {
        if (ringRef.current) {
            ringRef.current.rotation.x = rotation[0] + frame * speed * 0.01;
            ringRef.current.rotation.y = rotation[1] + frame * speed * 0.02;
        }
    });

    return (
        <mesh ref={ringRef} rotation={rotation}>
            <torusGeometry args={[radius, 0.05, 16, 100]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
    );
};

export const Scene3D: React.FC<{
    videoSrc: string;
}> = ({ videoSrc }) => {
    const { width, height } = useVideoConfig();

    return (
        <AbsoluteFill>
            <ThreeCanvas
                width={width}
                height={height}
                pixelRatio={1}
                style={{ backgroundColor: 'black' }}
                camera={{ fov: 45, position: [0, 0, 10] }}
            >
                <Suspense fallback={null}>
                    {/* Lighting - Cyberpunk Style (Boosted for no-env) */}
                    <ambientLight intensity={2} />
                    <hemisphereLight intensity={1} color="#ffffff" groundColor="#000000" />
                    <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={500} color="#0088ff" castShadow />
                    <pointLight position={[-10, 0, -5]} intensity={100} color="#ff0055" />
                    <pointLight position={[5, 5, 5]} intensity={100} color="#00ff88" />

                    {/* Volumetric Atmosphere */}
                    <Sparkles count={200} scale={12} size={4} speed={0.4} opacity={0.5} color="#ffd700" />
                    <Sparkles count={100} scale={10} size={10} speed={0.2} opacity={0.2} color="#ff0055" />

                    {/* Environment - REMOVED to prevent loading hang */}
                    {/* <Environment preset="city" /> */}

                    {/* 3D Content - Floating Phone */}
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                        <group rotation={[0, -0.2, 0]}>
                            <PhoneModel videoSrc={videoSrc} />
                        </group>

                        {/* Dynamic Neon Rings */}
                        <NeonRing radius={4} speed={2} color="#0088ff" rotation={[1, 0, 0]} />
                        <NeonRing radius={4.5} speed={-1.5} color="#ff0055" rotation={[0, 1, 0.5]} />
                    </Float>

                    {/* Marketing Text in 3D Space */}
                    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                        <MarketingText3D
                            text="TU BARBERIA"
                            position={[0, 3.5, 0]}
                            color="#ffffff"
                            size={0.8}
                        />
                        <MarketingText3D
                            text="NIVEL DIOS"
                            position={[0, 2.8, 0]}
                            color="#ffd700"
                            size={0.5}
                        />
                        <MarketingText3D
                            text="AGENDA YA"
                            position={[0, -3.5, 2]}
                            color="#ff0055"
                            size={1.2}
                        />
                    </Float>

                    {/* Mirror Floor */}
                    <mesh position={[0, -4.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[50, 50]} />
                        <MeshReflectorMaterial
                            blur={[300, 100]}
                            resolution={1024}
                            mixBlur={1}
                            mixStrength={60} // Strength of the reflection
                            roughness={1}
                            depthScale={1.2}
                            minDepthThreshold={0.4}
                            maxDepthThreshold={1.4}
                            color="#101010"
                            metalness={0.5}
                            mirror={0} // Mirror 0 to avoid type error if old version, actually 1 for full mirror but let's trust default or 0.5
                        />
                    </mesh>

                    {/* Camera Control */}
                    <CameraRig />
                </Suspense>
            </ThreeCanvas>
        </AbsoluteFill>
    );
};
