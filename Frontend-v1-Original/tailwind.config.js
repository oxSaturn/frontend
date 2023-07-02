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
        primary: "#00E8CA",
        secondary: "#7e99b0",
        background: "#232323",
        appBackground: "#021716",
        accent: "#ffda58",
        success: "#07bc0c",
        warning: "#ffda58",
        error: "#ff4141",
        cyan: {
          DEFAULT: "#00E8CA",
        },
      },
      boxShadow: ({ theme }) => ({
        glow: `0 0 10px 0 ${theme("colors.cyan.DEFAULT")}`,
      }),
      backgroundImage: {
        waves: 'url("/images/waves2.svg")',
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
};
