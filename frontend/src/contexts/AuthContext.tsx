import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';
import type { User } from '@/models/User';
import { jwtDecode } from 'jwt-decode';

// The shape of the context data remains the same for consumers
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // State to track initial auth check

  useEffect(() => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
      }
    } catch (error) {
      console.error("Invalid token found, removing it.", error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false); // IMPORTANT: Set loading to false after check is complete
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decodedUser: User = jwtDecode(token);
    setUser(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  // Expose the new loading state in the provider's value
  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// The custom hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};