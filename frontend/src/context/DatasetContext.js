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

          // Handle date parameters with validation for maximum range (21 days)
          let startDate, endDate;

          if (location.start_date && location.end_date) {
            // Both dates provided - validate the range
            startDate = location.start_date;
            endDate = location.end_date;

            // Check if the range exceeds 21 days
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            const daysDiff = Math.ceil(
              (endDateObj - startDateObj) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff > 21) {
              console.warn(
                `Date range exceeds maximum allowed (21 days). Adjusting end date.`
              );
              const maxEndDate = new Date(startDateObj);
              maxEndDate.setDate(startDateObj.getDate() + 21);
              endDate = maxEndDate.toISOString().split("T")[0];
            }
          } else if (location.start_date && !location.end_date) {
            // If start date is provided but no end date, end date = start date + 10 days
            startDate = location.start_date;
            const endDateObj = new Date(startDate);
            endDateObj.setDate(endDateObj.getDate() + 10);
            endDate = endDateObj.toISOString().split("T")[0];
          } else if (!location.start_date && location.end_date) {
            // If end date is provided but no start date, start date = end date - 10 days
            endDate = location.end_date;
            const startDateObj = new Date(endDate);
            startDateObj.setDate(startDateObj.getDate() - 10);
            startDate = startDateObj.toISOString().split("T")[0];
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

          // Use real API data - disable mock data generation
          const response = await datasetsAPI.getTimeSeries(params);
          console.log("API time series response:", response.data);
          return response.data;
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
