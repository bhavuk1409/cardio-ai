/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: '#08090b',
        darkbg2: '#0d0f13',
        panel: '#101318',
        cardline: 'rgba(255, 255, 255, 0.09)',
        signalred: '#e10600',
        signalcyan: '#35dfe6',
        signalgreen: '#43d675',
        signalamber: '#ffb200',
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'SFMono-Regular', 'monospace'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
