/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        navy: {
          900: '#08131F', 800: '#0E2337', 700: '#1A3A57', 600: '#27526F',
          500: '#3C6C8C', 400: '#5A88A6', 350: '#7FA3BC', 200: '#B9CDDB', 100: '#DCE7EF',
        },
        signal: { DEFAULT: '#0F7EC4', 700: '#0C6AA6', 100: '#E4F1FA' },
        paper: { DEFAULT: '#FCFBF9', 2: '#F5F3EF' },
        mist: { DEFAULT: '#EAEFF3', 2: '#DCE3E9' },
        hover: '#F2F6F9',
        ink: { 900: '#14181C', 700: '#414A52', 500: '#78838C', 300: '#B3BCC4', 100: '#E6EAEE' },
        forest: { DEFAULT: '#3E7A5E', bg: '#E7F0EB' },
        bordeaux: { DEFAULT: '#C44E4E', bg: '#F8E9E9' },
        mostarda: { DEFAULT: '#8A6F14', bg: '#F8F0DA' },
      },
      borderRadius: {
        lg: '8px',
        md: '5px',
        sm: '3px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(14,35,55,.04)',
        lg: '0 12px 32px rgba(14,35,55,.16)',
      },
      fontSize: {
        '2xs': ['11px', '1.3'],
      },
      transitionTimingFunction: {
        panel: 'cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins: [],
}
