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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    tenant: null,
    login: () => { },
    logout: () => { },
    isAuthenticated: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // Hydrate State from LocalStorage on load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedTenant = localStorage.getItem('tenant');
        const token = localStorage.getItem('token');

        if (token && storedUser && storedTenant) {
            setUser(JSON.parse(storedUser));
            setTenant(JSON.parse(storedTenant));

            // Set Default Header
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

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
        <AuthContext.Provider value={{ user, tenant, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
