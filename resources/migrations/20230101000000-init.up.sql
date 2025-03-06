-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source VARCHAR(255),
  source_url TEXT,
  time_range TSTZRANGE,
  spatial_coverage GEOMETRY(POLYGON, 4326),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dataset variables table
CREATE TABLE IF NOT EXISTS dataset_variables (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  long_name TEXT,
  units VARCHAR(50),
  description TEXT,
  data_type VARCHAR(50),
  colormap VARCHAR(50),
  min_value FLOAT,
  max_value FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data points table - for storing time series data
CREATE TABLE IF NOT EXISTS data_points (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  variable_id INTEGER REFERENCES dataset_variables(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  location GEOMETRY(POINT, 4326) NOT NULL,
  value FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial indices
CREATE INDEX data_points_location_idx ON data_points USING GIST (location);
CREATE INDEX datasets_spatial_coverage_idx ON datasets USING GIST (spatial_coverage);

-- Create timestamp indices
CREATE INDEX data_points_timestamp_idx ON data_points(timestamp);
CREATE INDEX data_points_dataset_timestamp_idx ON data_points(dataset_id, timestamp);

-- Sample dataset entries
INSERT INTO datasets (name, description, source, source_url, metadata) 
VALUES 
  ('Global Surface Temperature', 'Global land surface temperature measurements', 'NASA GISS', 'https://data.giss.nasa.gov/gistemp/', '{"resolution": "2.5 degree", "frequency": "monthly"}'),
  ('Sea Level Rise', 'Global mean sea level measurements', 'NASA JPL', 'https://sealevel.nasa.gov/', '{"resolution": "global", "frequency": "monthly"}'),
  ('Arctic Sea Ice Extent', 'Arctic sea ice measurements', 'NSIDC', 'https://nsidc.org/data/seaice_index/', '{"resolution": "25km", "frequency": "daily"}');

-- Sample dataset variables
INSERT INTO dataset_variables (dataset_id, name, long_name, units, description, data_type, colormap) 
VALUES 
  (1, 'temp_anomaly', 'Temperature Anomaly', 'Celsius', 'Difference from long-term average temperature', 'float', 'RdBu_r'),
  (2, 'sea_level', 'Sea Level', 'mm', 'Global mean sea level relative to 1993-2008 average', 'float', 'Blues'),
  (3, 'ice_extent', 'Sea Ice Extent', 'million km²', 'Total area covered by sea ice', 'float', 'Blues_r'); 