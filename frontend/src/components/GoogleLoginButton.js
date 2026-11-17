/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_ORIGIN } from '../api/config';

const GoogleLoginButton = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Open the Google login page in a popup window
    const popup = window.open(
      `${API_ORIGIN}/api/auth/google`,
      '_blank',
      'width=500,height=600'
    );
  };

  useEffect(() => {
    // This listener waits for the message from the popup window
    const handleMessage = (event) => {
      
      // Only trust messages sent by our own backend's sign-in page
      if (event.origin !== API_ORIGIN) {
        return;
      }

      const userData = event.data;
      if (userData && userData.token) {
        // We got the user data and token!
        login(userData);
        toast.success('Logged in successfully with Google!');
        
        // Redirect based on role
        if (userData.role === 'farmer') {
          navigate('/farmer/dashboard');
        } else {
          navigate('/buyer/dashboard');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Clean up the listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [login, navigate]);

  return (
    <Button
      variant="outline-primary"
      className="w-100 my-2"
      onClick={handleGoogleLogin}
    >
      <i className="fab fa-google"></i> Sign In with Google
    </Button>
  );
};

export default GoogleLoginButton;