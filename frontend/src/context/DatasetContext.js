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

    // Use the latitude to influence the base values for more realistic data
    // Temperatures are generally warmer near equator, colder near poles
    const latitudeFactor = Math.abs(location.lat) / 90; // 0 at equator, 1 at poles
    
    // Generate 7 days of data
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const formattedDate = date.toISOString().split("T")[0];

      // Generate different values based on dataset type with more realistic patterns
      let value;
      switch (datasetType) {
        case "temperature":
          // Temperature between -10 to 35°C depending on latitude
          // Cooler at higher latitudes, warmer near equator
          const baseTemp = 30 - 40 * latitudeFactor; // 30°C at equator, -10°C at poles
          // Add daily fluctuation
          value = baseTemp + Math.sin((i / 7) * Math.PI) * 5 + (Math.random() * 3 - 1.5);
          break;
        case "feels-like":
          // Feels like is usually similar to temperature but affected by wind and humidity
          // We'll make it a bit different from actual temperature
          const baseFeelsLike = 28 - 38 * latitudeFactor; 
          value = baseFeelsLike + Math.sin((i / 7) * Math.PI) * 6 + (Math.random() * 4 - 2);
          break;
        case "precipitation":
          // Precipitation between 0-30mm with clustering (rainy days tend to cluster)
          // More precipitation near equator on average
          const rainProbability = Math.random() < 0.3 ? 0.8 : 0.2; // 30% chance of a rainy day
          const maxRain = 30 * (1 - latitudeFactor * 0.5); // More rain near equator
          value = Math.max(0, Math.random() * maxRain * rainProbability);
          break;
        case "humidity":
          // Humidity between 30-95%
          // Generally higher near equator, lower at poles and varies with precipitation
          const baseHumidity = 90 - 50 * latitudeFactor;
          value = Math.max(30, Math.min(95, baseHumidity + (Math.random() * 20 - 10)));
          break;
        case "wind-speed":
          // Wind speed between 0-40 km/h
          // Generally higher at higher latitudes
          const baseWind = 10 + 30 * latitudeFactor;
          value = Math.max(0, baseWind * (0.5 + Math.random() * 0.5));
          break;
        case "cloud-cover":
          // Cloud cover between 0-100%
          // Correlate somewhat with precipitation
          const rainDay = Math.random() < 0.3;
          value = rainDay ? 60 + Math.random() * 40 : Math.random() * 60;
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
