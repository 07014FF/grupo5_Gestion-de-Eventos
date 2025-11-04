/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00D084',
          50: '#E6FFF5',
          100: '#B3FFE0',
          200: '#80FFCC',
          300: '#4DFFB8',
          400: '#1AFFA3',
          500: '#00D084',
          600: '#00A368',
          700: '#00764C',
          800: '#004A30',
          900: '#001D14',
        },
        dark: {
          DEFAULT: '#0A0E27',
          50: '#1A1E37',
          100: '#141829',
          200: '#0F1320',
          300: '#0A0E1B',
          400: '#070A15',
          500: '#0A0E27',
          600: '#050711',
          700: '#02040A',
          800: '#000000',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: ['System'],
        // Add custom fonts here if needed
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        xxxl: '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '24px',
        round: '9999px',
      },
    },
  },
  plugins: [],
};
