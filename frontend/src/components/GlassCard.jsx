
import React from 'react';

const GlassCard = ({ children, className = '' }) => {
    return (
        <div className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden ${className}`}>
            {/* Subtle Noise Texture (Optional) */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
