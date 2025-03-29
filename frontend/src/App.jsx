import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import styled from "styled-components";
import { DatasetProvider } from "./context/DatasetContext";
import MapPage from "./pages/MapPage";
import DatasetsPage from "./pages/DatasetsPage";
import DatasetDetailPage from "./pages/DatasetDetailPage";
import "bootstrap/dist/css/bootstrap.min.css";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MainNav = styled.nav`
  display: flex;
  gap: 1rem;

  a {
    color: white;
    text-decoration: none;
    padding: 0.5rem;
    border-radius: 4px;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const HomePage = () => (
  <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
    <h1>WeatherMap Explorer</h1>
    <p>
      Welcome to our weather data visualization platform. This application
      allows you to explore various weather datasets through interactive maps
      and visualizations.
    </p>

    <div style={{ marginTop: "2rem" }}>
      <h2>Getting Started</h2>
      <p>Choose one of the options below to begin:</p>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <a
          href="/datasets"
          style={{
            display: "block",
            padding: "1rem",
            backgroundColor: "#3498db",
            color: "white",
            borderRadius: "4px",
            textDecoration: "none",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          Browse Datasets
        </a>
        <a
          href="/map"
          style={{
            display: "block",
            padding: "1rem",
            backgroundColor: "#2ecc71",
            color: "white",
            borderRadius: "4px",
            textDecoration: "none",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          Explore Map
        </a>
      </div>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div
    style={{
      padding: "2rem",
      maxWidth: "800px",
      margin: "4rem auto",
      textAlign: "center",
    }}
  >
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <a
      href="/"
      style={{
        display: "inline-block",
        marginTop: "1rem",
        padding: "0.75rem 1.5rem",
        backgroundColor: "#3498db",
        color: "white",
        borderRadius: "4px",
        textDecoration: "none",
        fontWeight: "500",
      }}
    >
      Return to Home
    </a>
  </div>
);

const App = () => {
  return (
    <Router>
      <DatasetProvider>
        <AppContainer>
          <Header>
            <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem 0" }}>
              WeatherMap Explorer
            </h1>
            <MainNav>
              <a href="/">Home</a>
              <a href="/map">Map Explorer</a>
              <a href="/datasets">Datasets</a>
            </MainNav>
          </Header>

          <MainContent>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/datasets" element={<DatasetsPage />} />
              <Route
                path="/datasets/:datasetId"
                element={<DatasetDetailPage />}
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MainContent>
        </AppContainer>
      </DatasetProvider>
    </Router>
  );
};

export default App;
