/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: undefined,
  theme: {
    extend: {
      colors: {
        "primary": "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        "background": "var(--background)",
        "foreground": "var(--foreground)",
        "card": "var(--card)",
        "card-foreground": "var(--card-foreground)",
        "popover": "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        "secondary": "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        "muted": "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        "accent": "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        "border": "var(--border)",
        "input": "var(--input)",
        "ring": "var(--ring)",
        "ink": "var(--ink)",
        "cream": "var(--cream)",
        "paper": "var(--paper)",
        "hairline": "var(--hairline)",
        "background-light": "#f6f8f6",
        "background-dark": "#0f1419",
        "navy": {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#243b53",
          900: "#1a2938",
          950: "#0f1419",
        },
      },
      fontFamily: {
        "display": ["DM Serif Display", "Georgia", "serif"],
        "sans": ["Plus Jakarta Sans", "Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
