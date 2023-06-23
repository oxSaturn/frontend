const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "576px",
      },
      fontFamily: {
        sono: ["Sono", ...defaultTheme.fontFamily.sans],
      },
      backgroundImage: {
        homePage: 'url("/images/s.png")',
      },
      keyframes: {
        titleAnim: {
          "0%": {
            bottom: "-100px",
            opacity: "0",
          },
          "100%": {
            bottom: "0",
            opacity: "1",
          },
        },
        slideLeftAndFade: {
          from: { opacity: 0, transform: "translateX(8px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
      },
      animation: {
        titleAnim: "titleAnim 1s ease 1 forwards",
        slideLeftAndFade:
          "slideLeftAndFade 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      colors: {
        cantoGreen: "#06fc99",
        primary: "#06fc99",
        secondaryGray: "#7e99b0",
        secondary: "#7e99b0",
        primaryBg: "#272826",
        deepBlue: "#212b48",
        deepPurple: "#040105",
        accent: "#ffda58",
        success: "#07bc0c",
        warning: "#ffda58",
        error: "#ff4141",
        cyan: {
          DEFAULT: '#00E8CA',
        }
      },
      boxShadow: {
        glow: "0 0 10px 0 #06fc99",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
};
