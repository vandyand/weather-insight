import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Log Mapbox token from window object for debugging
console.log("Using Mapbox token, length:", window.MAPBOX_TOKEN?.length || 0);

// Set Mapbox token for any libraries that need it programmatically
if (window.mapboxgl) {
  window.mapboxgl.accessToken = window.MAPBOX_TOKEN;
  console.log("Set Mapbox GL access token");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
