/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          // Dark Mode Tokens (Default)
          bg: '#0B1F44',          // Deep Midnight Navy Blue
          card: '#121B33',        // Deep Navy Card Surface
          surface: '#1A2746',     // Elevated Navy Surface
          divider: '#2A3858',     // Subtle border grey-blue
          border: '#2A3858',      // Default Input & Card Borders
          text: '#F8FAFC',        // Bright Crisp White
          textMuted: '#A7B0C3',   // Slate Grey
          textDim: '#737D92',     // Muted Charcoal Slate
          
          // Accent & Brand Colors
          gold: '#D4AF37',        // Luxury Champagne Gold
          goldLight: '#E0C068',   // Light Gold
          goldWarm: '#B8863B',    // Warm Amber
          goldDark: '#8C6239',    // Deep Amber Bronze
          accent800: 'rgba(212, 175, 55, 0.38)', // Translucent Dark Gold tint
          accent100: '#EAE6D6',   // Off-white Gold tint
          error: '#EF4444',       // Crimson Red

          // Light Mode Tokens
          lightBg: '#FAF8F3',     // Warm Cream White
          lightCard: '#FFFFFF',   // Pure White
          lightSurface: '#F7F9FC',// Soft Off-White
          lightDivider: '#E2E8F0',// Light Grey Border
          lightText: '#1F2937',   // Deep Charcoal Black
          lightTextMuted: '#374151', // Dark Slate
          lightTextDim: '#4B5563',   // Visible Medium Slate
          lightAccent800: '#FEF3C7', // Warm Pale Amber/Gold
          lightAccent100: '#5B2500', // Rich Dark Amber Brown
          lightError: '#DC2626',     // Bright Red
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
};
