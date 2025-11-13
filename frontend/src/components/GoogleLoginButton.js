/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const GoogleLoginButton = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Open the Google login page in a popup window
    const popup = window.open(
      'http://localhost:5000/api/auth/google',
      '_blank',
      'width=500,height=600'
    );
  };

  useEffect(() => {
    // This listener waits for the message from the popup window
    const handleMessage = (event) => {
      
      // ** THIS IS THE FIX **
      // The message is coming from our backend's script (port 5000),
      // not the frontend (port 3000).
      if (event.origin !== 'http://localhost:5000') {
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