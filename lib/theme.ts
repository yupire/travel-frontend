"use client";

import { createTheme } from "@mui/material/styles";

// Brand colors kept in sync with tailwind.config.js (brand.800 = #4caf50)
const theme = createTheme({
  palette: {
    primary: {
      main: "#4caf50",
      light: "#80e27e",
      dark: "#388e3c",
      contrastText: "#ffffff",
    },
    background: {
      default: "#ffffff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "sans-serif",
    ].join(","),
    fontSize: 14,
    body1: { fontSize: "0.95rem" },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#f9fafb",
          borderRadius: 12,
          fontSize: "1rem",
          "& fieldset": {
            borderColor: "#e5e7eb",
          },
          "&:hover fieldset": {
            borderColor: "#9ca3af",
          },
          "&.Mui-focused fieldset": {
            borderWidth: 1,
          },
        },
        input: {
          padding: "14px 14px",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.78rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "#6b7280",
          "&.Mui-focused": { color: "#4caf50" },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.95rem",
          minHeight: 48,
        },
      },
    },
  },
});

export default theme;
