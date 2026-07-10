/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#0052CC',
        'medical-blue-dark': '#003d9b',
        'medical-blue-light': '#b2c5ff',
        'status-green': '#008B8B',
        'status-orange': '#F59E0B',
        'status-red': '#ba1a1a',
        'status-green-light': '#d1fae5',
        'bg-light': '#F4F7FA',
        'surface': '#faf8ff',
        'surface-dim': '#d9d9e4',
        'surface-container': '#ededf8',
        'surface-container-low': '#f3f3fd',
        'surface-container-high': '#e7e7f2',
        'surface-container-highest': '#e1e2ec',
        'outline': '#737685',
        'outline-variant': '#c3c6d6',
        'on-surface': '#191b23',
        'on-surface-variant': '#434654',
      }
    },
  },
  plugins: [],
}
