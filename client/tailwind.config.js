/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Protocol Theme Colors
        protocol: {
          // Dark backgrounds
          darker: "#292929ff", // Main background
          dark: "#353535ff", // Sidebar/panel background
          card: "#3d3d3dff", // Card/elevated background
          border: "#262626", // Subtle borders

          // Accent colors (Emerald/Teal)
          primary: "#FF7518", // Primary accent
          "primary-hover": "#ff5c00", // Hover state
          "primary-light": "#FF7518", // Light variant

          // Text colors
          text: {
            primary: "#FFFFFF", // Headings, important text
            secondary: "#A1A1AA", // Body text
            muted: "#71717A", // Subtle text, placeholders
            disabled: "#52525B", // Disabled state
          },

          // Interactive elements
          input: {
            bg: "#262626", // Input backgrounds
            border: "#374151", // Input borders
            focus: "#FF7518", // Focus border
          },

          // Status colors (adjusted for dark theme)
          success: "#ff5c00",
          error: "#EF4444", // Red for errors
          warning: "#F59E0B",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
