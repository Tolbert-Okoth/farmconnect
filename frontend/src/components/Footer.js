import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-light mt-auto py-3">
      <Container>
        <Row>
          <Col className="text-center text-muted">
            Copyright &copy; FarmConnect {new Date().getFullYear()}
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;