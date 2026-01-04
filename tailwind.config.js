/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Colors - Vibrant Green
        primary: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#34D399',
        },
        secondary: {
          DEFAULT: '#34D399',
          light: '#6EE7B7',
        },
        // Light Mode Theme
        light: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          text: '#0F172A',
        },
        // Dark Mode Theme - Dashboard Redesign (Requirement 9)
        dark: {
          bg: '#0B1120', // Main background
          card: '#1E293B', // Card background
          text: '#F1F5F9',
          border: '#334155',
          surface: '#111827',
        },
        // Gradient Colors for Financial Cards
        balance: {
          from: '#3B82F6',
          to: '#6366F1',
        },
        income: {
          from: '#10B981',
          to: '#34D399',
        },
        expense: {
          from: '#EF4444',
          to: '#F87171',
        },
        // State Colors
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['"Inter"', '"Outfit"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'glow-primary': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
