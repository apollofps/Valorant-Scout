/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VALORANT-inspired color palette
        valorant: {
          red: '#FF4655',
          darkred: '#BD3944',
          cream: '#ECE8E1',
          dark: '#0F1923',
          darker: '#0A1018',
          gray: '#768079',
          accent: '#FF4655',
        },
        // Custom dark theme
        surface: {
          50: '#1a2332',
          100: '#151c28',
          200: '#111820',
          300: '#0d1319',
          400: '#0a0f14',
        }
      },
      fontFamily: {
        display: ['Tungsten', 'Anton', 'Impact', 'sans-serif'],
        body: ['DIN Next', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #FF4655, 0 0 10px #FF4655' },
          '100%': { boxShadow: '0 0 20px #FF4655, 0 0 30px #FF4655' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(255,70,85,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,70,85,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
}
