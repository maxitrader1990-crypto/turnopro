import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, random } from 'remotion';

interface CameraShakeProps {
    children: React.ReactNode;
    intensity?: number; // How extensive is the shake (pixels)
    duration?: number;  // How long it lasts
    startDelay?: number; // When to start shaking
}

export const CameraShake: React.FC<CameraShakeProps> = ({
    children,
    intensity = 20,
    duration = 10,
    startDelay = 0
}) => {
    const frame = useCurrentFrame();

    // Determine if we are in the shaking window
    const active = frame >= startDelay && frame < startDelay + duration;

    // Generate random shake values based on frame
    // We use `random(seed)` where seed is the frame number, so it's deterministic.

    const shakeX = active ? (random(frame) - 0.5) * intensity : 0;
    const shakeY = active ? (random(frame + 1000) - 0.5) * intensity : 0;
    const rotate = active ? (random(frame + 2000) - 0.5) * (intensity / 5) : 0; // Slight rotation

    // Fade out the shake intensity over time
    const currentFrameInShake = frame - startDelay;
    const damping = active
        ? interpolate(currentFrameInShake, [0, duration], [1, 0], { extrapolateRight: 'clamp' })
        : 0;

    return (
        <AbsoluteFill style={{
            transform: `translate(${shakeX * damping}px, ${shakeY * damping}px) rotate(${rotate * damping}deg)`,
            // Add motion blur during shake?
            filter: active ? `blur(${intensity * damping * 0.1}px)` : 'none'
        }}>
            {children}
        </AbsoluteFill>
    );
};
