import React, { createContext, useContext, useState } from "react";
import { weatherAPI } from "../services/api";

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [temperatureUnit, setTemperatureUnit] = useState("celsius"); // 'celsius' or 'fahrenheit'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const fetchWeatherTimeline = async (location, startDate, endDate) => {
    try {
      setLoading(true);
      const response = await weatherAPI.getTimeline(
        location,
        startDate,
        endDate
      );
      setWeatherData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch weather timeline:", err);
      setError("Failed to load weather data. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherForecast = async (location) => {
    try {
      setLoading(true);
      const response = await weatherAPI.getForecast(location);
      setWeatherData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch weather forecast:", err);
      setError("Failed to load weather forecast. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleTemperatureUnit = () => {
    setTemperatureUnit((prev) =>
      prev === "celsius" ? "fahrenheit" : "celsius"
    );
  };

  // Helper for temperature conversion
  const formatTemperature = (tempC) => {
    if (temperatureUnit === "fahrenheit") {
      const tempF = (tempC * 9) / 5 + 32;
      return `${tempF.toFixed(1)}°F`;
    }
    return `${tempC.toFixed(1)}°C`;
  };

  const processWeatherData = (dataset, datasetId, location) => {
    if (!dataset || !dataset.days) {
      return {
        time_series: [],
        dataset_id: datasetId,
        location,
        unit: "°C",
        description: "No weather data available",
        address: "",
        resolvedAddress: "",
      };
    }

    const { days } = dataset;
    let limitedDays = days;

    // For current temperature, show only today
    if (datasetId === "temperature") {
      limitedDays = days.slice(0, 1);
    }
    // For 10-day forecast, take up to 10 days
    else if (datasetId === "temperature-forecast") {
      limitedDays = days.slice(0, 10);
    }

    // Determine which property to extract based on dataset ID
    let property = "temp";
    let unit = "°C";

    switch (datasetId) {
      case "temperature":
      case "temperature-forecast":
      case "temperature-historical":
        property = "temp";
        unit = "°C";
        break;
      case "feels-like":
        property = "feelslike";
        unit = "°C";
        break;
      case "precipitation":
        property = "precip";
        unit = "mm";
        break;
      case "humidity":
        property = "humidity";
        unit = "%";
        break;
      case "wind-speed":
        property = "windspeed";
        unit = "km/h";
        break;
      case "uv-index":
        property = "uvindex";
        unit = "index";
        break;
      case "cloud-cover":
        property = "cloudcover";
        unit = "%";
        break;
      default:
        property = "temp";
        unit = "°C";
    }

    return {
      time_series: limitedDays.map((day) => ({
        timestamp: day.datetime,
        value: day[property] || 0,
      })),
      dataset_id: datasetId,
      location,
      unit,
      description: dataset.description || "Weather data",
      address: dataset.address || "",
      resolvedAddress: dataset.resolvedAddress || "",
    };
  };

  return (
    <WeatherContext.Provider
      value={{
        weatherData,
        loading,
        error,
        selectedLocation,
        temperatureUnit,
        setSelectedLocation,
        fetchWeatherTimeline,
        fetchWeatherForecast,
        toggleTemperatureUnit,
        formatTemperature,
        processWeatherData,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
};

export default WeatherContext;
