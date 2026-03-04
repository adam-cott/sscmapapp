/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        'ssc-blue': '#0170B9',
        'ssc-blue-dark': '#015a96',
        'ssc-blue-light': '#e6f2fb',
        'ssc-dark': '#0f172a',
        'ssc-bg': '#f0f4f8',
        food: '#e8440a',
        entertainment: '#7c3aed',
        services: '#0170B9',
        retail: '#d97706',
        health: '#059669',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08)',
        'modal': '0 20px 60px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
