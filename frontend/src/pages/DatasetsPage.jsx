import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasetContext } from "../context/DatasetContext";
import styled from "styled-components";

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
`;

const DatasetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const DatasetCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const DatasetTitle = styled.h2`
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const DatasetDescription = styled.p`
  color: #666;
  margin-bottom: 1rem;
`;

const DatasetMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;

  span {
    font-size: 0.9rem;
    background-color: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &.primary {
    background-color: #3498db;
    color: white;

    &:hover {
      background-color: #2980b9;
    }
  }

  &.secondary {
    background-color: #f8f9fa;
    color: #333;

    &:hover {
      background-color: #e9ecef;
    }
  }
`;

const Loading = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;

  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: #3498db;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const DatasetsPage = () => {
  const { datasets, isLoading, error } = useDatasetContext();
  const navigate = useNavigate();

  console.log("[DatasetsPage] Rendering with datasets:", datasets?.length || 0);

  const handleViewDetails = (datasetId) => {
    navigate(`/datasets/${datasetId}`);
  };

  const handleExploreOnMap = (datasetId) => {
    navigate(`/map?dataset=${datasetId}`);
  };

  return (
    <Container>
      <Title>Available Climate Datasets</Title>

      {isLoading ? (
        <Loading>
          <div className="spinner"></div>
          <p>Loading datasets...</p>
        </Loading>
      ) : error ? (
        <div>Error loading datasets: {error}</div>
      ) : (
        <DatasetsGrid>
          {datasets &&
            datasets.map((dataset) => (
              <DatasetCard key={dataset.id}>
                <DatasetTitle>{dataset.name}</DatasetTitle>
                <DatasetDescription>{dataset.description}</DatasetDescription>
                <DatasetMeta>
                  <span>Source: {dataset.source}</span>
                  <span>Unit: {dataset.unit}</span>
                  {dataset.time_range && (
                    <span>Time Range: {dataset.time_range}</span>
                  )}
                </DatasetMeta>
                <ButtonGroup>
                  <Button
                    className="primary"
                    onClick={() => handleExploreOnMap(dataset.id)}
                  >
                    Explore on Map
                  </Button>
                  <Button
                    className="secondary"
                    onClick={() => handleViewDetails(dataset.id)}
                  >
                    View Details
                  </Button>
                </ButtonGroup>
              </DatasetCard>
            ))}

          {(!datasets || datasets.length === 0) && (
            <div>No datasets available.</div>
          )}
        </DatasetsGrid>
      )}
    </Container>
  );
};

export default DatasetsPage;
