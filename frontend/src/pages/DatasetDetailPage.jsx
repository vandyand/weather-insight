import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDatasetContext } from "../context/DatasetContext";
import styled from "styled-components";

const Container = styled.div`
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  background-color: transparent;
  border: none;
  color: #3498db;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 1rem;
  margin-bottom: 1rem;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const MetadataCard = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
`;

const MetadataLabel = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
`;

const MetadataValue = styled.div`
  font-size: 1.125rem;
  font-weight: 500;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
`;

const Description = styled.p`
  line-height: 1.6;
  color: #4a4a4a;
  margin-bottom: 1.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
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
    border: 1px solid #dee2e6;

    &:hover {
      background-color: #e9ecef;
    }
  }
`;

const Loading = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;

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

const DatasetDetailPage = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { datasets, isLoading, setSelectedDataset } = useDatasetContext();
  const [dataset, setDataset] = useState(null);

  console.log(`[DatasetDetailPage] Rendering with datasetId: ${datasetId}`);

  useEffect(() => {
    if (datasets && datasetId) {
      const foundDataset = datasets.find((d) => d.id === datasetId);
      setDataset(foundDataset);

      if (!foundDataset) {
        console.log(
          `[DatasetDetailPage] Dataset with id ${datasetId} not found`
        );
      }
    }
  }, [datasets, datasetId]);

  const handleExploreOnMap = () => {
    setSelectedDataset(datasetId);
    navigate("/map");
  };

  const handleBack = () => {
    navigate("/datasets");
  };

  if (isLoading) {
    return (
      <Container>
        <Loading>
          <div className="spinner"></div>
        </Loading>
      </Container>
    );
  }

  if (!dataset) {
    return (
      <Container>
        <BackButton onClick={handleBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
            />
          </svg>
          Back to Datasets
        </BackButton>
        <div>Dataset not found</div>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={handleBack}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
          />
        </svg>
        Back to Datasets
      </BackButton>

      <Header>
        <Title>{dataset.name}</Title>
      </Header>

      <MetadataGrid>
        <MetadataCard>
          <MetadataLabel>Source</MetadataLabel>
          <MetadataValue>{dataset.source}</MetadataValue>
        </MetadataCard>

        <MetadataCard>
          <MetadataLabel>Unit</MetadataLabel>
          <MetadataValue>{dataset.unit}</MetadataValue>
        </MetadataCard>

        {dataset.time_range && (
          <MetadataCard>
            <MetadataLabel>Time Range</MetadataLabel>
            <MetadataValue>{dataset.time_range}</MetadataValue>
          </MetadataCard>
        )}
      </MetadataGrid>

      <Section>
        <SectionTitle>Description</SectionTitle>
        <Description>{dataset.description}</Description>
      </Section>

      <ButtonGroup>
        <Button className="primary" onClick={handleExploreOnMap}>
          Explore on Map
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default DatasetDetailPage;
