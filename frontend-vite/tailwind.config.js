/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Based on Figma "Color Tokens" & "Color Atoms"
        // Functional Colors
        primary: {
          DEFAULT: "#0B479D", // Blue/700 from Atoms
          hover: "#083A7E", // Blue/800
          selected: "#062C5E", // Blue/900
        },
        success: {
          DEFAULT: "#16A34A", // Green/600
          hover: "#15803D", // Green/700
          selected: "#166534", // Green/800
        },
        warning: {
          DEFAULT: "#F97316", // Orange/500
          hover: "#EA580C", // Orange/600
          selected: "#C2410C", // Orange/700
        },
        danger: {
          DEFAULT: "#DC2626", // Red/600
          hover: "#B91C1C", // Red/700
          selected: "#991B1B", // Red/800
        },
        // Neutral Colors (Approximation based on Figma and common scales)
        neutral: {
          100: "#FFFFFF", // White
          200: "#F3F4F6", // Approx Gray/100
          300: "#E5E7EB", // Approx Gray/200
          400: "#D1D5DB", // Approx Gray/300
          500: "#9CA3AF", // Approx Gray/400
          600: "#6B7280", // Approx Gray/500
          700: "#4B5563", // Approx Gray/600
          800: "#374151", // Approx Gray/700
          900: "#1F2937", // Approx Gray/800
          1000: "#111827", // Approx Gray/900
          1100: "#000000", // Black
        },
        // Text Colors (Mapping from Figma)
        text: {
          heading: "#111827", // Neutral/1000 (Black)
          "heading-inverted": "#FFFFFF", // Neutral/100 (White)
          body: "#374151", // Neutral/800
          "body-inverted": "#D1D5DB", // Neutral/400
          secondary: "#6B7280", // Neutral/600
          disabled: "#9CA3AF", // Neutral/500
          button: "#FFFFFF", // Neutral/100 (White)
          "button-inverted": "#111827", // Neutral/1000 (Black)
        },
        // Adding Atom Colors directly (example for Blue)
        blue: {
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0B479D", // Used in Primary
          800: "#083A7E", // Used in Primary Hover
          900: "#062C5E", // Used in Primary Selected
        },
        red: {
          // Added Red Atoms
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626", // Used in Danger
          700: "#B91C1C", // Used in Danger Hover
          800: "#991B1B", // Used in Danger Selected
          900: "#7F1D1D",
        },
        orange: {
          // Added Orange Atoms
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316", // Used in Warning
          600: "#EA580C", // Used in Warning Hover
          700: "#C2410C", // Used in Warning Selected
          800: "#9A3412",
          900: "#7C2D12",
        },
        yellow: {
          // Added Yellow Atoms
          100: "#FEF9C3",
          200: "#FEF08A",
          300: "#FDE047",
          400: "#FACC15",
          500: "#EAB308",
          600: "#CA8A04",
          700: "#A16207",
          800: "#854D0E",
          900: "#713F12",
        },
        gray: {
          // Added Gray Atoms
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
        "gray-light": {
          // Added Light Gray Atoms
          100: "#FAFAFA",
          200: "#F5F5F5",
          300: "#E5E5E5",
          400: "#D4D4D4",
          500: "#A3A3A3",
          600: "#737373",
          700: "#525252",
          800: "#404040",
          900: "#262626",
        },
        green: {
          // Added Green Atoms
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#16A34A", // Used in Success
          700: "#15803D", // Used in Success Hover
          800: "#166534", // Used in Success Selected
          900: "#14532D",
        },
      },
      fontSize: {
        // Based on Figma "Typography"
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
        "5xl": ["3rem", { lineHeight: "1" }], // 48px
        "6xl": ["3.75rem", { lineHeight: "1" }], // 60px
        "7xl": ["4.5rem", { lineHeight: "1" }], // 72px
      },
      fontFamily: {
        // Assuming "Inter" is the primary font from the Figma Typography section
        sans: ["Inter", "sans-serif"],
        // Add other font families if specified in Figma
      },
      spacing: {
        // Based on Figma "Space" section (assuming values are in px)
        0: "0",
        1: "4px", // Assuming smallest unit is 4px
        2: "8px", // Extra Small
        3: "12px",
        4: "16px", // Small
        5: "20px",
        6: "24px", // Medium
        8: "32px", // Large
        10: "40px",
        12: "48px",
        16: "64px", // Extra Large
        20: "80px", // Enormous
      },
      borderRadius: {
        // Assuming common values, adjust based on Figma if specific values are defined
        none: "0",
        sm: "0.125rem", // 2px
        DEFAULT: "0.25rem", // 4px
        md: "0.375rem", // 6px
        lg: "0.5rem", // 8px
        xl: "0.75rem", // 12px
        "2xl": "1rem", // 16px
        "3xl": "1.5rem", // 24px
        full: "9999px",
      },
    },
  },
  plugins: [],
};
