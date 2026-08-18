/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6DC926',
          50: '#f0fce4',
          100: '#ddf7c4',
          200: '#bcee8d',
          300: '#92e04e',
          400: '#6DC926',
          500: '#55a81b',
          600: '#408518',
          700: '#326516',
          800: '#295117',
          900: '#244417',
        },
        brown: {
          DEFAULT: '#5C3317',
          50: '#fdf7f0',
          100: '#f9ebdb',
          200: '#f0d4b5',
          300: '#e4b784',
          400: '#d49051',
          500: '#c8732e',
          600: '#b85e24',
          700: '#994a21',
          800: '#7c3d22',
          900: '#5C3317',
        },
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

