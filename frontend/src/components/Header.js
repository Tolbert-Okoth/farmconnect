import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import SearchBox from './SearchBox';

const Header = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const logoutHandler = () => {
    logout();
    navigate('/login');
  };

  return (
    <header>
      <Navbar className="bg-green-dark" variant="dark" expand="lg" collapseOnSelect>
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>
              <i className="fas fa-leaf"></i> FarmConnect
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <SearchBox />
            <Nav className="ms-auto">
              {userInfo ? (
                <NavDropdown title={userInfo.username} id="username">
                  {userInfo.role === 'farmer' && (
                    <LinkContainer to="/farmer/dashboard">
                      <NavDropdown.Item>Farmer Dashboard</NavDropdown.Item>
                    </LinkContainer>
                  )}
                  {userInfo.role === 'buyer' && (
                    <LinkContainer to="/buyer/dashboard">
                      <NavDropdown.Item>My Orders</NavDropdown.Item>
                    </LinkContainer>
                  )}
                   <LinkContainer to="/chat">
                      <NavDropdown.Item>My Chats</NavDropdown.Item>
                    </LinkContainer>

                    {userInfo.is_admin && (
                    <>
                      <NavDropdown.Divider />
                      <LinkContainer to="/admin/dashboard">
                        <NavDropdown.Item>
                          <strong>Admin Dashboard</strong>
                        </NavDropdown.Item>
                      </LinkContainer>
                    </>
                  )}



                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logoutHandler}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link>
                    <i className="fas fa-user"></i> Sign In
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;