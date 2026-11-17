import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => (
  <footer className="soko-footer">
    <div className="soko-awning" aria-hidden="true" />
    <Container className="soko-footer-inner">
      <div>
        <strong>FarmConnect</strong>
        <div>Straight from the shamba, paid with M-Pesa.</div>
      </div>
      <div>&copy; {new Date().getFullYear()} FarmConnect · Built in Nairobi</div>
    </Container>
  </footer>
);

export default Footer;
