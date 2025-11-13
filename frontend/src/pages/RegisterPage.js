import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import PasswordStrength from '../components/PasswordStrength';
import useAuth from '../hooks/useAuth';
import api from '../api/axiosConfig';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success message

  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useAuth();

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, userInfo, redirect]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    // You can add more complex password strength logic here if needed
    if (password.length < 6) {
       setError('Password must be at least 6 characters long');
       toast.error('Password must be at least 6 characters long');
       setLoading(false);
       return;
    }

    try {
      await api.post('/auth/register', {
        username,
        email,
        password,
        role,
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      setMessage('Registration successful! Please check your email to verify your account.');
      setLoading(false);
      // Don't log in, wait for verification
      // navigate('/login'); 
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1 className="text-green-dark">Sign Up</h1>
      {error && <Message variant="danger">{error}</Message>}
      {message && <Message variant="success">{message}</Message>}
      {loading && <Loader />}
      {!message && ( // Hide form on success
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="role" className="mb-3">
            <Form.Label>I am a...</Form.Label>
            <Form.Check
              type="radio"
              label="Buyer (I want to purchase produce)"
              id="buyer-radio"
              name="role"
              value="buyer"
              checked={role === 'buyer'}
              onChange={(e) => setRole(e.target.value)}
            />
            <Form.Check
              type="radio"
              label="Farmer (I want to sell produce)"
              id="farmer-radio"
              name="role"
              value="farmer"
              checked={role === 'farmer'}
              onChange={(e) => setRole(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>

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
            <PasswordStrength password={password} />
          </Form.Group>

          <Form.Group controlId="confirmPassword">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>

          <Button type="submit" variant="primary" className="mt-3 w-100">
            Register
          </Button>
        </Form>
      )}

      <Row className="py-3">
        <Col>
          Have an Account?{' '}
          <Link to={redirect ? `/login?redirect=${redirect}` : '/login'}>
            Login
          </Link>
        </Col>
      </Row>
    </div>
  );
};

export default RegisterPage;