// tailwind.config.js
export default {
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                neon: {
                    cyan: '#22d3ee',
                    blue: '#38bdf8',
                    purple: '#a855f7',
                    pink: '#ec4899',
                    green: '#39ff14',
                },
                dark: {
                    900: '#020617',
                    800: '#0f172a',
                    700: '#1e293b',
                    600: '#334155',
                },
                light: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                },
            },
            boxShadow: {
                neon: '0 0 18px rgba(34, 211, 238, 0.55)',
                neonPurple: '0 0 18px rgba(168, 85, 247, 0.55)',
            },
            backgroundImage: {
                'tech-gradient': 'radial-gradient(circle at top, #1e293b 0%, #020617 55%, #000 100%)',
            },
        },
    },
    plugins: [],
}