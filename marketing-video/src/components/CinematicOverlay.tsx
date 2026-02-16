import React from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const CinematicOverlay: React.FC<{
    opacity?: number;
}> = ({ opacity = 0.3 }) => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // Procedural Noise (Film Grain)
    // We generate a random seed based on frame to animate the noise
    const seed = random(frame);

    // Vignette
    const vignetteBackground = `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)`;

    // Semantic "Scanlines" or subtle texture
    const scanlineY = frame % 4;

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
            {/* 1. Film Grain - SVG Noise Filter */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.08 }}>
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.6"
                        stitchTiles="stitch"
                        numOctaves={1}
                        seed={seed * 100}
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>

            {/* 2. Vignette */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: vignetteBackground,
                opacity: 0.8
            }} />

            {/* 3. Subtle Chromatic Aberration Simulation (Edges) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 50px rgba(255,0,0,0.05), inset 0 0 50px rgba(0,0,255,0.05)',
                mixBlendMode: 'overlay'
            }} />

            {/* 4. Color Grading Overlay (Teal/Orange hint) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom right, rgba(0, 255, 255, 0.02), rgba(255, 165, 0, 0.02))',
                mixBlendMode: 'overlay'
            }} />
        </AbsoluteFill>
    );
};
