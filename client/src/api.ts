import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor to inject Authorization header
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If token exists, attach it to headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log error for debugging
        console.error('API Error:', error);

        // Extract error message
        const message = error.response?.data?.message
            || error.response?.data?.error
            || error.message
            || 'Ha ocurrido un error desconocido';

        // Si el token es inválido, ha expirado, o no hay permisos, cerramos sesión automáticamente
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('Sesión inválida o expirada. Redirigiendo al login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tenant');
            window.location.href = '/login';
        }

        // You can integrate with ToastNotification here if needed
        // For now, we'll just enhance the error object
        const enhancedError = {
            ...error,
            userMessage: message,
            statusCode: error.response?.status || 500,
        };

        return Promise.reject(enhancedError);
    }
);

export default api;
