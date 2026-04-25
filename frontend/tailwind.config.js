/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007FAF',
        secondary: '#A7D9F4',
        accent: '#0056b3',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        medical: {
          blue: '#007FAF',
          green: '#10b981',
          light: '#E3F2FD',
        }
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

