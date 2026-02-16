import { AbsoluteFill, Img, staticFile } from 'remotion';
import React from 'react';

export const TestVideo: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ color: 'white', fontSize: 40, marginBottom: 20 }}>Test de Imágenes</div>

            {/* Test 1: Barbería */}
            <div style={{ width: '80%', height: '30%', marginBottom: 10 }}>
                <Img
                    src={staticFile("modern_urban_barber_shop.jpg")}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            </div>

            <div style={{ color: '#FFD700', fontSize: 30 }}>
                Si ves una imagen arriba, staticFile() funciona ✅
            </div>
        </AbsoluteFill>
    );
};
