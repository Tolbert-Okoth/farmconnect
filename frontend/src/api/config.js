// Backend origin. Set REACT_APP_API_URL in frontend/.env (e.g. https://farmconnect-api.onrender.com).
export const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
