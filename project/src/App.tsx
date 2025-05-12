import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkflowManagement from './pages/WorkflowManagement';
import AiInsights from './pages/AiInsights';
import Reports from './pages/Reports';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Update page title based on route
  useEffect(() => {
    const route = location.pathname.split('/')[1];
    const pageTitle = route 
      ? `${route.charAt(0).toUpperCase() + route.slice(1)} | BankFlowAI` 
      : 'BankFlowAI - HSBC';
    
    document.title = pageTitle;
  }, [location]);

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" /> : <AuthLayout><Login /></AuthLayout>
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/workflows" element={
        <ProtectedRoute>
          <MainLayout>
            <WorkflowManagement />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/insights" element={
        <ProtectedRoute>
          <MainLayout>
            <AiInsights />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute>
          <MainLayout>
            <Reports />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;