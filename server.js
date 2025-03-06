const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;

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

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle API requests
  if (req.url.startsWith("/api/")) {
    res.setHeader("Content-Type", "application/json");

    // Health check endpoint
    if (req.url === "/api/health" && req.method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
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
    if (req.url === "/api/climate-data/datasets" && req.method === "GET") {
      const datasets = [
        {
          id: "temperature",
          name: "Global Surface Temperature",
          description:
            "Monthly global surface temperature anomalies from 1880 to present",
          source: "NASA GISS",
          unit: "°C",
          time_range: "1880-present",
        },
        {
          id: "precipitation",
          name: "Global Precipitation",
          description: "Monthly global precipitation data",
          source: "NOAA",
          unit: "mm",
          time_range: "1950-present",
        },
        {
          id: "sea-level",
          name: "Sea Level Rise",
          description: "Global mean sea level change data",
          source: "CSIRO",
          unit: "mm",
          time_range: "1993-present",
        },
        {
          id: "co2",
          name: "Atmospheric CO2",
          description: "Atmospheric carbon dioxide concentration",
          source: "NOAA ESRL",
          unit: "ppm",
          time_range: "1958-present",
        },
      ];

      res.writeHead(200);
      res.end(JSON.stringify({ datasets }));
      return;
    }

    // If no API endpoint matched
    res.writeHead(404);
    res.end(JSON.stringify({ error: "API endpoint not found" }));
    return;
  }

  // For non-API requests, serve static files as before
  let filePath = path.join(
    __dirname,
    "resources/public",
    req.url === "/" ? "index.html" : req.url
  );

  // Security check to ensure we don't serve files outside of resources/public
  const normalizedFilePath = path.normalize(filePath);
  const publicDir = path.join(__dirname, "resources/public");

  if (!normalizedFilePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();

  // Handle SPA routes by serving index.html
  if (
    req.url === "/app" ||
    req.url.startsWith("/login") ||
    req.url.startsWith("/register") ||
    req.url.startsWith("/map") ||
    req.url.startsWith("/datasets")
  ) {
    filePath = path.join(__dirname, "resources/public", "index.html");
  }

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If the file doesn't exist, serve a 404 page
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
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`Default login: user@example.com / password`);
});
