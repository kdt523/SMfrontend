/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          bg: '#f0f0f0',
          main: '#FFDE59', // Bright Yellow
          accent: '#FF5757', // Red/Pink
          blue: '#5CE1E6', // Cyan
          green: '#7ED957', // Green
          purple: '#CB6CE6', // Purple
          dark: '#1a1a1a',
          white: '#ffffff',
        }
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'neo-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
