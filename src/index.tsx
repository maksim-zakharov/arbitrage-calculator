import {createRoot} from "react-dom/client";
import React from "react";
import {Provider} from "react-redux";
import {HashRouter} from "react-router-dom";
import App from "./App";
import {store} from "./store";


createRoot(document.getElementById('root')!).render(
    // <StrictMode>
    <HashRouter>
        <Provider store={store}>
            <App />
        </Provider>
    </HashRouter>,
    // </StrictMode>,
);
