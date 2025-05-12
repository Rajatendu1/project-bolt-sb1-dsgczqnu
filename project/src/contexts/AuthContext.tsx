import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; name: string; role: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Validate user data structure
          if (parsedUser && 
              typeof parsedUser === 'object' && 
              'username' in parsedUser && 
              'name' in parsedUser && 
              'role' in parsedUser) {
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Invalid user data structure
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function with improved error handling
  const login = async (username: string, password: string): Promise<boolean> => {
    if (loading) return false;
    
    setLoading(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check credentials - hardcoded for hackathon
      if (username === 'hsbc_admin' && password === 'Hackathon2025!') {
        const userData = {
          username: 'hsbc_admin',
          name: 'HSBC Administrator',
          role: 'Admin'
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function with cleanup
  const logout = () => {
    setLoading(true);
    try {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      // Clear any other auth-related data
      localStorage.removeItem('bankflowai_tasks');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent context updates during loading
  if (loading) {
    return (
      <AuthContext.Provider value={{ isAuthenticated: false, user: null, login, logout, loading: true }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hsbc-primary"></div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};