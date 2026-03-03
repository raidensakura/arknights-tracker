/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--color-bg-base)',
        surface: 'var(--color-bg-surface)',
        'surface-hover': 'var(--color-bg-surface-hover)',
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        line: 'var(--color-border)',
        accent: 'var(--color-accent)',
      }
    }
  },

  plugins: []
};
