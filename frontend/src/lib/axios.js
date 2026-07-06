import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout: 10000,
});

// Mock delay to simulate network latency for loading states (only in development)
const MOCK_DELAY_MS = 800;

apiClient.interceptors.request.use(
  async (config) => {
    // Artificial delay for mock services when not in production
    if (import.meta.env.MODE !== 'production') {
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    }

    // You can attach auth tokens here later
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle global errors here (e.g., redirect on 401)
    return Promise.reject(error);
  }
);

export default apiClient;
