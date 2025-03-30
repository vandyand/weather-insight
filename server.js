const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");
const querystring = require("querystring");

// Load environment variables from .env file
require("dotenv").config();

const PORT = process.env.PORT || 8080;
const VISUAL_CROSSING_API_KEY = process.env.VISUAL_CROSSING_API_KEY;
const VISUAL_CROSSING_API_BASE =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

// Mock database for users
const users = [
  {
    id: 1,
    name: "Demo User",
    email: "user@example.com",
    password_hash: "password", // In a real app, this would be hashed
  },
];

// Mock JWT generation (simplified for demo)
const generateToken = (user) => {
  return `mock-jwt-token-${user.id}-${Date.now()}`;
};

// Helper to parse JSON body from requests
const parseJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", (error) => {
      reject(error);
    });
  });
};

// Function to make HTTP requests to external APIs
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        // Check the response status code
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Only try to parse JSON if response is successful
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(
              new Error(
                `Failed to parse JSON response: ${data.substring(0, 100)}...`
              )
            );
          }
        } else {
          // For error responses, include the status code and response body in the error
          const errorMessage = `API responded with status ${
            res.statusCode
          }: ${data.substring(0, 100)}...`;
          console.error(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
};

// Function to get weather data from Visual Crossing API
const getWeatherData = async (location, startDate, endDate) => {
  try {
    let url;
    if (startDate && endDate) {
      url = `${VISUAL_CROSSING_API_BASE}/${encodeURIComponent(
        location
      )}/${startDate}/${endDate}?unitGroup=metric&include=days&key=${VISUAL_CROSSING_API_KEY}&contentType=json`;
    } else {
      url = `${VISUAL_CROSSING_API_BASE}/${encodeURIComponent(
        location
      )}?unitGroup=metric&include=days&key=${VISUAL_CROSSING_API_KEY}&contentType=json`;
    }

    console.log(
      `Making API request to Visual Crossing: ${url.replace(
        VISUAL_CROSSING_API_KEY,
        "API_KEY_HIDDEN"
      )}`
    );

    // Check if API key is valid
    if (
      !VISUAL_CROSSING_API_KEY ||
      VISUAL_CROSSING_API_KEY === "YOUR_API_KEY_HERE"
    ) {
      throw new Error(
        "Invalid or missing Visual Crossing API key. Please check your .env file."
      );
    }

    const result = await makeRequest(url);
    console.log(
      `Received response from Visual Crossing with ${
        result.days ? result.days.length : 0
      } days of data`
    );

    return result;
  } catch (error) {
    console.error("Error fetching weather data:", error.message);

    // Provide more helpful error messages for common API issues
    if (error.message.includes("exceeded")) {
      console.error(
        "API quota has been exceeded. Consider upgrading your Visual Crossing plan or reducing the number of requests."
      );
    } else if (
      error.message.includes("invalid key") ||
      error.message.includes("unauthorized")
    ) {
      console.error(
        "The API key appears to be invalid. Check that it is correctly set in your .env file."
      );
    }

    throw error;
  }
};

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Add CORS headers for API requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle API requests
  if (req.url.startsWith("/api/")) {
    console.log(`Processing API request: ${req.method} ${req.url}`);
    res.setHeader("Content-Type", "application/json");

    // Health check endpoint
    if (req.url === "/api/health" && req.method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Test endpoint for debugging
    if (req.url === "/api/test" && req.method === "GET") {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          message: "Test endpoint working",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Login endpoint
    if (req.url === "/api/auth/login" && req.method === "POST") {
      try {
        const data = await parseJsonBody(req);
        const user = users.find(
          (u) => u.email === data.email && u.password_hash === data.password
        );

        if (user) {
          const token = generateToken(user);
          const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
          };

          res.writeHead(200);
          res.end(JSON.stringify({ token, user: userResponse }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ error: "Invalid credentials" }));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid request body" }));
      }
      return;
    }

    // Registration endpoint
    if (req.url === "/api/auth/register" && req.method === "POST") {
      try {
        const data = await parseJsonBody(req);

        if (!data.email || !data.password || !data.name) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required fields" }));
          return;
        }

        // Check if user already exists
        if (users.some((u) => u.email === data.email)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Email already registered" }));
          return;
        }

        // Create new user
        const newUser = {
          id: users.length + 1,
          name: data.name,
          email: data.email,
          password_hash: data.password,
        };

        users.push(newUser);

        const token = generateToken(newUser);
        const userResponse = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        };

        res.writeHead(201);
        res.end(
          JSON.stringify({
            message: "User registered successfully",
            token,
            user: userResponse,
          })
        );
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid request body" }));
      }
      return;
    }

    // Handle dataset API endpoints
    if (req.url === "/api/weather-data/datasets" && req.method === "GET") {
      const datasets = [
        {
          id: "temperature",
          name: "Current Temperature",
          description:
            "Current temperature data from Visual Crossing Weather API",
          source: "Visual Crossing",
          unit: "°C",
          time_range: "Current-Forecast",
        },
        {
          id: "feels-like",
          name: "Feels Like Temperature",
          description:
            "Perceived temperature accounting for wind, humidity, and sun",
          source: "Visual Crossing",
          unit: "°C",
          time_range: "Current-Forecast",
        },
        {
          id: "precipitation",
          name: "Precipitation",
          description: "Precipitation data from Visual Crossing Weather API",
          source: "Visual Crossing",
          unit: "mm",
          time_range: "Current-Forecast",
        },
        {
          id: "humidity",
          name: "Humidity",
          description: "Humidity data from Visual Crossing Weather API",
          source: "Visual Crossing",
          unit: "%",
          time_range: "Current-Forecast",
        },
        {
          id: "wind-speed",
          name: "Wind Speed",
          description: "Wind speed data from Visual Crossing Weather API",
          source: "Visual Crossing",
          unit: "km/h",
          time_range: "Current-Forecast",
        },
        {
          id: "uv-index",
          name: "UV Index",
          description:
            "Ultraviolet index data from Visual Crossing Weather API",
          source: "Visual Crossing",
          unit: "index",
          time_range: "Current-Forecast",
        },
        {
          id: "cloud-cover",
          name: "Cloud Cover",
          description: "Cloud cover data from Visual Crossing Weather API",
          source: "Visual Crossing",
          unit: "%",
          time_range: "Current-Forecast",
        },
      ];

      res.writeHead(200);
      res.end(JSON.stringify({ datasets }));
      return;
    }

    // Weather Timeline endpoint
    if (req.url.startsWith("/api/weather/timeline") && req.method === "GET") {
      try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const query = parsedUrl.searchParams;

        const location = query.get("location");
        const startDate = query.get("start-date");
        const endDate = query.get("end-date");

        if (!location || !startDate || !endDate) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error:
                "Missing required parameters: location, start-date, end-date",
            })
          );
          return;
        }

        const weatherData = await getWeatherData(location, startDate, endDate);

        res.writeHead(200);
        res.end(JSON.stringify(weatherData));
      } catch (error) {
        console.error("Error in weather timeline endpoint:", error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to fetch weather data" }));
      }
      return;
    }

    // Weather Forecast endpoint
    if (req.url.startsWith("/api/weather/forecast") && req.method === "GET") {
      try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const query = parsedUrl.searchParams;

        const location = query.get("location");

        if (!location) {
          res.writeHead(400);
          res.end(
            JSON.stringify({ error: "Missing required parameter: location" })
          );
          return;
        }

        const forecastData = await getWeatherData(location);

        res.writeHead(200);
        res.end(JSON.stringify(forecastData));
      } catch (error) {
        console.error("Error in weather forecast endpoint:", error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to fetch forecast data" }));
      }
      return;
    }

    // Handle time-series data requests
    if (req.url.startsWith("/api/weather-data/time-series")) {
      // Only POST method is allowed for this endpoint
      if (req.method !== "POST") {
        res.writeHead(405);
        res.end(
          JSON.stringify({
            error: "Method not allowed. Use POST",
          })
        );
        return;
      }

      try {
        const body = await parseJsonBody(req);
        const { dataset_id, lat, lon, start_date, end_date } = body;

        if (!dataset_id || !lat || !lon) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error: "Missing required parameters: dataset_id, lat, lon",
            })
          );
          return;
        }

        console.log(
          `Processing time series request for dataset: ${dataset_id}, location: ${lat},${lon}, date range: ${start_date} to ${end_date}`
        );

        // Attempt to get real weather data from Visual Crossing API
        try {
          // Ensure we have valid dates
          const requestStartDate =
            start_date || new Date().toISOString().split("T")[0];
          const requestEndDate =
            end_date ||
            (() => {
              const date = new Date();
              date.setDate(date.getDate() + 7);
              return date.toISOString().split("T")[0];
            })();

          console.log(
            `Requesting data from Visual Crossing for date range: ${requestStartDate} to ${requestEndDate}`
          );

          // Verify we have a valid API key
          if (!VISUAL_CROSSING_API_KEY) {
            throw new Error(
              "Missing Visual Crossing API key in environment variables"
            );
          }

          const location = `${lat},${lon}`;
          const weatherData = await getWeatherData(
            location,
            requestStartDate,
            requestEndDate
          );

          if (!weatherData) {
            throw new Error("No data received from Visual Crossing API");
          }

          // Process the weather data based on the dataset type
          const timeSeriesData = processWeatherDataByDatasetType(
            weatherData,
            dataset_id,
            requestStartDate,
            requestEndDate
          );

          // Return the processed data
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              dataset_id,
              name: dataset_id,
              location: { lat, lng: lon },
              timeSeriesData,
            })
          );
        } catch (error) {
          console.error("Error fetching weather data:", error);

          // If the API call failed, generate mock data
          if (
            error.message.includes("quota") ||
            error.message.includes("exceeded")
          ) {
            console.warn(
              "API quota exceeded. Consider upgrading your Visual Crossing plan."
            );
          } else if (
            error.message.includes("invalid key") ||
            error.message.includes("unauthorized")
          ) {
            console.warn(
              "API key appears to be invalid. Check your .env configuration."
            );
          }

          // Generate mock data as fallback
          const mockTimeSeriesData = generateTimeSeriesData(
            dataset_id,
            lat,
            lon,
            start_date,
            end_date
          );

          // Return the mock data with a flag indicating it's mock data
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              dataset_id,
              name: dataset_id,
              location: { lat, lng: lon },
              timeSeriesData: mockTimeSeriesData,
              isMockData: true,
            })
          );
        }

        return;
      } catch (error) {
        console.error("Error processing time series request:", error);
        res.writeHead(500);
        res.end(
          JSON.stringify({ error: "Failed to process time series request" })
        );
        return;
      }
    }

    // If no API endpoint matched
    res.writeHead(404);
    res.end(
      JSON.stringify({
        error: "API endpoint not found",
        requested: {
          method: req.method,
          url: req.url,
        },
        available_endpoints: [
          { method: "GET", url: "/api/health" },
          { method: "GET", url: "/api/test" },
          { method: "POST", url: "/api/auth/login" },
          { method: "POST", url: "/api/auth/register" },
          { method: "GET", url: "/api/weather-data/datasets" },
          { method: "POST", url: "/api/weather-data/time-series" },
          { method: "GET", url: "/api/weather/timeline" },
          { method: "GET", url: "/api/weather/forecast" },
        ],
      })
    );
    return;
  }

  // For non-API requests, handle static files and SPA routes
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const extname = String(path.extname(pathname)).toLowerCase();

  // If the request has a file extension, serve it as a static file
  if (extname) {
    let filePath = path.join(__dirname, "resources/public", pathname);

    // Security check to ensure we don't serve files outside of resources/public
    const normalizedFilePath = path.normalize(filePath);
    const publicDir = path.join(__dirname, "resources/public");

    if (!normalizedFilePath.startsWith(publicDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404);
        res.end("404 Not Found");
        return;
      }

      // Serve the file
      const contentType = MIME_TYPES[extname] || "application/octet-stream";

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(content, "utf-8");
        }
      });
    });
  } else {
    // If no file extension, serve index.html for SPA routing
    const filePath = path.join(__dirname, "resources/public", "index.html");

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content, "utf-8");
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`Default login: user@example.com / password`);
});

