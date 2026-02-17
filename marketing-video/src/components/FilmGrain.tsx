
import React from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion';

export const FilmGrain: React.FC<{
    opacity?: number;
}> = ({ opacity = 0.05 }) => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // Create a random noise pattern that changes every frame
    const noise = random(frame) * 100;

    // We simulate grain by using a CSS radial gradient or simply shifting a background texture
    // For performance in Remotion, a SVG filter or a noise image is best. 
    // Here we use a generated noise pattern via CSS for simplicity and speed.

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', opacity, mixBlendMode: 'overlay' }}>
            <svg width="100%" height="100%">
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.6"
                        numOctaves="3"
                        stitchTiles="stitch"
                        seed={frame} // Animate seed
                    />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
        </AbsoluteFill>
    );
};
