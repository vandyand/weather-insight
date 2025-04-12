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
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

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
  overflow: hidden; /* Prevent scrollbars when resizing */
`;

// Style for the resizable panel system
const StyledPanelGroup = styled(PanelGroup)`
  width: 100%;
  height: 100%;
`;

// Style for the resize handle
const StyledResizeHandle = styled(PanelResizeHandle)`
  width: 8px;
  background-color: #ddd;
  position: relative;
  cursor: col-resize;
  transition: background-color 0.2s;

  &:hover {
    background-color: #aaa;
  }

  &::after {
    content: "";
    position: absolute;
    left: 2px;
    top: 50%;
    height: 30px;
    width: 4px;
    margin-top: -15px;
    border-left: 1px solid #999;
    border-right: 1px solid #999;
  }
`;

// Side panel for displaying data
const SidePanel = styled.div`
  padding: 1rem;
  background-color: #f8f9fa;
  overflow-y: auto;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  height: 100%;
`;

// Map container
const MapSection = styled.div`
  height: 100%;
  width: 100%;
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

// Styling for the unit toggle
const UnitToggleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 6px 8px;
  border: 1px solid #dee2e6;
  justify-content: space-between;
`;

const UnitToggleLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
  margin-right: 8px;
`;

const ToggleSwitch = styled(Form.Check)`
  .form-check-input {
    height: 1.25rem;
    width: 2.5rem;
    cursor: pointer;

    &:checked {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
  }
`;

// Style for date control container
const DateControlContainer = styled.div`
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 15px;
  border: 1px solid #dee2e6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const DateLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
  margin-bottom: 5px;
`;

const DateInput = styled(Form.Control)`
  border-radius: 6px;
  border: 1px solid #ced4da;
  padding: 0.375rem 0.75rem;

  &:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
`;

