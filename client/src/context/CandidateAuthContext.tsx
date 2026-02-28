import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

interface CandidateUser {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    avatar?: string;
    ciudad?: string;
    titulo_profesional?: string;
    biografia?: string;
}

interface CandidateAuthContextType {
    user: CandidateUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    updateProfile: (data: any) => Promise<void>;
}

const CandidateAuthContext = createContext<CandidateAuthContextType | undefined>(undefined);

export const CandidateAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<CandidateUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('candidateToken');
            const storedUser = localStorage.getItem('candidateUser');

            if (token && storedUser) {
                // 1. Setear token INMEDIATAMENTE para que las llamadas subsiguientes funcionen
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // 2. Cargar usuario del storage para UI instantánea
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                }

                // 3. Verificar validez del token en background usando el endpoint LEGACY correcto
                try {
                    const response = await api.get('/candidate-auth/profile');
                    const profileData = response.data.candidate || response.data;
                    setUser(profileData);
                    localStorage.setItem('candidateUser', JSON.stringify(profileData));
                } catch (error) {
                    console.error('Session validation failed:', error);
                    // Si falla por 401 o 403, limpiar sesión
                    const status = (error as any).response?.status;
                    if (status === 401 || status === 403) {
                        logout();
                    }
                    // Para otros errores (500, network), mantener la sesión del localStorage
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string) => {
        console.log('🔑 Login iniciado para:', email);
        // CAMBIO CRÍTICO: Usar el endpoint legacy que apunta a la tabla 'candidatos' real
        const response = await api.post('/candidate-auth/login', { email, password });
        const { token, candidate } = response.data;

        console.log('✅ Login exitoso:', candidate);
        console.log('🔑 Token recibido:', token ? 'SÍ' : 'NO');

        localStorage.setItem('candidateToken', token);
        localStorage.setItem('candidateUser', JSON.stringify(candidate));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(candidate);

        console.log('👤 Usuario guardado en state:', candidate);
        console.log('💾 LocalStorage guardado');
    };

    const register = async (data: any) => {
        console.log('📝 Registro iniciado');
        // CAMBIO CRÍTICO: Usar el endpoint legacy que apunta a la tabla 'candidatos' real
        const response = await api.post('/candidate-auth/register', data);
        const { token, candidate } = response.data;

        console.log('✅ Registro exitoso:', candidate);
        localStorage.setItem('candidateToken', token);
        localStorage.setItem('candidateUser', JSON.stringify(candidate));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(candidate);
    };

    const logout = () => {
        localStorage.removeItem('candidateToken');
        localStorage.removeItem('candidateUser');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const updateProfile = async (data: any) => {
        await api.put('/candidate-auth/profile', data);
        const updatedUser = { ...user!, ...data };
        setUser(updatedUser);
        localStorage.setItem('candidateUser', JSON.stringify(updatedUser));
    };

    // Debug logging
    useEffect(() => {
        console.log('🔍 Estado de autenticación cambió:');
        console.log('   - user:', user);
        console.log('   - isAuthenticated:', !!user);
        console.log('   - localStorage token:', localStorage.getItem('candidateToken') ? 'EXISTS' : 'NO');
        console.log('   - localStorage user:', localStorage.getItem('candidateUser') ? 'EXISTS' : 'NO');
    }, [user]);

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile
    };

    return (
        <CandidateAuthContext.Provider value={value}>
            {children}
        </CandidateAuthContext.Provider>
    );
};

export const useCandidateAuth = () => {
    const context = useContext(CandidateAuthContext);
    if (context === undefined) {
        throw new Error('useCandidateAuth must be used within a CandidateAuthProvider');
    }
    return context;
};