// Function to process Visual Crossing weather data based on dataset type
function processWeatherDataByDatasetType(
  weatherData,
  datasetId,
  startDate,
  endDate
) {
  console.log(`Processing ${datasetId} data from Visual Crossing API`);

  if (!weatherData || !weatherData.days || !Array.isArray(weatherData.days)) {
    console.warn("Invalid or empty weather data received");
    return [];
  }

  // Calculate the full range of dates we should have
  const start = new Date(startDate);
  const end = new Date(endDate);
  const expectedDates = [];

  // Generate an array of all dates in the range (inclusive of both start and end)
  const currentDate = new Date(start);
  while (currentDate <= end) {
    expectedDates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`Expecting data for dates: ${expectedDates.join(", ")}`);

  // Create a map of the data we received
  const receivedDataMap = {};
  weatherData.days.forEach((day) => {
    receivedDataMap[day.datetime] = day;
  });

  // Map the days data to our format based on the dataset type
  // Ensuring we include every date in the expected range
  return expectedDates
    .map((date) => {
      // If we have data for this date, use it
      const day = receivedDataMap[date];
      let value = null;

      if (day) {
        switch (datasetId) {
          case "temperature":
            value = day.temp; // Average temperature for the day
            break;
          case "temperature-high":
            value = day.tempmax; // Maximum temperature
            break;
          case "temperature-low":
            value = day.tempmin; // Minimum temperature
            break;
          case "temperature-historical":
            value = day.temp; // Same as temperature for historical data
            break;
          case "feels-like":
            value = day.feelslike; // Feels like temperature
            break;
          case "precipitation":
            value = day.precip; // Precipitation amount
            break;
          case "humidity":
            value = day.humidity; // Humidity percentage
            break;
          case "wind-speed":
            value = day.windspeed; // Wind speed
            break;
          case "uv-index":
            value = day.uvindex; // UV index
            break;
          case "cloud-cover":
            value = day.cloudcover; // Cloud cover percentage
            break;
          default:
            // Default to temperature if dataset is not recognized
            console.warn(
              `Unknown dataset type: ${datasetId}, defaulting to temperature`
            );
            value = day.temp;
        }
      } else {
        console.warn(`Missing data for date: ${date}, will interpolate`);
        // For missing dates, we could interpolate or generate a value
        // For now, we'll just use null to indicate missing data
      }

      return {
        timestamp: date,
        value,
      };
    })
    .filter((point) => point.value !== null); // Remove points with null values
}

