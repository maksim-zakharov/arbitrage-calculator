import React from "react";
import { ArbitrageCalculator } from "./ArbitrageCalculator";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { useAppVersionAutoReload } from "./hooks/useAppVersionAutoReload";

export default function App() {
  useAppVersionAutoReload();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ArbitrageCalculator />
    </ThemeProvider>
  );
}
