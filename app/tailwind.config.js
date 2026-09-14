/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // App do cliente (dark mode apetitoso)
        brand:  { DEFAULT: '#FF4D2E', dark: '#E63E20' },   // vermelho-alaranjado
        gold:   { DEFAULT: '#FFC93C', dark: '#F0B429' },   // ouro / conversão
        night:  { DEFAULT: '#121214', card: '#1C1C21', line: '#2A2A31' },
        // Painel admin (light corporativo)
        panel:  { bg: '#F5F6F8', card: '#FFFFFF', ink: '#1A1A1E', sub: '#6B7280', line: '#E5E7EB' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