const DateHelpText = styled.p`
  font-size: 0.8rem;
  color: #6c757d;
  margin-left: 15px;
  margin-bottom: 0;
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

const LoadingIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  color: #6c757d;
  font-size: 0.875rem;
  margin-left: 10px;

  &::before {
    content: "";
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 6px;
    border: 2px solid #dee2e6;
    border-top-color: #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

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
  // Add state for unit preference
  const [useStandardUnits, setUseStandardUnits] = useState(true);

  // Rendering counter for debugging
  const renderCount = useRef(0);
  renderCount.current += 1;

  // Modified date selection to use a single reference date
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  );
  const [lastClickedPosition, setLastClickedPosition] = useState(null);

  // State to save panel size preferences
  const [mapPanelSize, setMapPanelSize] = useState(75); // Initial map takes 75% of space

  // Add a ref to track if we're currently fetching data
  const isFetchingRef = useRef(false);
  const mapRef = useRef(null);

  // Store lastClickedPosition in a ref for direct access
  const lastClickedPositionRef = useRef(null);

  // Store date value in ref to avoid stale closure issues
  const selectedDateRef = useRef(selectedDate);

  // Update the refs whenever the state changes
  useEffect(() => {
    lastClickedPositionRef.current = lastClickedPosition;
  }, [lastClickedPosition]);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
    console.log(
      `[MapPage] Selected date updated in ref: ${selectedDateRef.current}`
    );
  }, [selectedDate]);

  // Map click handler - wrapped in useCallback to prevent recreation on every render
  const handleMapClick = useCallback(
    async (e) => {
      console.log(`[MapPage] Map click handler called, coordinates:`, e.latlng);

      // Set fetching flag to prevent loops
      isFetchingRef.current = true;

      const { lat, lng } = e.latlng;
      console.log(`[MapPage] Processing click at coordinates: ${lat}, ${lng}`);
      setPosition({ lat, lng });

      // Only update lastClickedPosition if this is a direct user click (not a refetch)
      if (
        !lastClickedPosition ||
        lastClickedPosition.lat !== lat ||
        lastClickedPosition.lng !== lng
      ) {
        setLastClickedPosition({ lat, lng });
      }

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

        // Get the current date value from ref
        const currentDate = selectedDateRef.current;
        console.log(`[MapPage] Using selected date from ref: ${currentDate}`);

        // Calculate exact ±3 days from reference date
        const dateObj = new Date(currentDate);

        // Create new date objects to avoid modifying the original
        const startDateObj = new Date(dateObj);
        startDateObj.setDate(dateObj.getDate() - 3);

        const endDateObj = new Date(dateObj);
        endDateObj.setDate(dateObj.getDate() + 3);

        // Format dates as ISO strings (YYYY-MM-DD)
        const effectiveStartDate = startDateObj.toISOString().split("T")[0];
        const effectiveEndDate = endDateObj.toISOString().split("T")[0];

        console.log(
          `[MapPage] Calculated exact ±3 day window: ${effectiveStartDate} to ${effectiveEndDate}`
        );

        // Date parameters
        const dateParams = {
          start_date: effectiveStartDate,
          end_date: effectiveEndDate,
        };

        console.log(`[MapPage] Using date parameters:`, dateParams);

        // Fetch data for each dataset type
        const dataPromises = availableDatasets.map(async (datasetId) => {
          console.log(
            `[MapPage] Fetching dataset ${datasetId} for coordinates ${lat}, ${lng}`
          );

          // Pass date parameters to the fetch function
          const data = await fetchDatasetById(datasetId, {
            lat,
            lng,
            ...dateParams,
          });

          return { datasetId, data };
        });

        // Wait for all data to be fetched
        const results = await Promise.all(dataPromises);

        // Process and combine the results
        const combinedData = {
          location: { lat, lng },
          timeSeriesData: [],
          dateRange: {
            startDate: effectiveStartDate,
            endDate: effectiveEndDate,
            centerDate: currentDate,
          },
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
              // Add the standard value if available
              if (point.standardValue !== undefined) {
                timestampMap[point.timestamp][`${datasetId}_standard`] =
                  point.standardValue;
              }
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
        isFetchingRef.current = false; // Reset the fetching flag
      } catch (err) {
        console.error(`[MapPage] Error fetching data:`, err);
        setError(err.message || "Failed to fetch weather data");
        setIsLoading(false);
        isFetchingRef.current = false; // Reset the fetching flag even on error
      }
    },
    // Remove startDate and endDate from dependency array to prevent stale closures
    [fetchDatasetById, lastClickedPosition]
  );

  // Effect to re-fetch data when dates change if a position has been clicked
  useEffect(() => {
    // Only fetch if we have a position and aren't already fetching
    if (lastClickedPositionRef.current && !isFetchingRef.current) {
      console.log(`[MapPage] Refetching data due to date change`);
      handleMapClick({ latlng: lastClickedPositionRef.current });
    }
  }, [selectedDate, handleMapClick]);

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

    // Auto-fetch data on page load for default location
    const defaultLocation = {
      lat: 51.505,
      lng: -0.09,
    };

    console.log(
      "[MapPage] Auto-fetching data for default location on page load",
      defaultLocation
    );
    setPosition(defaultLocation);
    setLastClickedPosition(defaultLocation);

    // Use a small timeout to ensure the component is fully mounted
    setTimeout(() => {
      if (!isFetchingRef.current) {
        handleMapClick({ latlng: defaultLocation });
      }
    }, 500);
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

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
  };

  // Function to get formatted date for min/max attributes
  const getTodayFormatted = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Update the function to allow dates going back several years
  const getTenYearsAgoFormatted = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 10);
    return date.toISOString().split("T")[0];
  };

  // Function to get max date (30 days in future)
  const getMaxDateFormatted = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
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
        // Store original values for tooltips - ensure we store actual numbers for zero values
        _original: timeSeriesData.map((point) => {
          const timestamp = new Date(point.timestamp).getTime();
          // Ensure zero is stored as 0, not null or undefined
          const value = point[datasetType];
          return [timestamp, typeof value === "number" ? value : null];
        }),
        // Store standard values for tooltips
        _originalStandard: timeSeriesData.map((point) => {
          const timestamp = new Date(point.timestamp).getTime();
          const value = point[`${datasetType}_standard`];
          return [timestamp, typeof value === "number" ? value : null];
        }),
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
            // Get the original value from our stored data based on unit preference
            const originalValue =
              useStandardUnits && w.config.series[seriesIndex]._originalStandard
                ? w.config.series[seriesIndex]._originalStandard[
                    dataPointIndex
                  ][1]
                : w.config.series[seriesIndex]._original[dataPointIndex][1];

            // More robust check for missing data - only if it's strictly null or undefined
            // Should handle zero values (0.00) correctly
            if (originalValue === null || originalValue === undefined) {
              return "N/A";
            }

            const datasetType = datasetTypes[seriesIndex];
            // Ensure we're formatting a number
            const formattedValue = Number(originalValue).toFixed(2);
            return `${formattedValue} ${getUnitByDatasetId(datasetType)}`;
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
            // Calculate min-max values in the current unit system
            let minValue = minMax.min;
            let maxValue = minMax.max;

            // If using standard units, convert the min-max values
            if (useStandardUnits) {
              const datasetPrefix = `${datasetType}_standard`;
              // Find values in standard units if available
              const standardValues = timeSeriesData
                .map((point) => point[datasetPrefix])
                .filter((value) => value !== undefined);

              if (standardValues.length > 0) {
                minValue = Math.min(...standardValues);
                maxValue = Math.max(...standardValues);
              }
            }

            return `${seriesName} (${minValue.toFixed(1)}-${maxValue.toFixed(
              1
            )} ${getUnitByDatasetId(datasetType)})`;
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

    // Format the date for better readability, ensuring correct date interpretation
    const formattedData = timeSeriesData.map((point) => {
      // Parse the date parts directly to avoid timezone issues
      const [year, month, day] = point.timestamp.split("-").map(Number);
      // Create date ensuring it stays on the correct day (month is 0-indexed in JS Date)
      const date = new Date(year, month - 1, day);

      // Format as mm/dd/yyyy with proper zero-padding
      const formattedMonth = String(month).padStart(2, "0");
      const formattedDay = String(day).padStart(2, "0");
      const formattedDate = `${formattedMonth}/${formattedDay}/${year}`;

      return {
        ...point,
        formattedDate: formattedDate,
      };
    });

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
                  {datasetTypes.map((datasetType) => {
                    // Get the appropriate value based on unit preference
                    const value =
                      useStandardUnits &&
                      point[`${datasetType}_standard`] !== undefined
                        ? point[`${datasetType}_standard`]
                        : point[datasetType];

                    return (
                      <td key={datasetType}>
                        {value !== undefined ? value.toFixed(2) : "N/A"}
                      </td>
                    );
                  })}
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
    if (useStandardUnits) {
      // Return standard/imperial units
      switch (datasetId) {
        case "temperature":
        case "feels-like":
          return "°F";
        case "precipitation":
          return "in";
        case "humidity":
        case "cloud-cover":
          return "%";
        case "wind-speed":
          return "mph";
        case "uv-index":
          return "";
        default:
          return "";
      }
    } else {
      // Return metric units
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
    }
  };

  // Handle panel resize
  const handlePanelResize = (sizes) => {
    setMapPanelSize(sizes[0]);
  };

  const MapTitle = styled.h5`
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;

    &::before {
      content: "🌦️";
      margin-right: 8px;
    }
  `;

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
              <MapTitle>Weather Explorer Map</MapTitle>
              {isLoading && (
                <LoadingIndicator>Loading data...</LoadingIndicator>
              )}
            </Col>
            <Col md={6}>
              <DateControlContainer>
                <div style={{ width: "180px" }}>
                  <DateLabel>Reference Date</DateLabel>
                  <DateInput
                    type="date"
                    size="sm"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={getTenYearsAgoFormatted()}
                    max={getMaxDateFormatted()}
                  />
                </div>
                <DateHelpText>
                  Data will show ±3 days from this date
                </DateHelpText>
              </DateControlContainer>
            </Col>
            <Col
              md={3}
              className="text-end d-flex flex-column justify-content-center"
            >
              <UnitToggleContainer>
                <UnitToggleLabel>
                  {useStandardUnits ? "°F, mph, in" : "°C, km/h, mm"}
                </UnitToggleLabel>
                <ToggleSwitch
                  type="switch"
                  id="unit-toggle"
                  checked={useStandardUnits}
                  onChange={() => setUseStandardUnits(!useStandardUnits)}
                  label={useStandardUnits ? "Standard" : "Metric"}
                />
              </UnitToggleContainer>
              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100"
                onClick={() => navigate("/datasets")}
              >
                Back to Datasets
              </Button>
            </Col>
          </Row>
        </Container>
      </MapHeader>

      <MapContent>
        <StyledPanelGroup
          direction="horizontal"
          onLayout={handlePanelResize}
          id="map-panel-group"
        >
          {/* Map Panel */}
          <Panel id="map" defaultSize={mapPanelSize} minSize={50}>
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
          </Panel>

          {/* Resize Handle */}
          <StyledResizeHandle />

          {/* Data Panel */}
          <Panel id="data" defaultSize={100 - mapPanelSize} minSize={25}>
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
                  <p>
                    Click on the map to view weather data for that location.
                  </p>
                </NoSelection>
              ) : (
                <div>
                  <h5>Weather Data</h5>
                  <p>
                    Location: {position.lat.toFixed(4)},{" "}
                    {position.lng.toFixed(4)}
                  </p>
                  {/* Show date range if custom dates were used with data source indicator */}
                  {weatherData.dateRange && (
                    <div className="text-muted small mb-2">
                      <p className="mb-1">
                        Data range:{" "}
                        {weatherData.dateRange.startDate || "Default start"} to{" "}
                        {weatherData.dateRange.endDate || "Default end"}
                      </p>
                      <p className="mb-0">
                        <small>
                          <i>
                            Data combines historical observations, current
                            conditions, and forecast data as needed.
                          </i>
                        </small>
                      </p>
                    </div>
                  )}
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
          </Panel>
        </StyledPanelGroup>
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
