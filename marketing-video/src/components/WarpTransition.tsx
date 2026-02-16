import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';

interface WarpTransitionProps {
    children: React.ReactNode;
    durationInFrames?: number;
    delay?: number; // When does the "warp" happen (usually at end of scene)
    direction?: 'in' | 'out';
}

export const WarpTransition: React.FC<WarpTransitionProps> = ({
    children,
    durationInFrames = 15,
    direction = 'out' // 'out' means we warp OUT of this scene into the next
}) => {
    const frame = useCurrentFrame();

    // The warp happens at the END of the sequence if 'out', or START if 'in'
    // Actually, usually transitions wrap the content.
    // Let's assume this is used inside a <Sequence> that lasts the full scene.
    // We want the effect to trigger at `duration - transitionDuration`.

    // SIMPLIFIED APPROACH:
    // This component should be used as a wrapper for the entire scene content.
    // If direction is 'out', it distorts as the scene ends.

    // We'll use a fixed logic: 
    // If 'out', effect goes from 0 to 1 over the last `durationInFrames`.
    // Valid for sequences where we know the total length? 
    // Easier: Just pass "progress" if possible, but Remotion composition usage varies.

    // BETTER PATTERN: Use this inside a <TransitionSeries> or just manual standard transition logic.
    // Since we are using standard <Sequence>, we'll assume the parent sequence length is handled elsewhere
    // and we just animate based on `frame`.

    // Let's make it simple: 
    // It enters with a Warp (if direction 'in') OR exits with a Warp (if direction 'out').

    // We will assume this component is wrapped in a Sequence of length N.
    // But we don't know N easily. 

    // REVISED STRATEGY: 
    // This component will just provide the visual effect based on manual passed props or 
    // standard entry/exit usage. 
    // Let's stick to "Entry" (in) and "Exit" (out) logic.

    // For 'in': frame 0 to duration
    // For 'out': we need to know when to start. 
    // Let's actually make this a "SceneTransition" replacement that combines both slide/fade AND warp.
    // But to keep it drop-in, let's look at `SceneTransition.tsx`.

    // Let's write it to be driven by `frame`. 
    // We'll implement a "WarpIn" effect (starts distorted, becomes clear) 
    // and just use that at the start of scenes.

    const progress = interpolate(
        frame,
        [0, durationInFrames],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    // Warp IN:
    // Starts huge (scale 2), blurred, and chromatic abberated.
    // Ends normal (scale 1), sharp.

    const scale = interpolate(progress, [0, 1], [1.5, 1], { easing: Easing.out(Easing.exp) });
    const blur = interpolate(progress, [0, 1], [20, 0]);
    const opacity = interpolate(progress, [0, 0.2], [0, 1]); // Fast fade in

    // Chromatic Aberration simulation (splitting channels)
    // We can't easily split channels in pure CSS without mix-blend-mode and copying layers.
    // We'll simulate it with a text-shadow or box-shadow color split if it's text, 
    // but for images it's harder.
    // We'll stick to Scale + Blur + Brightness Flash.

    const brightness = interpolate(progress, [0, 0.3, 1], [2, 1, 1]);

    if (direction === 'in') {
        return (
            <AbsoluteFill style={{
                transform: `scale(${scale})`,
                filter: `blur(${blur}px) brightness(${brightness})`,
                opacity,
                transformOrigin: 'center center'
            }}>
                {children}
            </AbsoluteFill>
        );
    }

    // TODO: 'out' logic requires knowing the end frame. 
    // For now we will only use 'in' at the start of scenes for the "Impact".
    return <AbsoluteFill>{children}</AbsoluteFill>;
};
