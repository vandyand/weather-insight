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

          // Handle date parameters with the same defaulting logic as in MapPage
          let startDate, endDate;

          if (location.start_date && !location.end_date) {
            // If start date is provided but no end date, end date = start date + 15 days
            startDate = location.start_date;
            const endDateObj = new Date(startDate);
            endDateObj.setDate(endDateObj.getDate() + 15);
            endDate = endDateObj.toISOString().split("T")[0];
          } else if (!location.start_date && location.end_date) {
            // If end date is provided but no start date, start date = end date - 15 days
            endDate = location.end_date;
            const startDateObj = new Date(endDate);
            startDateObj.setDate(startDateObj.getDate() - 15);
            startDate = startDateObj.toISOString().split("T")[0];
          } else if (location.start_date && location.end_date) {
            // Both dates provided
            startDate = location.start_date;
            endDate = location.end_date;
          } else {
            // Default date range (neither provided): today to 10 days from now
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10);

            startDate = today.toISOString().split("T")[0];
            endDate = futureDate.toISOString().split("T")[0];
          }

          console.log(`Using date range: ${startDate} to ${endDate}`);

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

            // Generate mock data for demonstration with date range support
            const mockTimeSeriesData = generateMockData(
              id,
              location,
              startDate,
              endDate
            );

            // Return a structure similar to what the API would return
            return {
              dataset_id: id,
              name:
                (datasets.find((d) => d.id === id) || {}).name ||
                "Unknown Dataset",
              location: location,
              timeSeriesData: mockTimeSeriesData,
              dateRange: {
                startDate,
                endDate,
              },
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
        setError(`Failed to load dataset ${id}. Please try again later.`);
        setLoading(false);
        throw err;
      }
    },
    [datasets]
  );

  // Update the mock data generation function to support extended date ranges
  const generateMockData = (datasetId, location, startDateStr, endDateStr) => {
    console.log(`Generating mock data for dataset ${datasetId} at`, location);
    console.log(`Using date range: ${startDateStr} to ${endDateStr}`);

    const mockTimeSeriesData = [];
    const datasetType = datasetId.split("-")[0] || datasetId; // Get base type like 'temperature'

    // Parse start and end dates
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr ? new Date(endDateStr) : new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // Default to 7 days if end date is same as start

    // Calculate number of days between the dates
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    console.log(`Total days in range: ${daysDiff}`);

    // For very long date ranges, we'll sample points rather than generating every day
    // to keep performance reasonable and avoid overwhelming the visualization
    const MAX_DATA_POINTS = 60; // Maximum number of data points to generate

    // Determine the step size (every Nth day) to limit total data points
    const step =
      daysDiff > MAX_DATA_POINTS ? Math.ceil(daysDiff / MAX_DATA_POINTS) : 1;
    const pointsToGenerate = Math.min(daysDiff, MAX_DATA_POINTS);

    console.log(
      `Generating ${pointsToGenerate} data points with step size of ${step}`
    );

    // Use the latitude to influence the base values for more realistic data
    // Temperatures are generally warmer near equator, colder near poles
    const latitudeFactor = Math.abs(location.lat) / 90; // 0 at equator, 1 at poles

    // Generate seasonal patterns - more realistic for long date ranges
    const createSeasonalValue = (date, baseValue, amplitude) => {
      // Calculate day of year (0-365)
      const startOfYear = new Date(date.getFullYear(), 0, 0);
      const dayOfYear = Math.floor(
        (date - startOfYear) / (1000 * 60 * 60 * 24)
      );

      // Seasonal variation with peaks in summer and troughs in winter
      // Northern and Southern hemispheres have opposite seasons
      const seasonalOffset =
        location.lat >= 0
          ? Math.sin(((dayOfYear - 172) / 365) * 2 * Math.PI) // Northern hemisphere
          : Math.sin(((dayOfYear - 355) / 365) * 2 * Math.PI); // Southern hemisphere

      return baseValue + seasonalOffset * amplitude;
    };

    // Weather zones rough approximation based on latitude
    let weatherZone = "temperate";
    if (Math.abs(location.lat) < 23.5) {
      weatherZone = "tropical";
    } else if (Math.abs(location.lat) > 66.5) {
      weatherZone = "polar";
    }

    // Generate data for each day in the range (using step size)
    for (let i = 0; i < daysDiff; i += step) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const formattedDate = date.toISOString().split("T")[0];

      // Generate different values based on dataset type with more realistic patterns
      let value;

      // Use different base values and amplitudes for different weather zones
      let baseTemp, tempAmplitude, baseHumidity, baseRain, rainProbability;

      switch (weatherZone) {
        case "tropical":
          baseTemp = 28;
          tempAmplitude = 5;
          baseHumidity = 80;
          baseRain = 20;
          rainProbability = 0.5;
          break;
        case "polar":
          baseTemp = -10;
          tempAmplitude = 20;
          baseHumidity = 60;
          baseRain = 5;
          rainProbability = 0.2;
          break;
        default: // temperate
          baseTemp = 15;
          tempAmplitude = 15;
          baseHumidity = 70;
          baseRain = 10;
          rainProbability = 0.3;
      }

      switch (datasetType) {
        case "temperature":
          // Use seasonal patterns for temperature
          value = createSeasonalValue(date, baseTemp, tempAmplitude);
          // Add some random variation
          value += Math.random() * 4 - 2;
          break;
        case "feels-like":
          // Feels like is similar to temperature but affected by wind and humidity
          value = createSeasonalValue(date, baseTemp - 1, tempAmplitude + 2);
          value += Math.random() * 5 - 2.5;
          break;
        case "precipitation":
          // Precipitation has seasonal patterns too, but more random
          const seasonalRainFactor =
            createSeasonalValue(date, 0, 1) * 0.5 + 0.5; // 0-1 scale
          const isRainy = Math.random() < rainProbability * seasonalRainFactor;
          value = isRainy ? baseRain * (0.5 + Math.random() * 1.5) : 0;
          break;
        case "humidity":
          // Humidity correlates inversely with temperature in many climates
          const tempValue = createSeasonalValue(date, baseTemp, tempAmplitude);
          // In colder weather, humidity is generally higher
          value = baseHumidity - ((tempValue - baseTemp) / tempAmplitude) * 20;
          // Add some random variation
          value = Math.max(30, Math.min(95, value + (Math.random() * 20 - 10)));
          break;
        case "wind-speed":
          // Wind tends to be higher in winter and at higher latitudes
          const seasonalWindFactor =
            1 - (createSeasonalValue(date, 0, 1) * 0.5 + 0.5); // Higher in winter
          const baseWind = 10 + 20 * latitudeFactor;
          value = baseWind * seasonalWindFactor * (0.5 + Math.random() * 0.8);
          break;
        case "cloud-cover":
          // Cloud cover often correlates with precipitation and humidity
          const tempFactor = createSeasonalValue(date, 0, 1);
          const isRainyDay =
            Math.random() < rainProbability * (1 - tempFactor * 0.5);
          value = isRainyDay
            ? 60 + Math.random() * 40
            : 20 + Math.random() * 50;
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
