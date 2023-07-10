import { createTheme } from "@mui/material/styles";

import coreTheme from "./coreTheme";

// Create a theme instance.
const theme = createTheme({
  ...coreTheme,
  palette: {
    ...coreTheme.palette,
    background: {
      default: "#040105",
      paper: "#040105",
    },
    primary: {
      main: "#06d3d7",
    },
    text: {
      primary: "rgba(255, 255, 255, 0.87)",
      secondary: "#7E99B0",
    },
    action: {
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    mode: "dark",
  },
  components: {
    ...coreTheme.components,
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          color: "#fff",
          backgroundColor: "#2A2E3C",
          padding: "0px",
          minWidth: "auto",
          "@media (min-width: 960px)": {
            minWidth: "400px",
          },
        },
        message: {
          padding: "0px",
        },
        action: {
          marginRight: "0px",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: "#FFF !important",
          border: "1px solid #fff",
          borderRadius: "8px",
          color: "#000",
          fontSize: "13px",
        },
      },
    },
  },
});

export default theme;
