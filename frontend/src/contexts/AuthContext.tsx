import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';
import type { User } from '@/models/User';
import { jwtDecode } from 'jwt-decode';

// The shape of the context data remains the same for consumers
interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  // On initial load, check for a token in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        console.log("Decoded user from token:", decodedUser); // Debugging line
        setUser(decodedUser);
      } catch (error) {
        console.error("Invalid token found in localStorage", error);
        // If token is invalid, clear it
        localStorage.removeItem('token'); 
      }
    }
  }, []);

  // Login function now accepts a token
  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decodedUser: User = jwtDecode(token);
    setUser(decodedUser);
  };

  // Logout function clears the token and user state
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  const value = { user, login, logout };

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