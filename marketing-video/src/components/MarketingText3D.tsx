
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export const MarketingText3D: React.FC<{
    text: string;
    position: [number, number, number];
    color: string;
    size?: number;
    rotation?: [number, number, number];
}> = ({ text, position, color, size = 1, rotation = [0, 0, 0] }) => {
    const textRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (textRef.current) {
            // Subtle floating animation
            textRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime()) * 0.2;
        }
    });

    return (
        <Text
            ref={textRef}
            position={position}
            rotation={rotation}
            fontSize={size}
            color={color}
            font="https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.woff" // Direct URL to Google Font
            anchorX="center"
            anchorY="middle"
        >
            {text}
        </Text>
    );
};
