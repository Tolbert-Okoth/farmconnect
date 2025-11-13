import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';

const VerifyEmailPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { token } = useParams();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('No verification token found.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get(`/auth/verify-email/${token}`);
        setMessage(data.message || 'Email verified successfully! You can now log in.');
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Email verification failed.');
        setLoading(false);
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="form-container text-center">
      <h1 className="text-green-dark">Email Verification</h1>
      {loading && <Loader />}
      {error && <Message variant="danger">{error}</Message>}
      {message && (
        <Message variant="success">
          {message}
          <br />
          <Link to="/login" className="btn btn-primary mt-3">
            Go to Login
          </Link>
        </Message>
      )}
    </div>
  );
};

export default VerifyEmailPage;