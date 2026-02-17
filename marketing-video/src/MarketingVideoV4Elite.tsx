
import React from 'react';
import { AbsoluteFill, Sequence, Img, useVideoConfig, staticFile, Video, interpolate, useCurrentFrame, Easing } from 'remotion';
import { AnimatedText } from './components/AnimatedText';
import { CinematicWrapper } from './components/CinematicWrapper';
import { CameraShake } from './components/CameraShake';

export const MarketingVideoV4Elite: React.FC = () => {
    const { fps, durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();

    return (
        <CinematicWrapper>
            <AbsoluteFill style={{ backgroundColor: '#050505' }}>

                {/* ESCENA 1: THE THREAT (0-3s) - "TU NEGOCIO ESTÁ EN PELIGRO" */}
                {/* Mafioso clip, slow zoom, glitchy text */}
                <Sequence from={0} durationInFrames={3 * fps}>
                    <AbsoluteFill>
                        <Video
                            src={staticFile('video_mafioso_barber.mp4')}
                            style={{
                                width: '100%', height: '100%', objectFit: 'cover',
                                filter: 'contrast(1.3) grayscale(0.2)',
                                transform: `scale(${interpolate(frame, [0, 3 * fps], [1.1, 1.25])})` // Aggressive slow zoom
                            }}
                            muted
                        />
                        <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} /> {/* Darker overlay */}
                        <Sequence from={10}>
                            <AnimatedText
                                text="TU NEGOCIO..."
                                fontSize={100}
                                style={{ top: '35%', fontFamily: 'Impact, sans-serif', letterSpacing: '5px' }}
                                animationType="pop"
                                color="#FFFFFF"
                            />
                        </Sequence>
                        <Sequence from={45}>
                            <CameraShake intensity={8}>
                                <AnimatedText
                                    text="ESTÁ EN PELIGRO"
                                    fontSize={110}
                                    style={{ top: '50%', fontFamily: 'Impact, sans-serif', color: '#FF3333' }}
                                    animationType="pop"
                                />
                            </CameraShake>
                        </Sequence>
                    </AbsoluteFill>
                </Sequence>

                {/* ESCENA 2: THE OLD WAY (3-7s) - "EL PAPEL ES DE POBRES" */}
                {/* Chaos book, black and white to show "old" */}
                <Sequence from={3 * fps} durationInFrames={4 * fps}>
                    <AbsoluteFill style={{ background: '#1a1a1a' }}>
                        <Img
                            src={staticFile('chaos_appointment_book.jpg')}
                            style={{
                                width: '100%', height: '100%', objectFit: 'cover',
                                filter: 'grayscale(1) contrast(2) brightness(0.6)'
                            }}
                        />
                        <Sequence from={0} durationInFrames={60}>
                            <AnimatedText text="EL PAPEL TE HACE VER..." fontSize={70} style={{ top: '30%' }} color="#CCC" />
                        </Sequence>
                        <Sequence from={60}>
                            <CameraShake intensity={5}>
                                <AnimatedText
                                    text="POBRE."
                                    fontSize={160}
                                    style={{ top: '45%', fontFamily: 'Impact', textTransform: 'uppercase' }}
                                    color="white" strokeColor="black"
                                />
                            </CameraShake>
                        </Sequence>
                    </AbsoluteFill>
                </Sequence>

                {/* ESCENA 3: THE REVELATION (7-15s) - "LA MÁQUINA DE DINERO" */}
                {/* Tech transition, smooth mockups, "Matrix" code vibes? */}
                <Sequence from={7 * fps} durationInFrames={8 * fps}>
                    {/* Flash intro */}
                    <Sequence from={0} durationInFrames={5}>
                        <AbsoluteFill style={{ background: 'white' }} />
                    </Sequence>
                    <Sequence from={3}>
                        <AbsoluteFill style={{ background: 'linear-gradient(to bottom, #000000, #111111)' }}>
                            <Img
                                src={staticFile('dashboard-mockup.png')}
                                style={{
                                    width: '100%', height: 'auto', position: 'absolute', top: '25%',
                                    filter: 'drop-shadow(0 0 20px rgba(0,255,100,0.3))',
                                    transform: `perspective(1000px) rotateX(10deg) translateY(${interpolate(frame, [210, 450], [20, -20])}px)`
                                }}
                            />
                            <Sequence from={10}>
                                <AnimatedText text="LA MÁQUINA" fontSize={90} style={{ top: '15%' }} color="#00FF88" />
                            </Sequence>
                            <Sequence from={40}>
                                <AnimatedText text="DE HACER DINERO" fontSize={80} style={{ bottom: '25%' }} color="white" />
                            </Sequence>
                            {/* Floating "Money" emojis or particles? Let's stick to clean power */}
                        </AbsoluteFill>
                    </Sequence>
                </Sequence>

                {/* ESCENA 4: THE RESULT (15-25s) - "MIENTRAS DORMÍS, ELLOS RESERVAN" */}
                {/* Busy shop, happy vibes */}
                <Sequence from={15 * fps} durationInFrames={10 * fps}>
                    <Video
                        src={staticFile('video_busy_shop.mp4')}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        startFrom={50}
                    />
                    <AbsoluteFill style={{ background: 'rgba(0,0,0,0.4)' }} />

                    <Sequence from={0} durationInFrames={90}>
                        <AnimatedText text="MIENTRAS VOS DORMÍS..." fontSize={70} style={{ top: '20%' }} />
                    </Sequence>
                    <Sequence from={90}>
                        <AnimatedText text="ELLOS RESERVAN 💸" fontSize={80} style={{ top: '60%' }} color="#FFD700" />
                    </Sequence>
                </Sequence>

                {/* ESCENA 5: DOMINATION (25-33s) - "DOMINÁ TU ZONA" */}
                <Sequence from={25 * fps} durationInFrames={8 * fps}>
                    <Video
                        src={staticFile('video_barber_viral.mp4')} // Use intro video again but later part or different cut
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }}
                        muted
                        startFrom={150}
                    />
                    <AbsoluteFill style={{ background: 'rgba(50,0,0,0.3)' }} /> {/* Dark red tint */}
                    <CameraShake intensity={2}>
                        <AnimatedText text="DOMINÁ" fontSize={140} style={{ top: '20%', fontFamily: 'Impact' }} />
                        <AnimatedText text="TU ZONA" fontSize={140} style={{ top: '38%', fontFamily: 'Impact' }} color="#FF3333" />
                    </CameraShake>
                </Sequence>

                {/* ESCENA 6: CTA (33-40s) - "CONSTRUÍ TU IMPERIO" + WEB */}
                <Sequence from={33 * fps} durationInFrames={7 * fps}>
                    <AbsoluteFill style={{ backgroundColor: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Subtle background pulse */}
                        <AbsoluteFill style={{
                            background: 'radial-gradient(circle, #222 0%, #000 70%)',
                            animation: 'pulse 2s infinite'
                        }} />

                        <Sequence from={0}>
                            <AnimatedText text="CONSTRUÍ" fontSize={60} style={{ top: '15%' }} color="#888" />
                            <AnimatedText text="TU IMPERIO" fontSize={100} style={{ top: '23%' }} color="white" />
                        </Sequence>

                        <Sequence from={60}>
                            <div style={{
                                position: 'absolute', top: '55%', width: '100%', textAlign: 'center',
                                display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}>
                                <h2 style={{ color: '#FFD700', fontSize: 50, margin: 0, fontFamily: 'sans-serif' }}>VISITÁ AHORA:</h2>
                                <h1 style={{
                                    color: 'white', fontSize: 55, margin: '20px 0', fontFamily: 'Montserrat, sans-serif', fontWeight: 900,
                                    textShadow: '0 0 20px rgba(255,255,255,0.5)',
                                    background: 'black', padding: '10px 20px', border: '2px solid white'
                                }}>
                                    www.patagoniaautomatiza.com
                                </h1>
                            </div>
                        </Sequence>
                    </AbsoluteFill>
                </Sequence>

                {/* OVERLAY PERMANENTE (Más sutil en V4) */}
                <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                    <div style={{
                        position: 'absolute', bottom: 40, width: '100%', textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)', fontSize: 16, fontFamily: 'sans-serif', letterSpacing: 4
                    }}>
                        PATAGONIA AUTOMATIZA
                    </div>
                </AbsoluteFill>

            </AbsoluteFill>
        </CinematicWrapper>
    );
};
