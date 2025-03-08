import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor for handling auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
};

// Weather data API calls
export const weatherAPI = {
  getTimeline: (location, startDate, endDate) =>
    api.get(
      `/weather/timeline?location=${location}&start-date=${startDate}&end-date=${endDate}`
    ),
  getForecast: (location) => api.get(`/weather/forecast?location=${location}`),
};

// Datasets API calls
export const datasetsAPI = {
  getDatasets: () => api.get("/climate-data/datasets"),
  getDataset: (id) => api.get(`/climate-data/dataset/${id}`),
  getTimeSeries: (params) => api.post("/climate-data/time-series", params),
};

export default api;
