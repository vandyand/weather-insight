import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";

const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const HeroSection = styled.section`
  text-align: center;
  padding: 4rem 0;
  background: linear-gradient(rgba(44, 62, 80, 0.7), rgba(44, 62, 80, 0.9));
  color: white;
  border-radius: 8px;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.6;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }

  &.secondary {
    background-color: transparent;
    border: 2px solid #3498db;

    &:hover {
      background-color: rgba(52, 152, 219, 0.1);
    }
  }
`;

const FeaturesSection = styled.section`
  padding: 3rem 0;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
`;

const FeatureCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
`;

const FeatureDescription = styled.p`
  color: #7f8c8d;
  line-height: 1.6;
`;

const TechSection = styled.section`
  padding: 3rem 0;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 3rem;
`;

const TechGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
`;

const TechItem = styled.div`
  text-align: center;
  padding: 1.5rem;
`;

const TechTitle = styled.h4`
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const TechDescription = styled.p`
  color: #7f8c8d;
`;

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <HomeContainer>
      <HeroSection>
        <Title>WeatherMap Explorer</Title>
        <Subtitle>
          An interactive platform for visualizing weather data through maps and
          time-series graphs
        </Subtitle>

        <ButtonContainer>
          {isAuthenticated ? (
            <Button to="/map">Explore Weather Data</Button>
          ) : (
            <>
              <Button to="/login">Get Started</Button>
              <Button to="/register" className="secondary">
                Create Account
              </Button>
            </>
          )}
        </ButtonContainer>
      </HeroSection>

      <FeaturesSection>
        <SectionTitle>Features</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureTitle>Interactive Maps</FeatureTitle>
            <FeatureDescription>
              Explore weather data spatially with interactive maps powered by
              Mapbox GL.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureTitle>Time Series Analysis</FeatureTitle>
            <FeatureDescription>
              Analyze trends over time with interactive charts showing
              historical weather data.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureTitle>Multiple Datasets</FeatureTitle>
            <FeatureDescription>
              Access various weather datasets including temperature,
              precipitation, and more.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureTitle>Spatial Queries</FeatureTitle>
            <FeatureDescription>
              Perform location-based analysis with the power of PostgreSQL and
              PostGIS.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>

      <TechSection>
        <SectionTitle>Technology Stack</SectionTitle>
        <TechGrid>
          <TechItem>
            <TechTitle>Frontend</TechTitle>
            <TechDescription>
              React with styled-components for UI
            </TechDescription>
          </TechItem>

          <TechItem>
            <TechTitle>Backend</TechTitle>
            <TechDescription>
              Clojure with Ring and PostgreSQL/PostGIS
            </TechDescription>
          </TechItem>

          <TechItem>
            <TechTitle>Visualization</TechTitle>
            <TechDescription>
              Mapbox GL for maps, React Charts for data visualization
            </TechDescription>
          </TechItem>

          <TechItem>
            <TechTitle>Architecture</TechTitle>
            <TechDescription>
              Modern React with Context API and hooks for state management
            </TechDescription>
          </TechItem>
        </TechGrid>
      </TechSection>
    </HomeContainer>
  );
};

export default HomePage;
