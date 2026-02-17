
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FilmGrain } from './FilmGrain';

export const CinematicWrapper: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    return (
        <AbsoluteFill>
            {/* Base Content */}
            <AbsoluteFill>
                {children}
            </AbsoluteFill>

            {/* Cinematic Color Grading (Teal & Orange) */}
            <AbsoluteFill style={{
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
                background: 'linear-gradient(135deg, rgba(0,43,54,0.4) 0%, rgba(201,165,90,0.2) 100%)', // Teal shadows, Gold highlights
                zIndex: 100
            }} />

            {/* Vignette */}
            <AbsoluteFill style={{
                pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.8) 100%)',
                zIndex: 101
            }} />

            {/* Letterbox (CinemaScope aspect ratio inside 9:16) - Optional stylized bars */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '5%',
                background: 'black', zIndex: 102
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: '5%',
                background: 'black', zIndex: 102
            }} />

            {/* Film Grain */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 103 }}>
                <FilmGrain opacity={0.15} />
            </div>
        </AbsoluteFill>
    );
};
