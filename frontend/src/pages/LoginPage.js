import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import GoogleLoginButton from '../components/GoogleLoginButton'; // <-- Import
import useAuth from '../hooks/useAuth';
import api from '../api/axiosConfig';
import { toast } from 'react-toastify';

const LoginPage = () => {
  // ... (all state and functions remain the same) ...
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, login } = useAuth();

  const redirect = location.search ? `/${location.search.split('=')[1]}` : '/';

  useEffect(() => {
    if (userInfo) {
      if (userInfo.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }
    }
  }, [navigate, userInfo, redirect]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      toast.success('Logged in successfully!');
      
      if (data.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }

    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };


  return (
    <div className="form-container">
      <h1 className="text-green-dark">Sign In</h1>
      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}
      
      {/* ** ADDED GOOGLE BUTTON ** */}
      <GoogleLoginButton />
      
      <Row className="my-3">
        <Col><hr /></Col>
        <Col xs="auto" className="text-muted">OR</Col>
        <Col><hr /></Col>
      </Row>

      <Form onSubmit={submitHandler}>
        <Form.Group controlId="email">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="password">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            ></Form.Control>
            <Button
              variant="outline-secondary"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
            </Button>
          </InputGroup>
        </Form.Group>

        <Button type="submit" variant="primary" className="mt-3 w-100">
          Sign In
        </Button>
      </Form>

      <Row className="py-3">
        <Col>
          New Customer?{' '}
          <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
            Register
          </Link>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;