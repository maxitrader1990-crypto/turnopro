
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { VideoTexture } from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const PhoneModel: React.FC<{
    videoSrc: string; // URL of the video to show on screen
}> = ({ videoSrc }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const screenRef = useRef<THREE.Mesh>(null);

    // Create Video Element for Texture
    const [video] = React.useState(() => {
        const vid = document.createElement('video');
        vid.src = videoSrc;
        vid.crossOrigin = 'Anonymous';
        vid.loop = true;
        vid.muted = true;
        vid.play(); // Auto-play
        return vid;
    });

    // Update video time based on Remotion frame
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();

    useFrame(() => {
        if (video.duration) {
            const time = frame / fps;
            if (Math.abs(video.currentTime - time) > 0.1) {
                video.currentTime = time;
            }
        }
    });

    return (
        <group dispose={null}>
            {/* Phone Body (Black/Titanium) */}
            <RoundedBox ref={meshRef} args={[3.5, 7, 0.3]} radius={0.5} smoothness={4}>
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </RoundedBox>

            {/* Screen (Glowing Video Texture) */}
            <mesh position={[0, 0, 0.16]} ref={screenRef}>
                <planeGeometry args={[3.2, 6.7]} />
                <meshBasicMaterial>
                    <videoTexture attach="map" args={[video]} />
                </meshBasicMaterial>
            </mesh>

            {/* Camera Bump (Back) */}
            <RoundedBox position={[1, 2.5, -0.2]} args={[1, 1, 0.1]} radius={0.2} smoothness={4}>
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
            </RoundedBox>
        </group>
    );
};
