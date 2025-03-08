import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { datasetsAPI } from "../services/api";

const DatasetContext = createContext();

export const DatasetProvider = ({ children }) => {
  const [selectedDataset, setSelectedDataset] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [currentDataset, setCurrentDataset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);

  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching datasets...");
      const response = await datasetsAPI.getDatasets();
      setDatasets(response.data.datasets);
      setError(null);
      console.log("Datasets fetched:", response.data.datasets);
    } catch (err) {
      console.error("Failed to fetch datasets:", err);
      setError("Failed to load datasets. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDatasetById = useCallback(
    async (id, location = null) => {
      try {
        setLoading(true);
        console.log(
          `Fetching dataset ${id}...`,
          location ? `for location: ${JSON.stringify(location)}` : ""
        );

        // If location is provided, fetch location-specific time series data
        if (
          location &&
          location.lat !== undefined &&
          location.lng !== undefined
        ) {
          console.log(
            `Getting time series data for dataset ${id} at coordinates:`,
            location
          );

          // Start date is today, end date is 7 days from now
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);

          const startDate = today.toISOString().split("T")[0];
          const endDate = nextWeek.toISOString().split("T")[0];

          // Prepare request params for time series data
          const params = {
            dataset_id: id,
            lat: location.lat,
            lon: location.lng,
            start_date: startDate,
            end_date: endDate,
          };

          // Generate mock data as fallback if API call fails
          try {
            const response = await datasetsAPI.getTimeSeries(params);
            console.log("API time series response:", response.data);
            return response.data;
          } catch (err) {
            console.warn("API call failed, generating mock data instead:", err);

            // Generate mock data for demonstration
            const mockTimeSeriesData = generateMockData(id, location);

            // Return a structure similar to what the API would return
            return {
              dataset_id: id,
              name:
                (datasets.find((d) => d.id === id) || {}).name ||
                "Unknown Dataset",
              location: location,
              timeSeriesData: mockTimeSeriesData,
            };
          }
        } else {
          // Just fetch basic dataset info when no location is provided
          const response = await datasetsAPI.getDataset(id);
          setCurrentDataset(response.data);
          setError(null);
          console.log(`Dataset ${id} fetched:`, response.data);
          return response.data;
        }
      } catch (err) {
        console.error(`Failed to fetch dataset ${id}:`, err);
        setError("Failed to load dataset details. Please try again later.");

        // Generate mock data as fallback
        if (location) {
          const mockData = generateMockData(id, location);
          return {
            dataset_id: id,
            name: (datasets.find((d) => d.id === id) || {}).name || id,
            location: location,
            timeSeriesData: mockData,
          };
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [datasets]
  );

  // Helper function to generate mock data
  const generateMockData = (datasetId, location) => {
    console.log(`Generating mock data for dataset ${datasetId} at`, location);
    const mockTimeSeriesData = [];
    const today = new Date();
    const datasetType = datasetId.split("-")[0] || datasetId; // Get base type like 'temperature'

    // Generate 7 days of data
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const formattedDate = date.toISOString().split("T")[0];

      // Generate different values based on dataset type
      let value;
      switch (datasetType) {
        case "temperature":
          // Temperature between 10-30°C with some randomness
          value = 15 + Math.sin((i / 7) * Math.PI) * 10 + Math.random() * 5;
          break;
        case "precipitation":
          // Precipitation between 0-30mm
          value = Math.max(0, Math.random() * 30);
          break;
        case "humidity":
          // Humidity between 30-90%
          value = 30 + Math.random() * 60;
          break;
        case "wind-speed":
          // Wind speed between 0-30 km/h
          value = Math.random() * 30;
          break;
        case "uv-index":
          // UV index between 0-12
          value = Math.random() * 12;
          break;
        case "cloud-cover":
          // Cloud cover between 0-100%
          value = Math.random() * 100;
          break;
        default:
          value = Math.random() * 100;
      }

      mockTimeSeriesData.push({
        timestamp: formattedDate,
        value: parseFloat(value.toFixed(2)),
      });
    }

    return mockTimeSeriesData;
  };

  const fetchTimeSeries = useCallback(async (params) => {
    try {
      setLoading(true);
      console.log("Fetching time series data with params:", params);
      const response = await datasetsAPI.getTimeSeries(params);
      setTimeSeriesData(response.data);
      setError(null);
      console.log("Time series data fetched:", response.data);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch time series data:", err);
      setError("Failed to load time series data. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectDataset = useCallback((id) => {
    console.log(`Setting selected dataset to: ${id}`);
    setSelectedDataset(id);
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  useEffect(() => {
    if (datasets.length === 0 && !loading) {
      const mockDatasets = [
        { id: "temperature", name: "Current Temperature" },
        { id: "temperature-forecast", name: "10-Day Temperature Forecast" },
        { id: "feels-like", name: "Feels Like Temperature" },
        { id: "precipitation", name: "Precipitation" },
        { id: "humidity", name: "Humidity" },
        { id: "wind-speed", name: "Wind Speed" },
        { id: "uv-index", name: "UV Index" },
        { id: "cloud-cover", name: "Cloud Cover" },
      ];
      setDatasets(mockDatasets);
      console.log("Using mock datasets:", mockDatasets);
    }
  }, [datasets.length, loading]);

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        selectedDataset,
        currentDataset,
        timeSeriesData,
        loading,
        error,
        setSelectedDataset: selectDataset,
        fetchDatasets,
        fetchDatasetById,
        fetchTimeSeries,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDatasetContext = () => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDatasetContext must be used within a DatasetProvider");
  }
  return context;
};

export default DatasetContext;
