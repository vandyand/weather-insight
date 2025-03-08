import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const Container = styled.div`
  max-width: 800px;
  margin: 5rem auto;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #2c3e50;
`;

const Subtitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #7f8c8d;
`;

const Text = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: #7f8c8d;
`;

const StyledLink = styled(Link)`
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
`;

const NotFoundPage = () => {
  return (
    <Container>
      <Title>404</Title>
      <Subtitle>Page Not Found</Subtitle>
      <Text>The page you are looking for doesn't exist or has been moved.</Text>
      <StyledLink to="/">Go Back Home</StyledLink>
    </Container>
  );
};

export default NotFoundPage;
