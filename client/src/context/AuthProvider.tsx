import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

interface User {
    id: number;
    email: string;
    fullName: string;
    role: string;
}

interface Tenant {
    id: string;
    name: string;
    branding: {
        primary_color: string;
        logo_url: string;
    };
}

interface AuthContextType {
    user: User | null;
    tenant: Tenant | null;
    login: (token: string, userData: User, tenantData: Tenant) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    tenant: null,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
    isLoading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate State from LocalStorage on load
    useEffect(() => {
        const initializeAuth = () => {
            const storedUser = localStorage.getItem('user');
            const storedTenant = localStorage.getItem('tenant');
            const token = localStorage.getItem('token');

            if (token && storedUser && storedTenant) {
                try {
                    setUser(JSON.parse(storedUser));
                    setTenant(JSON.parse(storedTenant));
                    // Set Default Header
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } catch (e) {
                    console.error("Error parsing stored auth data", e);
                    localStorage.clear();
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    // Inactivity Timeout (e.g., 30 minutes)
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            // 10 minutes of inactivity
            timeoutId = setTimeout(() => {
                if (localStorage.getItem('token')) {
                    console.log("Session expired due to inactivity");
                    logout();
                }
            }, 10 * 60 * 1000);
        };

        if (user) {
            // Events that count as activity
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
            events.forEach(event => document.addEventListener(event, resetTimer));
            resetTimer();

            return () => {
                if (timeoutId) clearTimeout(timeoutId);
                events.forEach(event => document.removeEventListener(event, resetTimer));
            };
        }
    }, [user]);

    const login = (token: string, userData: User, tenantData: Tenant) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('tenant', JSON.stringify(tenantData));

        setUser(userData);
        setTenant(tenantData);

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Inject Branding Dynamically
        if (tenantData.branding?.primary_color) {
            document.documentElement.style.setProperty('--primary-color', tenantData.branding.primary_color);
        }
    };

    const logout = () => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');

        // Clear state
        setUser(null);
        setTenant(null);

        // Clear auth header
        delete api.defaults.headers.common['Authorization'];

        // Reset Branding
        document.documentElement.style.removeProperty('--primary-color');

        // Force redirect to login page
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, tenant, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