// Helper function to generate mock time series data
function generateTimeSeriesData(datasetId, lat, lon, startDate, endDate) {
  console.log(
    `Generating mock time series data for dataset ${datasetId} at ${lat},${lon}`
  );

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  // Ensure we generate data for the entire requested range, not just 7 days
  const numPoints = daysDiff + 1; // Add 1 to include the end date

  // Generate different base values based on the dataset type
  const baseValue = getBaseValueForDataset(datasetId, lat);

  const mockData = [];

  for (let i = 0; i < numPoints; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    // Add some randomness and a trend
    const randomFactor = (Math.random() - 0.5) * 2; // Between -1 and 1
    const trendFactor = (i / numPoints) * 0.5; // Slight upward trend
    const seasonalFactor = Math.sin((date.getDate() / 30) * Math.PI) * 0.3; // Seasonal variation

    let value = baseValue + randomFactor * 3 + trendFactor + seasonalFactor;

    // Ensure reasonable values
    value = Math.max(0, value); // No negative values except for temperature
    if (datasetId === "humidity" || datasetId === "cloud-cover") {
      value = Math.min(100, value); // Max 100% for percentages
    }

    mockData.push({
      timestamp: date.toISOString().split("T")[0],
      value: parseFloat(value.toFixed(2)),
    });
  }

  return mockData;
}

// Helper to get base value for different dataset types
function getBaseValueForDataset(datasetId, lat) {
  // Use latitude to adjust base values (simple approximation)
  const temperatureAdjustment =
    Math.abs(lat) > 45 ? -5 : Math.abs(lat) < 23 ? 10 : 0;

  // Different base values for different dataset types
  switch (datasetId) {
    case "temperature":
      return 20 + temperatureAdjustment; // Base temperature around 20°C
    case "temperature-historical":
      return 18 + temperatureAdjustment; // Slightly cooler historical
    case "temperature-forecast":
      return 22 + temperatureAdjustment; // Slightly warmer forecast
    case "feels-like":
      return 19 + temperatureAdjustment; // Feels like
    case "precipitation":
      return 5; // Base precipitation around 5mm
    case "humidity":
      return 65; // Base humidity around 65%
    case "wind-speed":
      return 15; // Base wind speed around 15km/h
    case "uv-index":
      return 5; // Base UV index around 5
    case "cloud-cover":
      return 40; // Base cloud cover around 40%
    default:
      return 50; // Generic base value
  }
}
