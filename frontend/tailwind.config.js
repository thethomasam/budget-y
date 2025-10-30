/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Disable dark mode by using 'media' (only activates if OS is in dark mode)
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#5B6FED',
          dark: '#4A5FDB',
        },
        accent: {
          pink: '#FF6B9D',
          yellow: '#FFC542',
        },
        success: '#4CAF50',
        danger: '#FF5252',
        text: {
          primary: '#14142B',
          secondary: '#6E7191',
        },
        bg: {
          primary: '#F7F7FC',
          card: '#FFFFFF',
        },
        border: '#E1E8ED',
      },
    },
  },
  plugins: [],
}
