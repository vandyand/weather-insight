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
        `[MapPage] Updating selectedDataset to match context:`,
        selectedDataset
      );
      setSelectedDataset(selectedDataset);
    }
  }, [selectedDataset]);

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

  // Map click handler - wrapped in useCallback to prevent recreation on every render
  const handleMapClick = useCallback(
    async (e) => {
      console.log(`[MapPage] Map click handler called, coordinates:`, e.latlng);

      const { lat, lng } = e.latlng;
      console.log(`[MapPage] Processing click at coordinates: ${lat}, ${lng}`);
      setPosition({ lat, lng });
      setError(null);
      setIsLoading(true);

      try {
        console.log(
          `[MapPage] Fetching all weather data for coordinates ${lat}, ${lng}`
        );

        // Create an object to store all dataset results
        const allDatasets = {};
        const availableDatasets = [
          "temperature",
          "precipitation",
          "humidity",
          "wind-speed",
          "cloud-cover",
          "feels-like",
        ];

        // Fetch data for each dataset type
        const dataPromises = availableDatasets.map(async (datasetId) => {
          console.log(
            `[MapPage] Fetching dataset ${datasetId} for coordinates ${lat}, ${lng}`
          );
          const data = await fetchDatasetById(datasetId, { lat, lng });
          return { datasetId, data };
        });

        // Wait for all data to be fetched
        const results = await Promise.all(dataPromises);

        // Process and combine the results
        const combinedData = {
          location: { lat, lng },
          timeSeriesData: [],
        };

        // First, create a map of timestamps
        const timestampMap = {};

        // Process each dataset result
        results.forEach(({ datasetId, data }) => {
          if (data && data.timeSeriesData) {
            // Store the dataset in our collection
            allDatasets[datasetId] = data;

            // For each time series data point
            data.timeSeriesData.forEach((point) => {
              if (!timestampMap[point.timestamp]) {
                timestampMap[point.timestamp] = { timestamp: point.timestamp };
              }

              // Add this dataset's value to the timestamp entry
              timestampMap[point.timestamp][datasetId] = point.value;
            });
          }
        });

        // Convert the map to an array sorted by timestamp
        combinedData.timeSeriesData = Object.values(timestampMap).sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Calculate min and max values for each dataset type for normalization
        const minMaxValues = {};
        availableDatasets.forEach((datasetId) => {
          const values = combinedData.timeSeriesData
            .map((point) => point[datasetId])
            .filter((value) => value !== undefined);

          if (values.length > 0) {
            minMaxValues[datasetId] = {
              min: Math.min(...values),
              max: Math.max(...values),
            };
          }
        });

        // Store the min/max values for use in chart rendering
        combinedData.minMaxValues = minMaxValues;

        console.log(`[MapPage] Combined weather data:`, combinedData);

        setWeatherData({
          ...combinedData,
          allDatasets, // Keep the original datasets too for reference
        });
        setProcessedData(combinedData);
        setIsLoading(false);
      } catch (err) {
        console.error(`[MapPage] Error fetching data:`, err);
        setError(err.message || "Failed to fetch weather data");
        setIsLoading(false);
      }
    },
    [fetchDatasetById]
  );

  // Test function to manually trigger data fetch
  const testFetchData = () => {
    console.log("[MapPage] Manual test fetch triggered");
    if (!selectedDataset) {
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

    const { timeSeriesData, minMaxValues } = weatherData;

    // Define colors for each dataset type
    const colorMap = {
      temperature: "#FF5733", // Orange-red
      precipitation: "#3498DB", // Blue
      humidity: "#2ECC71", // Green
      "wind-speed": "#9B59B6", // Purple
      "cloud-cover": "#7F8C8D", // Gray
      "feels-like": "#F1C40F", // Yellow
    };

    // Get all dataset types present in the data
    const datasetTypes = Object.keys(timeSeriesData[0]).filter(
      (key) => key !== "timestamp"
    );

    // Map each dataset type to a series, applying min-max normalization
    const series = datasetTypes.map((datasetType) => {
      // Get min and max values for this dataset type
      const minMax = minMaxValues[datasetType];

      // Create normalized data points
      const normalizedData = timeSeriesData.map((point) => {
        const timestamp = new Date(point.timestamp).getTime();
        const rawValue = point[datasetType];

        // Skip points with undefined values
        if (rawValue === undefined) return [timestamp, null];

        // Apply min-max normalization if we have valid min/max values
        if (minMax && minMax.max !== minMax.min) {
          const normalizedValue =
            (rawValue - minMax.min) / (minMax.max - minMax.min);
          return [timestamp, normalizedValue];
        }

        // If min equals max (no variation), return 0.5 as normalized value
        return [timestamp, 0.5];
      });

      return {
        name: formatDatasetName(datasetType),
        data: normalizedData,
        color: colorMap[datasetType],
        // Store original values for tooltips
        _original: timeSeriesData.map((point) => [
          new Date(point.timestamp).getTime(),
          point[datasetType] || null,
        ]),
      };
    });

    const options = {
      chart: {
        type: "line",
        zoom: { enabled: false },
        animations: { enabled: true },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      title: {
        text: "Weather Forecast (Normalized Scale)",
        align: "left",
      },
      subtitle: {
        text: "All data series normalized to 0-1 scale for comparison",
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
      yaxis: {
        min: 0,
        max: 1,
        title: {
          text: "Normalized Value (0-1)",
        },
        labels: {
          formatter: function (value) {
            return value.toFixed(1);
          },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (value, { seriesIndex, dataPointIndex, w }) {
            // Use original values for tooltip
            const originalValue =
              w.config.series[seriesIndex]._original[dataPointIndex][1];
            if (originalValue === null) return "N/A";

            const datasetType = datasetTypes[seriesIndex];
            return `${originalValue.toFixed(2)} ${getUnitByDatasetId(
              datasetType
            )}`;
          },
        },
        x: {
          format: "dd MMM yyyy",
        },
      },
      legend: {
        position: "top",
        formatter: function (seriesName, opts) {
          const datasetType = datasetTypes[opts.seriesIndex];
          const minMax = minMaxValues[datasetType];
          if (minMax) {
            return `${seriesName} (${minMax.min.toFixed(
              1
            )}-${minMax.max.toFixed(1)} ${getUnitByDatasetId(datasetType)})`;
          }
          return `${seriesName} (${getUnitByDatasetId(datasetType)})`;
        },
      },
      markers: {
        size: 4,
        hover: {
          size: 6,
        },
      },
      theme: {
        palette: "palette1",
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: "bottom",
              offsetY: 0,
            },
          },
        },
      ],
    };

    return <Chart options={options} series={series} height={350} />;
  };

  // Helper function to format dataset names for display
  const formatDatasetName = (datasetId) => {
    return datasetId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Render data table for time series data
  const renderDataTable = () => {
    if (!weatherData || !weatherData.timeSeriesData) return null;

    const { timeSeriesData } = weatherData;

    // Get all dataset types present in the data
    const datasetTypes = Object.keys(timeSeriesData[0]).filter(
      (key) => key !== "timestamp"
    );

    // Format the date for better readability
    const formattedData = timeSeriesData.map((point) => ({
      ...point,
      formattedDate: new Date(point.timestamp).toLocaleDateString(),
    }));

    return (
      <div className="mt-4">
        <h6>Data Table</h6>
        <div>
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>Date</th>
                {datasetTypes.map((datasetType) => (
                  <th key={datasetType}>
                    {formatDatasetName(datasetType)} (
                    {getUnitByDatasetId(datasetType)})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formattedData.map((point, index) => (
                <tr key={index}>
                  <td>{point.formattedDate}</td>
                  {datasetTypes.map((datasetType) => (
                    <td key={datasetType}>
                      {point[datasetType] !== undefined
                        ? point[datasetType].toFixed(2)
                        : "N/A"}
                    </td>
                  ))}
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
        <div>Render count: {renderCount.current}</div>
        <div>Map initialized: {mapInitialized ? "Yes" : "No"}</div>
        <div>
          Selected coordinates: {position?.lat.toFixed(4)},{" "}
          {position?.lng.toFixed(4)}
        </div>
        <div>Data loading: {isLoading ? "Yes" : "No"}</div>
        <div>Available datasets: {datasets ? datasets.length : 0}</div>
        <Button size="sm" onClick={testFetchData}>
          Test Fetch
        </Button>
      </DebugInfo>

      <MapHeader>
        <Container>
          <Row className="align-items-center">
            <Col md={3}>
              <h5 className="mb-0">Climate Insight Map</h5>
              {isLoading && (
                <span className="text-muted ml-2">
                  <small>Loading...</small>
                </span>
              )}
            </Col>
            <Col md={9} className="text-end">
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
