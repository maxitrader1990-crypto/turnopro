
import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, useVideoConfig } from 'remotion';

export const SimpleThreeD: React.FC = () => {
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
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} />
                <mesh rotation={[0.5, 0.5, 0]}>
                    <boxGeometry args={[3, 3, 3]} />
                    <meshStandardMaterial color="orange" />
                </mesh>
            </ThreeCanvas>
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                <h1 style={{ color: 'white', fontFamily: 'Arial', fontSize: 50 }}>
                    3D BACKUP MODE
                </h1>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
