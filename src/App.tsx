import React from "react";
import {ArbitrageCalculator} from "./ArbitrageCalculator";
import './index.css'
import {ThemeProvider} from "./components/theme-provider";

export default function App(){

    return <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ArbitrageCalculator />
    </ThemeProvider>
}
