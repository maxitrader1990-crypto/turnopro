import { AbsoluteFill, Sequence, Img, staticFile, interpolate, useCurrentFrame } from 'remotion';
import React from 'react';
import { EliteText } from './components/EliteText';
import { EliteMockup } from './components/EliteMockup';
import { ParticleOverlay } from './components/ParticleOverlay';
import { KenBurnsBackground } from './components/KenBurnsBackground';
import { CinematicOverlay } from './components/CinematicOverlay';
import { CinematicText } from './components/CinematicText';
import { WarpTransition } from './components/WarpTransition';
import { CameraShake } from './components/CameraShake';

// 60s video @ 30fps = 1800 frames total
export const MarketingVideo60s: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* 0:00 - 0:04 (120 frames) - HOOK FUERTE */}
            <Sequence from={0} durationInFrames={120}>
                <WarpTransition direction="in">
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 150 }}>
                        <KenBurnsBackground
                            src={staticFile("modern_urban_barber_shop.jpg")}
                            opacity={0.7}
                            zoom={1.12}
                            direction="in"
                        />
                        <ParticleOverlay count={10} color="#FF4444" />
                        <EliteText
                            text="¿SOS DUEÑO DE UNA BARBERÍA?"
                            color="white"
                            fontSize={60}
                            delay={0}
                            variant="header"
                        />
                        <CameraShake startDelay={20} duration={15} intensity={25}>
                            <EliteText
                                text="¿ESTÁS PERDIENDO GUITA?"
                                color="#FF4444"
                                fontSize={95}
                                delay={20}
                                variant="header"
                                fontWeight={900}
                            />
                        </CameraShake>
                    </AbsoluteFill>
                </WarpTransition>
            </Sequence>

            {/* 0:04 - 0:08 (120 frames) - PROBLEMA REAL con imagen del caos */}
            <Sequence from={120} durationInFrames={120}>
                <WarpTransition direction="in">
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 150 }}>
                        <KenBurnsBackground
                            src={staticFile("chaos_appointment_book.jpg")}
                            opacity={0.6}
                            zoom={1.15}
                            direction="in"
                        />
                        <ParticleOverlay count={8} color="#FF4444" />
                        <EliteText
                            text="Turnos por WhatsApp..."
                            color="white"
                            fontSize={75}
                            delay={0}
                            variant="header"
                        />
                        <CameraShake startDelay={20} duration={10} intensity={15}>
                            <EliteText
                                text="Errores, cancelaciones, quilombo."
                                color="#FF4444"
                                fontSize={85}
                                delay={20}
                                variant="header"
                            />
                        </CameraShake>
                    </AbsoluteFill>
                </WarpTransition>
            </Sequence>

            {/* 0:08 - 0:12 (120 frames) - DROP + SOLUCIÓN + Herramientas doradas sutiles */}
            <Sequence from={240} durationInFrames={120}>
                <WarpTransition direction="in">
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                        <KenBurnsBackground
                            src={staticFile("gold_barber_tools.jpg")}
                            opacity={0.15}
                            zoom={1.1}
                            direction="out"
                        />
                        <ParticleOverlay count={12} />
                        <CameraShake startDelay={0} duration={15} intensity={20}>
                            <EliteText
                                text="CORTALA CON ESO."
                                color="white"
                                fontSize={105}
                                delay={0}
                                variant="header"
                            />
                        </CameraShake>
                        <EliteText
                            text="AUTOMATIZÁ TU BARBERÍA."
                            color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                            fontSize={95}
                            delay={15}
                            variant="header"
                            fontWeight={900}
                        />
                    </AbsoluteFill>
                </WarpTransition>
            </Sequence>

            {/* 0:12 - 0:18 (180 frames) - FEATURE 1: RESERVAS con mockup real */}
            <Sequence from={360} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
                    <ParticleOverlay count={10} />
                    <div style={{ marginBottom: 400 }}>
                        <EliteText
                            text="Reservas automáticas 24/7"
                            color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                            fontSize={75}
                            delay={0}
                            variant="header"
                        />
                        <EliteText
                            text="Tu agenda siempre llena 📅"
                            color="white"
                            fontSize={68}
                            delay={15}
                            variant="body"
                        />
                    </div>
                    <Sequence from={25}>
                        <div style={{ position: 'absolute', bottom: -100 }}>
                            <EliteMockup
                                src={staticFile("booking-mockup.png")}
                                delay={0}
                                scale={1.35}
                                rotate3D={true}
                            />
                        </div>
                    </Sequence>
                </AbsoluteFill>
            </Sequence>

            {/* 0:18 - 0:24 (180 frames) - FEATURE 2: CLIENTES con dashboard real */}
            <Sequence from={540} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                    <KenBurnsBackground
                        src={staticFile("dashboard-mockup.png")}
                        opacity={0.25}
                        zoom={1.05}
                        direction="left"
                    />
                    <ParticleOverlay count={15} />
                    <EliteText
                        text="Base de clientes real"
                        color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                        fontSize={85}
                        delay={0}
                        variant="header"
                    />
                    <EliteText
                        text="Historial de cortes y visitas"
                        color="white"
                        fontSize={68}
                        delay={20}
                        variant="body"
                    />
                </AbsoluteFill>
            </Sequence>

            {/* 0:24 - 0:30 (180 frames) - FEATURE 3: ORGANIZACIÓN con dashboard más visible */}
            <Sequence from={720} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
                    <KenBurnsBackground
                        src={staticFile("dashboard-mockup.png")}
                        opacity={0.3}
                        zoom={1.1}
                        direction="right"
                    />
                    <ParticleOverlay count={12} />
                    <EliteText
                        text="Gestioná tu equipo"
                        color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                        fontSize={90}
                        delay={0}
                        variant="header"
                    />
                    <EliteText
                        text="Control total del negocio"
                        color="white"
                        fontSize={73}
                        delay={20}
                        variant="body"
                    />
                </AbsoluteFill>
            </Sequence>

            {/* 0:30 - 0:36 (180 frames) - FEATURE 4: PAGOS */}
            <Sequence from={900} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                    <ParticleOverlay count={10} />
                    <EliteText
                        text="Pagos y confirmaciones"
                        color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                        fontSize={85}
                        delay={0}
                        variant="header"
                    />
                    <EliteText
                        text="Menos cancelaciones 💳"
                        color="white"
                        fontSize={78}
                        delay={20}
                        variant="body"
                    />
                    <div style={{
                        marginTop: 40,
                        fontSize: 80,
                        color: '#0F0',
                        textShadow: '0 0 20px #0F0'
                    }}>✓</div>
                </AbsoluteFill>
            </Sequence>

            {/* 0:36 - 0:42 (180 frames) - RESULTADO EMOCIONAL con barbería premium */}
            <Sequence from={1080} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <KenBurnsBackground
                        src={staticFile("modern_urban_barber_shop.jpg")}
                        opacity={0.6}
                        zoom={1.15}
                        direction="in"
                    />
                    <ParticleOverlay count={15} color="#0F0" />
                    <EliteText
                        text="MÁS CLIENTES."
                        color="#0F0"
                        fontSize={115}
                        delay={0}
                        glowColor="#0F0"
                        variant="accent"
                    />
                    <EliteText
                        text="MENOS ESTRÉS."
                        color="white"
                        fontSize={115}
                        delay={20}
                        variant="accent"
                    />
                </AbsoluteFill>
            </Sequence>

            {/* 0:42 - 0:48 (180 frames) - TRANSFORMACIÓN */}
            <Sequence from={1260} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
                    <ParticleOverlay count={8} />
                    <EliteText
                        text="Tu barbería pasa de improvisada..."
                        color="white"
                        fontSize={63}
                        delay={0}
                        variant="header"
                    />
                    <EliteText
                        text="a PROFESIONAL."
                        color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                        fontSize={105}
                        delay={25}
                        variant="header"
                        fontWeight={900}
                    />
                </AbsoluteFill>
            </Sequence>

            {/* 0:48 - 0:54 (180 frames) - AUTORIDAD con herramientas doradas */}
            <Sequence from={1440} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                    <KenBurnsBackground
                        src={staticFile("gold_barber_tools.jpg")}
                        opacity={0.35}
                        zoom={1.12}
                        direction="out"
                    />
                    <ParticleOverlay count={18} />
                    <EliteText
                        text="Diseñado para barberías modernas ✂️"
                        color="white"
                        fontSize={63}
                        delay={0}
                        variant="body"
                    />
                    <EliteText
                        text="Simple, rápido y potente."
                        color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                        fontSize={78}
                        delay={20}
                        variant="header"
                    />
                </AbsoluteFill>
            </Sequence>

            {/* 0:54 - 1:00 (180 frames) - CTA FINAL BRUTAL con barbería de fondo */}
            <Sequence from={1620} durationInFrames={180}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                    <KenBurnsBackground
                        src={staticFile("modern_urban_barber_shop.jpg")}
                        opacity={0.5}
                        zoom={1.15}
                        direction="in"
                    />
                    <ParticleOverlay count={20} />
                    <CinematicText
                        text="SUMATE HOY."
                        color="white"
                        fontSize={125}
                        delay={0}
                        variant="accent"
                    />
                    <EliteText
                        text="HACÉ CRECER TU BARBERÍA."
                        color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                        fontSize={83}
                        delay={20}
                        variant="header"
                    />
                    <div style={{
                        marginTop: 55,
                        fontSize: 32, // Adjusted size for URL
                        color: 'white',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        opacity: 0.9,
                        background: 'rgba(0,0,0,0.8)',
                        padding: '15px 35px',
                        borderRadius: 12,
                        border: '2px solid #C9A55A',
                        boxShadow: '0 0 30px rgba(201, 165, 90, 0.4)'
                    }}>
                        www.patagoniaautomatiza.com
                    </div>
                </AbsoluteFill>
            </Sequence>
            <CinematicOverlay />
        </AbsoluteFill >
    );
};
