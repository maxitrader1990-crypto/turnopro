
import React from 'react';
import { AbsoluteFill, Sequence, Img, useVideoConfig, staticFile, Video, interpolate, useCurrentFrame, Easing } from 'remotion';
import { AnimatedText } from './components/AnimatedText';
import { WhatsAppChat } from './components/WhatsAppChat';
import { CameraShake } from './components/CameraShake';

export const MarketingVideoV3: React.FC = () => {
    const { fps, durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();

    // Zoom Digital Effect helper
    const zoomEffect = (scaleFrom: number, scaleTo: number) => {
        return interpolate(frame, [0, durationInFrames], [scaleFrom, scaleTo], {
            extrapolateRight: 'clamp',
            easing: Easing.linear
        });
    };

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>

            {/* ESCENA 1: HOOK VISUAL (0-2.5s) - Mafioso Intro */}
            <Sequence from={0} durationInFrames={2.5 * fps}>
                <AbsoluteFill>
                    <Video
                        src={staticFile('video_mafioso_barber.mp4')}
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            transform: `scale(${interpolate(frame, [0, 2.5 * fps], [1, 1.15])})`
                        }}
                        muted
                    />
                    <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
                    <AnimatedText
                        text="BARBEROS..."
                        fontSize={110}
                        style={{ top: '40%' }}
                        animationType="pop"
                    />
                </AbsoluteFill>
            </Sequence>

            {/* ESCENA 2: GANCHO (2.5-6s) */}
            <Sequence from={2.5 * fps} durationInFrames={3.5 * fps}>
                <Sequence from={0} durationInFrames={1.5 * fps}>
                    <Video
                        src={staticFile('video_busy_shop.mp4')} // Reusing busy shop for "cutting hair" context if generic
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.8)' }}
                        muted
                        startFrom={10}
                    />
                    <AnimatedText text="SI NO TENÉS AGENDA" fontSize={75} style={{ top: '25%' }} color="#FF4444" />
                    <AnimatedText text="ONLINE EN 2026..." fontSize={75} style={{ top: '40%' }} startFrame={10} />
                </Sequence>
                <Sequence from={1.5 * fps} durationInFrames={2 * fps}>
                    <Video
                        src={staticFile('video_busy_shop.mp4')} // Jump cut
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.4) contrast(1.2)' }}
                        muted
                        startFrom={60}
                    />
                    <CameraShake intensity={5}>
                        <AnimatedText text="ESTÁS REGALANDO" fontSize={90} style={{ top: '35%' }} color="white" strokeColor="red" />
                        <AnimatedText text="CLIENTES." fontSize={120} style={{ top: '50%' }} startFrame={5} color="red" strokeColor="white" />
                    </CameraShake>
                </Sequence>
            </Sequence>

            {/* ESCENA 3: PROBLEMA WHATSAPP (6-12s) */}
            <Sequence from={6 * fps} durationInFrames={6 * fps}>
                <WhatsAppChat messages={[
                    { id: 1, text: "tenés turno hoy?", isSender: false, startFrame: 0 },
                    { id: 2, text: "cuánto cobrás?", isSender: false, startFrame: 20 },
                    { id: 3, text: "me confirmás?", isSender: false, startFrame: 40 },
                    { id: 4, text: "Estás ahí?", isSender: false, startFrame: 60 },
                ]} />
                <Sequence from={30}>
                    <AnimatedText text="TE PREGUNTAN..." fontSize={70} style={{ top: '15%', zIndex: 20 }} strokeColor="black" />
                </Sequence>
                <Sequence from={60}>
                    <AnimatedText text="TARDÁS EN RESPONDER..." fontSize={60} style={{ bottom: '15%', zIndex: 20 }} color="#FF4444" strokeColor="black" />
                </Sequence>
                <Sequence from={90}>
                    <AnimatedText text="SE VAN CON OTRO." fontSize={70} style={{ top: '50%', zIndex: 20, transform: 'rotate(-5deg)' }} color="red" />
                </Sequence>
            </Sequence>

            {/* ESCENA 4: CANCELACIÓN = PLATA PERDIDA (12-18s) */}
            <Sequence from={12 * fps} durationInFrames={6 * fps}>
                <Sequence from={0} durationInFrames={2 * fps}>
                    <AbsoluteFill style={{ background: '#ECE5DD' }}>
                        <WhatsAppChat messages={[
                            { id: 5, text: "bro no voy hoy", isSender: false, startFrame: 0 },
                            { id: 6, text: "se me complicó", isSender: false, startFrame: 15 },
                        ]} />
                    </AbsoluteFill>
                </Sequence>
                <Sequence from={2 * fps} durationInFrames={4 * fps}>
                    <Video
                        src={staticFile('video_empty_chair.mp4')}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4) grayscale(1)' }}
                        muted
                    />
                    <AnimatedText text="CANCELACIÓN =" fontSize={70} style={{ top: '30%' }} />
                    <AnimatedText text="TURNO PERDIDO 💸" fontSize={70} style={{ top: '45%' }} color="#FF4444" startFrame={10} />
                </Sequence>
            </Sequence>

            {/* ESCENA 5: SOLUCIÓN (18-30s) */}
            <Sequence from={18 * fps} durationInFrames={12 * fps}>
                <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' }}>
                    <Img
                        src={staticFile('booking-mockup.png')}
                        style={{
                            width: '85%', height: 'auto', position: 'absolute', left: '7.5%', top: '20%',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            transform: `translateY(${interpolate(frame, [0, 300], [0, -50])}px)`
                        }}
                    />
                    <Sequence from={10} durationInFrames={50}>
                        <AnimatedText text="SISTEMA AUTOMÁTICO" fontSize={60} style={{ top: '10%' }} animationType="slide" />
                    </Sequence>
                    <Sequence from={60} durationInFrames={50}>
                        <AnimatedText text="RESERVA SOLO" fontSize={60} style={{ bottom: '30%' }} animationType="pop" color="#4CAF50" />
                    </Sequence>
                    <Sequence from={110} durationInFrames={50}>
                        <AnimatedText text="CONFIRMACIÓN AUTO" fontSize={55} style={{ bottom: '20%' }} animationType="pop" />
                    </Sequence>
                    <Sequence from={160}>
                        <AnimatedText text="RECORDATORIOS" fontSize={60} style={{ bottom: '10%' }} animationType="pop" color="#FFD700" />
                    </Sequence>
                </AbsoluteFill>
            </Sequence>

            {/* ESCENA 6: BENEFICIOS (30-38s) */}
            <Sequence from={30 * fps} durationInFrames={8 * fps}>
                <Video
                    src={staticFile('video_busy_shop.mp4')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    startFrom={150}
                />
                <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />

                <div style={{ position: 'absolute', top: '20%', width: '100%', paddingLeft: 50 }}>
                    <Sequence from={0}><h1 style={{ color: 'white', fontSize: 60, fontFamily: 'Montserrat', margin: 0 }}>✅ MENOS MENSAJES</h1></Sequence>
                    <Sequence from={20}><h1 style={{ color: 'white', fontSize: 60, fontFamily: 'Montserrat', margin: 0 }}>✅ CERO STRESS</h1></Sequence>
                    <Sequence from={40}><h1 style={{ color: 'white', fontSize: 60, fontFamily: 'Montserrat', margin: 0 }}>✅ AGENDA LLENA</h1></Sequence>
                    <Sequence from={60}><h1 style={{ color: '#FFD700', fontSize: 70, fontFamily: 'Montserrat', margin: 0, marginTop: 20 }}>💰 MÁS PLATA</h1></Sequence>
                </div>
            </Sequence>

            {/* ESCENA 7: CTA (38-45s) */}
            <Sequence from={38 * fps} durationInFrames={7 * fps}>
                <AbsoluteFill style={{ backgroundColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CameraShake intensity={2}>
                        <AnimatedText text="MANDAME:" fontSize={60} style={{ top: '25%' }} />
                        <AnimatedText text="BARBER" fontSize={150} style={{ top: '35%' }} color="#FFD700" animationType="pop" />
                        <AnimatedText text="Y TE LO MUESTRO" fontSize={50} style={{ bottom: '25%' }} />
                    </CameraShake>
                </AbsoluteFill>
            </Sequence>

            {/* OVERLAY PERMANENTE */}
            <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                <div style={{
                    position: 'absolute', top: 30, width: '100%', textAlign: 'center',
                    color: 'rgba(255,255,255,0.4)', fontSize: 20, fontFamily: 'sans-serif', fontWeight: 'bold', letterSpacing: 2
                }}>
                    ESTO ES PARA BARBEROS
                </div>
            </AbsoluteFill>

        </AbsoluteFill>
    );
};
