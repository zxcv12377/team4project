import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const disableStrict = import.meta.env.VITE_DEBUG === "true";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  disableStrict ? (
    <App />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);
