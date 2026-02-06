/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'premium-bg': '#0f0f13',
                'premium-surface': '#1a1a20',
                'premium-card': 'rgba(26, 26, 32, 0.7)',
                'urban-accent': '#f59e0b', // Amber-500 for that golden/urban glow
                'urban-secondary': '#8b5cf6', // Violet for tech/urban vibes
                'text-primary': '#f3f4f6', // Gray-100
                'text-secondary': '#9ca3af', // Gray-400
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Ensure we have a clean font
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                glow: {
                    'from': { boxShadow: '0 0 10px -10px #f59e0b' },
                    'to': { boxShadow: '0 0 20px 5px #f59e0b30' },
                }
            },
        },
    },
    plugins: [],
}
