import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useDatasetContext } from "../context/DatasetContext";
import Chart from "react-apexcharts";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate, useLocation } from "react-router-dom";

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Styled components
const DebugInfo = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 1000;
  max-width: 300px;
  display: ${(props) => (props.isVisible ? "block" : "none")};
`;

const MapPageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MapHeader = styled.div`
  background-color: #f8f9fa;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MapContent = styled.div`
  flex: 1;
  display: flex;
  position: relative;
`;

const SidePanel = styled.div`
  width: 30%;
  padding: 1rem;
  background-color: #f8f9fa;
  overflow-y: auto;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 1;
`;

const MapSection = styled.div`
  flex: 1;
  z-index: 0;
`;

const StyledMapContainer = styled(MapContainer)`
  height: 100%;
  width: 100%;
`;

const NoSelection = styled.div`
  margin: 2rem;
  padding: 2rem;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// Component to handle map click events
// This is a better approach than using whenCreated
const MapEventHandler = ({ onMapClick }) => {
  console.log("[MapEventHandler] Initializing map event handler");

  // Get direct reference to the map instance
  const map = useMap();
  console.log("[MapEventHandler] Got map reference:", !!map);

  // Set up event listeners using useMapEvents
  useMapEvents({
    click: (e) => {
      console.log("[MapEventHandler] Map click detected at:", e.latlng);
      onMapClick(e);
    },
  });

  // Log when the component mounts
  useEffect(() => {
    console.log("[MapEventHandler] Component mounted and attached to map");

    // Verify Leaflet is working by adding a direct event handler too
    map.on("click", (e) => {
      console.log(
        "[MapEventHandler] Native Leaflet click detected at:",
        e.latlng
      );
    });

    return () => {
      console.log("[MapEventHandler] Component unmounting, cleaning up");
      // Clean up event if needed
      map.off("click");
    };
  }, [map]);

  return null; // This component doesn't render anything
};

const MapPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;

  // Check if dev mode is enabled via URL parameter
  const isDevMode = new URLSearchParams(search).get("dev") === "true";

  const {
    datasets,
    selectedDataset,
    setSelectedDataset,
    fetchDatasetById,
    isLoading: isDatasetLoading,
  } = useDatasetContext();

  // State for the map
  const [position, setPosition] = useState({ lat: 51.505, lng: -0.09 });
  const [weatherData, setWeatherData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [activeDatasetId, setActiveDatasetId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Rendering counter for debugging
  const renderCount = useRef(0);
  renderCount.current += 1;

  // Log Mapbox token info on mount
  useEffect(() => {
    console.log("[MapPage] Component mounted with Mapbox token status:");
    console.log("Token exists:", !!window.MAPBOX_TOKEN);
    console.log("Token length:", window.MAPBOX_TOKEN?.length || 0);
    console.log(
      "Token first 10 chars:",
      window.MAPBOX_TOKEN?.substring(0, 10) || "missing"
    );

    // Check for dataset in URL params
    const params = new URLSearchParams(location.search);
    const datasetParam = params.get("dataset");
    if (datasetParam) {
      console.log(`[MapPage] Found dataset in URL: ${datasetParam}`);
      setActiveDatasetId(datasetParam);
      setSelectedDataset(datasetParam);
    }
  }, [location.search, setSelectedDataset]);

  // Sync internal state with context
  useEffect(() => {
    renderCount.current += 1;
    console.log(
      `[MapPage] Render #${renderCount.current}, selectedDataset from context:`,
      selectedDataset
    );

    if (selectedDataset) {
      console.log(
        `[MapPage] Updating activeDatasetId to match context:`,
        selectedDataset
      );
      setActiveDatasetId(selectedDataset);
    }
  }, [selectedDataset]);

  // Log dataset changes
  useEffect(() => {
    console.log(`[MapPage] activeDatasetId changed to:`, activeDatasetId);
  }, [activeDatasetId]);

  // Initialize map when component mounts - keep for compatibility
  const handleMapInit = useCallback((map) => {
    console.log("[MapPage] Map initialized via whenCreated");
    mapRef.current = map;
    setMapInitialized(true);

    // We're now using the MapEventHandler component instead
    // But keeping this for debugging purposes
    map.on("click", (e) => {
      console.log(
        "[MapPage] Direct map click detected via whenCreated handler"
      );
    });
  }, []);

  // Dataset selection handler
  const handleDatasetChange = (e) => {
    const newDatasetId = e.target.value;
    console.log(`[MapPage] Dataset changed in dropdown to:`, newDatasetId);

    // Update internal state immediately
    setActiveDatasetId(newDatasetId);

    // Update URL
    navigate(`/map?dataset=${newDatasetId}`);

    // Then update context (async)
    setSelectedDataset(newDatasetId);
  };

  // Map click handler - wrapped in useCallback to prevent recreation on every render
  const handleMapClick = useCallback(
    async (e) => {
      console.log(`[MapPage] Map click handler called, coordinates:`, e.latlng);
      console.log(`[MapPage] Current activeDatasetId:`, activeDatasetId);

      if (!activeDatasetId) {
        console.log(
          `[MapPage] ⚠️ No dataset selected (activeDatasetId is empty)`
        );
        setError("Please select a dataset first");
        return;
      }

      const { lat, lng } = e.latlng;
      console.log(`[MapPage] Processing click at coordinates: ${lat}, ${lng}`);
      setPosition({ lat, lng });
      setError(null);
      setIsLoading(true);

      try {
        console.log(
          `[MapPage] Fetching dataset ${activeDatasetId} for coordinates ${lat}, ${lng}`
        );
        console.log(
          "[MapPage] Calling fetchDatasetById with:",
          activeDatasetId,
          { lat, lng }
        );

        const data = await fetchDatasetById(activeDatasetId, { lat, lng });
        console.log(`[MapPage] Dataset fetch result:`, data);

        if (!data || !data.timeSeriesData) {
          throw new Error("Failed to fetch weather data");
        }

        setWeatherData(data);
        setProcessedData(data);
        setIsLoading(false);
      } catch (err) {
        console.error(`[MapPage] Error fetching data:`, err);
        setError(err.message || "Failed to fetch weather data");
        setIsLoading(false);
      }
    },
    [activeDatasetId, fetchDatasetById]
  );

  // Test function to manually trigger data fetch
  const testFetchData = () => {
    console.log("[MapPage] Manual test fetch triggered");
    if (!activeDatasetId) {
      alert("Please select a dataset first");
      return;
    }

    const testLocation = { lat: 51.505, lng: -0.09 };
    setPosition(testLocation);

    handleMapClick({ latlng: testLocation });
  };

  // Render chart for time series data
  const renderChart = () => {
    if (!weatherData || !weatherData.timeSeriesData) return null;

    const { timeSeriesData } = weatherData;

    const series = Object.keys(timeSeriesData[0])
      .filter((key) => key !== "timestamp")
      .map((key) => ({
        name: key,
        data: timeSeriesData.map((point) => [
          new Date(point.timestamp).getTime(),
          point[key],
        ]),
      }));

    const options = {
      chart: {
        type: "line",
        zoom: { enabled: false },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      title: {
        text: "Weather Forecast",
        align: "left",
      },
      xaxis: {
        type: "datetime",
        labels: {
          formatter: function (value) {
            return new Date(value).toLocaleDateString();
          },
        },
      },
      tooltip: {
        x: {
          format: "dd MMM yyyy",
        },
      },
    };

    return <Chart options={options} series={series} height={300} />;
  };

  // Render data table for time series data
  const renderDataTable = () => {
    if (!weatherData || !weatherData.timeSeriesData) return null;

    const { timeSeriesData } = weatherData;

    // Format the date for better readability
    const formattedData = timeSeriesData.map((point) => ({
      ...point,
      formattedDate: new Date(point.timestamp).toLocaleDateString(),
    }));

    return (
      <div className="mt-4">
        <h6>Data Table</h6>
        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {formattedData.map((point, index) => (
                <tr key={index}>
                  <td>{point.formattedDate}</td>
                  <td>
                    {point.value.toFixed(2)}{" "}
                    {getUnitByDatasetId(activeDatasetId)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Helper function to get the appropriate unit based on dataset ID
  const getUnitByDatasetId = (datasetId) => {
    switch (datasetId) {
      case "temperature":
      case "feels-like":
        return "°C";
      case "precipitation":
        return "mm";
      case "humidity":
      case "cloud-cover":
        return "%";
      case "wind-speed":
        return "km/h";
      case "uv-index":
        return "";
      default:
        return "";
    }
  };

  return (
    <MapPageContainer>
      {/* Debug information */}
      <DebugInfo isVisible={isDevMode}>
        <div>
          <strong>Debug Info:</strong>
        </div>
        <div>Active Dataset: {activeDatasetId || "none"}</div>
        <div>Context Selected: {selectedDataset || "none"}</div>
        <div>Datasets Count: {datasets?.length || 0}</div>
        <div>Loading: {isLoading ? "true" : "false"}</div>
        <div>Dataset Loading: {isDatasetLoading ? "true" : "false"}</div>
        <div>
          Position:{" "}
          {position
            ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
            : "none"}
        </div>
        <div>Render Count: {renderCount.current}</div>
        <div>Map Initialized: {mapInitialized ? "yes" : "no"}</div>
        <div>Processed Data: {processedData ? "✓" : "✗"}</div>
        <div>
          Mapbox Token:{" "}
          {window.MAPBOX_TOKEN
            ? `${window.MAPBOX_TOKEN.substring(0, 10)}...`
            : "missing"}
        </div>
        <button
          onClick={testFetchData}
          style={{ marginTop: "8px", padding: "4px 8px", fontSize: "12px" }}
        >
          Test Fetch Data
        </button>
      </DebugInfo>

      <MapHeader>
        <Container fluid>
          <Row className="align-items-center">
            <Col md={3}>
              <h4>Weather Map Explorer</h4>
              {isDevMode && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    backgroundColor: "#f0ad4e",
                    color: "#fff",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    marginLeft: "8px",
                  }}
                >
                  DEV MODE
                </span>
              )}
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Select Dataset</Form.Label>
                <Form.Control
                  as="select"
                  value={activeDatasetId}
                  onChange={handleDatasetChange}
                  disabled={isDatasetLoading}
                >
                  <option value="">-- Select Dataset --</option>
                  {datasets &&
                    datasets.map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </option>
                    ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={6} className="text-end">
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/datasets")}
              >
                Back to Datasets
              </Button>
            </Col>
          </Row>
        </Container>
      </MapHeader>

      <MapContent>
        <MapSection>
          <StyledMapContainer
            center={[51.505, -0.09]}
            zoom={13}
            whenCreated={handleMapInit}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {position && (
              <Marker position={[position.lat, position.lng]}>
                <Popup>Weather data for this location</Popup>
              </Marker>
            )}
            {/* Add our event handler component */}
            <MapEventHandler onMapClick={handleMapClick} />
          </StyledMapContainer>
        </MapSection>

        <SidePanel>
          {isLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : !weatherData ? (
            <NoSelection>
              <p>Click on the map to view weather data for that location.</p>
              {!activeDatasetId && (
                <div className="alert alert-warning">
                  Please select a dataset first
                </div>
              )}
            </NoSelection>
          ) : (
            <div>
              <h5>Weather Data</h5>
              <p>
                Location: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </p>
              {renderChart()}
              {renderDataTable()}
              {isDevMode && (
                <div className="mt-4">
                  <h6>Raw Data</h6>
                  <pre
                    className="bg-light p-2"
                    style={{
                      fontSize: "0.8rem",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {JSON.stringify(weatherData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SidePanel>
      </MapContent>

      {!isDevMode && (
        <div
          style={{
            position: "fixed",
            bottom: "5px",
            right: "5px",
            fontSize: "0.6rem",
            color: "#999",
            cursor: "pointer",
          }}
          onClick={() => navigate(`${location.pathname}?dev=true`)}
        >
          Developer Mode
        </div>
      )}
    </MapPageContainer>
  );
};

export default MapPage;
