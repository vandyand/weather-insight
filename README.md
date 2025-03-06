# ClimateInsight

ClimateInsight is a full-stack ClojureScript/Clojure application for visualizing climate data through interactive maps and time-series analysis. This project showcases skills in functional programming, reactive UI development, and geospatial data processing.

## Features

- **Interactive Maps**: Explore climate data spatially with interactive maps powered by Mapbox GL.
- **Time Series Analysis**: Analyze trends over time with interactive charts showing historical climate data.
- **Multiple Datasets**: Access various climate datasets including temperature, precipitation, sea level, and CO2 levels.
- **Spatial Queries**: Perform location-based analysis with PostgreSQL/PostGIS integration.

## Technology Stack

- **Frontend**: ClojureScript with Reagent and re-frame
- **Backend**: Clojure with Ring/Compojure
- **Database**: PostgreSQL with PostGIS extension
- **Maps**: Mapbox GL integration
- **Styling**: Custom CSS

## Getting Started

### Prerequisites

- Clojure CLI tools
- Node.js and npm
- PostgreSQL with PostGIS extension

### Setup

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/climate-insight.git
   cd climate-insight
   ```

2. Setup the development environment:

   ```
   ./setup-dev.sh
   ```

   This script will:

   - Check for required dependencies
   - Create a PostgreSQL database with the PostGIS extension
   - Install npm dependencies
   - Create a `.env` file from the example

3. Start the development server:

   ```
   npm run dev
   ```

4. Open your browser at [http://localhost:8080](http://localhost:8080)

## Project Structure

- `/src` - Source code
  - `/climate_insight_cljs` - ClojureScript frontend code
    - `/views` - UI components
    - `/events` - re-frame event handlers
    - `/subs` - re-frame subscriptions
  - `/climate_insight` - Clojure backend code
- `/resources` - Static resources
  - `/public` - Public assets (HTML, CSS, images)
- `/test` - Tests

## Deployment

To build a production version of the project:

```
npm run build
```

Then deploy the contents of the `resources/public` directory to any static web server.

## Docker

A Dockerfile is provided for containerized deployment:

```
docker build -t climate-insight .
docker run -p 80:80 climate-insight
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Data sources: NASA GISS, NOAA, CSIRO, and others
- Mapbox for their mapping platform
- The Clojure and ClojureScript communities
