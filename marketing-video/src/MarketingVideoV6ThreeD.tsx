
import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { Scene3D } from './components/Scene3D';
import { AnimatedText } from './components/AnimatedText';
import { CinematicWrapper } from './components/CinematicWrapper';

export const MarketingVideoV6ThreeD: React.FC = () => {
    // Falls back to a local file if V5 output is not present. 
    // Ideally this points to the rendered 'video-godmode.mp4' if available in public, 
    // but we use 'video_barber_viral.mp4' to guarantee it works now.
    // Using the V5 God Mode output as the texture/screen content
    const videoSource = staticFile('v5-godmode.mp4');

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {/* The 3D Scene with iPhone + Camera Animation */}
            <Scene3D videoSrc={videoSource} />

            {/* Overlay Text "THE 3D REVOLUTION" */}
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                <CinematicWrapper>
                    <div style={{ position: 'absolute', bottom: 100, width: '100%', textAlign: 'center' }}>
                        <AnimatedText
                            text="THE 3D REVOLUTION"
                            fontSize={60}
                            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: 10, color: 'white' }}
                            animationType="fade"
                        />
                    </div>
                </CinematicWrapper>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
