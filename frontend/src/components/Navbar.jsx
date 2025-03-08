import React from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";

const Nav = styled.nav`
  background-color: #2c3e50;
  color: white;
  padding: 0.5rem 1rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-decoration: none;

  &:hover {
    color: #3498db;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;

  &:hover {
    color: #3498db;
  }

  &.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #3498db;
  }
`;

const AuthLinks = styled.div`
  display: flex;
  gap: 1rem;
`;

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <Nav>
      <NavContainer>
        <Logo to="/">ClimateInsight</Logo>

        <NavLinks>
          {isAuthenticated ? (
            <>
              <NavLink to="/" className={isActive("/") ? "active" : ""}>
                Home
              </NavLink>
              <NavLink to="/map" className={isActive("/map") ? "active" : ""}>
                Map Explorer
              </NavLink>
              <NavLink
                to="/datasets"
                className={isActive("/datasets") ? "active" : ""}
              >
                Datasets
              </NavLink>
            </>
          ) : (
            <NavLink to="/" className={isActive("/") ? "active" : ""}>
              Home
            </NavLink>
          )}
        </NavLinks>

        <AuthLinks>
          {isAuthenticated ? (
            <>
              <span style={{ margin: "auto 1rem", color: "#ecf0f1" }}>
                Hello, {user?.name}
              </span>
              <NavLink
                as="button"
                onClick={logout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                Logout
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={isActive("/login") ? "active" : ""}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={isActive("/register") ? "active" : ""}
              >
                Register
              </NavLink>
            </>
          )}
        </AuthLinks>
      </NavContainer>
    </Nav>
  );
};

export default Navbar;
