import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/public-sans/wght.css";
import "@fontsource-variable/source-serif-4/opsz.css";
import "./styles/index.css";
import { App } from "./App";
import { StoreProvider } from "./store/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
