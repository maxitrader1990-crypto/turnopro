
import React from 'react';
import { AbsoluteFill, Sequence, Img, useVideoConfig, staticFile, Video, interpolate, useCurrentFrame, Easing } from 'remotion';
import { AnimatedText } from './components/AnimatedText';
import { CinematicWrapper } from './components/CinematicWrapper';
import { CameraShake } from './components/CameraShake';
import { ChromaticAberration } from './components/ChromaticAberration';
import { LightLeak } from './components/LightLeak';
import { Strobe } from './components/Strobe';
import { FilmGrain } from './components/FilmGrain';

export const MarketingVideoV5GodMode: React.FC = () => {
    const { fps, durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>

            {/* ESCENA 1: THE HOOK (0-3s) - INTRO MAFIOSO WITH RGB SPLIT */}
            <Sequence from={0} durationInFrames={3 * fps}>
                <ChromaticAberration offset={5}>
                    <Video
                        src={staticFile('video_mafioso_barber.mp4')}
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            filter: 'contrast(1.4) brightness(0.8)',
                            transform: `scale(${interpolate(frame, [0, 3 * fps], [1, 1.3], { easing: Easing.cubic })}))`
                        }}
                        muted
                    />
                </ChromaticAberration>
                <Strobe frequency={5} />
                <Sequence from={15}>
                    <AnimatedText
                        text="TU NEGOCIO"
                        fontSize={110}
                        style={{ top: '35%', fontFamily: 'Impact', letterSpacing: '5px', color: 'white' }}
                        animationType="pop"
                    />
                </Sequence>
                <Sequence from={45}>
                    <CameraShake intensity={15}>
                        <AnimatedText
                            text="ESTÁ EN PELIGRO"
                            fontSize={110}
                            style={{ top: '50%', fontFamily: 'Impact', color: '#FF0033' }}
                            animationType="pop"
                            strokeColor="white"
                        />
                    </CameraShake>
                </Sequence>
            </Sequence>

            {/* ESCENA 2: THE PAIN (3-7s) - NOISE + STROBE */}
            <Sequence from={3 * fps} durationInFrames={4 * fps}>
                <AbsoluteFill style={{ background: '#111' }}>
                    <Img
                        src={staticFile('chaos_appointment_book.jpg')}
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            filter: 'grayscale(1) contrast(3) invert(1)', // Inverted for brutal look
                            opacity: 0.5
                        }}
                    />
                    <FilmGrain opacity={0.3} />
                    <Sequence from={10}>
                        <AnimatedText text="EL PAPEL" fontSize={90} style={{ top: '25%' }} color="white" />
                    </Sequence>
                    <Sequence from={40}>
                        <AnimatedText text="TE HACE VER" fontSize={80} style={{ top: '40%' }} color="#CCC" />
                    </Sequence>
                    <Sequence from={70}>
                        <CameraShake intensity={10}>
                            <ChromaticAberration offset={10}>
                                <AnimatedText
                                    text="POBRE."
                                    fontSize={180}
                                    style={{ top: '55%', fontFamily: 'Impact', letterSpacing: '-5px' }}
                                    color="#FF0033"
                                />
                            </ChromaticAberration>
                        </CameraShake>
                    </Sequence>
                </AbsoluteFill>
            </Sequence>

            {/* ESCENA 3: THE MACHINE (7-15s) - LIGHT LEAKS + PARALLAX */}
            <Sequence from={7 * fps} durationInFrames={8 * fps}>
                <AbsoluteFill style={{ background: 'linear-gradient(to bottom, #001, #002)' }}>
                    <Sequence from={0} durationInFrames={15}>
                        <AbsoluteFill style={{ background: 'white' }} /> {/* Flash transition */}
                    </Sequence>

                    <Sequence from={5}>
                        <LightLeak />
                        <Img
                            src={staticFile('dashboard-mockup.png')}
                            style={{
                                width: '110%', height: 'auto', position: 'absolute', left: '-5%', top: '20%',
                                filter: 'drop-shadow(0 0 50px rgba(0,255,100,0.4))',
                                transform: `perspective(1000px) rotateY(${interpolate(frame, [210, 450], [-10, 10])}deg)`
                            }}
                        />
                        <Sequence from={20}>
                            <AnimatedText
                                text="LA MÁQUINA"
                                fontSize={100}
                                style={{ top: '15%', textShadow: '0 0 20px #00FF88' }}
                                color="#00FF88"
                            />
                        </Sequence>
                        <Sequence from={50}>
                            <AnimatedText
                                text="DE HACER DINERO"
                                fontSize={80}
                                style={{ bottom: '25%' }}
                                color="white"
                            />
                        </Sequence>
                    </Sequence>
                </AbsoluteFill>
            </Sequence>

            {/* ESCENA 4: SPEED RAMPING (15-25s) */}
            <Sequence from={15 * fps} durationInFrames={10 * fps}>
                {/* Simulating speed ramp by cutting clips differently or using rate (requires remotion v4 usually, but we can fake with cuts) */}
                {/* Fast Cut 1 */}
                <Sequence from={0} durationInFrames={30}>
                    <Video src={staticFile('video_busy_shop.mp4')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted startFrom={0} playbackRate={2} />
                    <AnimatedText text="MIENTRAS" fontSize={90} style={{ top: '20%' }} />
                </Sequence>
                {/* Slow Cut 2 */}
                <Sequence from={30} durationInFrames={60}>
                    <Video src={staticFile('video_busy_shop.mp4')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'hue-rotate(20deg)' }} muted startFrom={60} playbackRate={0.5} />
                    <CameraShake intensity={2}>
                        <AnimatedText text="DORMÍS..." fontSize={90} style={{ top: '40%' }} />
                    </CameraShake>
                </Sequence>
                {/* Fast Cut 3 */}
                <Sequence from={90}>
                    <Video src={staticFile('video_busy_shop.mp4')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted startFrom={90} playbackRate={2} />
                    <ChromaticAberration offset={3}>
                        <AnimatedText text="ELLOS PAGAN 💸" fontSize={100} style={{ top: '60%' }} color="#FFD700" />
                    </ChromaticAberration>
                </Sequence>
            </Sequence>

            {/* ESCENA 5: DOMINÁ TU ZONA (25-33s) */}
            <Sequence from={25 * fps} durationInFrames={8 * fps}>
                <Video
                    src={staticFile('video_mafioso_barber.mp4')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) brightness(0.5)' }}
                    muted
                    startFrom={100}
                />
                <FilmGrain opacity={0.2} />
                <CameraShake intensity={3}>
                    <AnimatedText text="DOMINÁ" fontSize={140} style={{ top: '20%' }} color="white" />
                    <AnimatedText text="TU ZONA" fontSize={140} style={{ top: '38%' }} color="#FF0033" />
                </CameraShake>
            </Sequence>

            {/* ESCENA 6: GOD MODE CTA (33-40s) */}
            <Sequence from={33 * fps} durationInFrames={7 * fps}>
                <AbsoluteFill style={{ backgroundColor: 'black' }}>
                    <LightLeak />
                    <Sequence from={0} durationInFrames={5}>
                        <AbsoluteFill style={{ background: 'white' }} />
                    </Sequence>

                    <Sequence from={5}>
                        <AnimatedText text="CONSTRUÍ" fontSize={60} style={{ top: '15%' }} color="#888" />
                        <AnimatedText text="TU IMPERIO" fontSize={100} style={{ top: '23%' }} color="white" />

                        <div style={{
                            position: 'absolute', top: '55%', width: '100%', textAlign: 'center',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            zIndex: 100
                        }}>
                            <CameraShake intensity={2}>
                                <h2 style={{
                                    color: '#FFD700', fontSize: 40, margin: 0,
                                    textShadow: '0 0 30px #FFD700'
                                }}>
                                    www.patagoniaautomatiza.com
                                </h2>
                            </CameraShake>
                        </div>
                    </Sequence>
                </AbsoluteFill>
            </Sequence>

            {/* OVERLAY */}
            <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 1000 }}>
                <div style={{
                    position: 'absolute', bottom: 30, width: '100%', textAlign: 'center',
                    color: 'rgba(255,255,255,0.3)', fontSize: 14, letterSpacing: 5
                }}>
                    GOD MODE ACTIVATED
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
