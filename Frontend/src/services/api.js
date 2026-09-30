import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tesla_pool_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with Concurrency UI Catch & normalized errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    let customMessage = error.response?.data?.message || error.message || "An unexpected error occurred";

    // Blueprint Requirement: The Concurrency UI Catch (409 Conflict)
    if (status === 409) {
      if (customMessage.toLowerCase().includes("seat") || customMessage.toLowerCase().includes("capacity")) {
        customMessage = "Sorry, this seat was just taken by someone else!";
      }
    }

    if (status === 401) {
      // Clear token on authentication failure
      localStorage.removeItem("tesla_pool_token");
      localStorage.removeItem("tesla_pool_user");
    }

    const enhancedError = new Error(customMessage);
    enhancedError.status = status;
    enhancedError.data = error.response?.data;
    return Promise.reject(enhancedError);
  }
);

export default api;
