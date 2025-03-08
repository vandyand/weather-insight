import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

// Create the context
const DatasetContext = createContext();

// Provider component
export const DatasetProvider = ({ children }) => {
  // State
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug render counter
  const renderCount = React.useRef(0);

  // Fetch all datasets
  const fetchDatasets = useCallback(async () => {
    console.log("[DatasetContext] Fetching all datasets");
    setIsLoading(true);
    try {
      const response = await axios.get("/api/datasets");
      console.log("[DatasetContext] Datasets fetched:", response.data);
      setDatasets(response.data);
      setError(null);
    } catch (err) {
      console.error("[DatasetContext] Error fetching datasets:", err);
      setError("Failed to fetch datasets");

      // If no datasets are available, set mock datasets for testing
      if (datasets.length === 0) {
        console.log("[DatasetContext] Setting mock datasets");
        setDatasets([
          { id: "temperature", name: "Temperature" },
          { id: "precipitation", name: "Precipitation" },
          { id: "humidity", name: "Humidity" },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [datasets.length]);

  // Fetch dataset by ID with location
  const fetchDatasetById = useCallback(async (id, location) => {
    console.log(
      `[DatasetContext] Fetching dataset ${id} for location:`,
      location
    );
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/datasets/${id}`, {
        params: { lat: location.lat, lng: location.lng },
      });
      console.log("[DatasetContext] Dataset data fetched:", response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error("[DatasetContext] Error fetching dataset:", err);
      setError("Failed to fetch dataset data");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch time series data
  const fetchTimeSeries = useCallback(
    async (datasetId, location, startDate, endDate) => {
      console.log(`[DatasetContext] Fetching time series for ${datasetId}`);
      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/datasets/${datasetId}/timeseries`,
          {
            params: {
              lat: location.lat,
              lng: location.lng,
              start_date: startDate,
              end_date: endDate,
            },
          }
        );
        console.log(
          "[DatasetContext] Time series data fetched:",
          response.data
        );
        setError(null);
        return response.data;
      } catch (err) {
        console.error("[DatasetContext] Error fetching time series:", err);
        setError("Failed to fetch time series data");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Select dataset helper function
  const selectDataset = useCallback((datasetId) => {
    console.log(`[DatasetContext] Setting selected dataset to: ${datasetId}`);
    setSelectedDataset(datasetId);
  }, []);

  // Load datasets on mount
  useEffect(() => {
    renderCount.current += 1;
    console.log(`[DatasetContext] Render #${renderCount.current}`);

    fetchDatasets();

    // Log when we already have a selected dataset
    if (selectedDataset) {
      console.log(
        `[DatasetContext] Already have selected dataset: ${selectedDataset}`
      );
    }
  }, [fetchDatasets, selectedDataset]);

  // Log when selectedDataset changes
  useEffect(() => {
    console.log(
      `[DatasetContext] Selected dataset changed to: ${
        selectedDataset || "none"
      }`
    );
  }, [selectedDataset]);

  // Create context value object
  const contextValue = {
    datasets,
    selectedDataset,
    setSelectedDataset: selectDataset,
    isLoading,
    error,
    fetchDatasets,
    fetchDatasetById,
    fetchTimeSeries,
  };

  return (
    <DatasetContext.Provider value={contextValue}>
      {children}
    </DatasetContext.Provider>
  );
};

// Custom hook to use the context
export const useDatasetContext = () => {
  const context = useContext(DatasetContext);
  if (context === undefined) {
    throw new Error("useDatasetContext must be used within a DatasetProvider");
  }
  return context;
};

export default { DatasetProvider, useDatasetContext };
