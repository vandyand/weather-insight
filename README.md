# ClimateInsight

ClimateInsight is a full-stack React/Node.js application for visualizing climate data through interactive maps and time-series analysis. This project showcases skills in JavaScript/React programming, reactive UI development, and geospatial data processing.

## Features

- **Interactive Maps**: Explore climate data spatially with interactive maps powered by Mapbox GL.
- **Time Series Analysis**: Analyze trends over time with interactive charts showing historical climate data.
- **Multiple Datasets**: Access various climate datasets including temperature, precipitation, sea level, and CO2 levels.
- **Spatial Queries**: Perform location-based analysis with the Visual Crossing Weather API.

## Technology Stack

- **Frontend**: React.js with Styled Components and Context API for state management
- **Backend**: Node.js with HTTP server
- **Maps**: Mapbox GL integration
- **Weather Data**: Visual Crossing Weather API

## Getting Started

### Prerequisites

- Node.js and npm

### Setup

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/climate-insight.git
   cd climate-insight
   ```

2. Start the application:

   ```
   ./start-react-app.sh
   ```

   This script will:

   - Check for any running server instances and stop them
   - Create a `.env` file from the example if needed
   - Install npm dependencies for the frontend
   - Build and deploy the React frontend
   - Start the Node.js server

3. Open your browser at [http://localhost:8080](http://localhost:8080)

## Project Structure

- `/frontend` - React frontend code
  - `/src` - Source code
    - `/components` - UI components
    - `/context` - React Context for state management
    - `/pages` - Page components
    - `/services` - API services
    - `/hooks` - Custom React hooks
    - `/utils` - Utility functions
- `/resources` - Static resources
  - `/public` - Public assets (built React app)

## Deployment

To build a production version of the project:

```
cd frontend
npm run deploy
```

Then deploy the contents of the `resources/public` directory to any static web server, along with the Node.js server.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Weather data provided by Visual Crossing Weather API
- Mapbox for their mapping platform
