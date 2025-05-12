import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { 
  LayoutDashboard, 
  FileText, 
  Lightbulb, 
  BarChart, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for header appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Navigation items
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/workflows', label: 'Workflow Management', icon: <FileText size={20} /> },
    { path: '/insights', label: 'AI Insights', icon: <Lightbulb size={20} /> },
    { path: '/reports', label: 'Reports', icon: <BarChart size={20} /> }
  ];

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-hsbc-light to-white">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-10 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/80 shadow-lg backdrop-blur-md border-b border-gray-100' 
            : 'bg-gradient-to-r from-hsbc-gradient-start to-hsbc-gradient-end'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Logo size="sm" className={`transition-opacity duration-300 ${scrolled ? 'opacity-90' : 'opacity-100'}`} />
              <h1 className={`text-xl font-display font-bold transition-colors duration-300 ${
                scrolled ? 'text-hsbc-primary' : 'text-white'
              }`}>
                BankFlowAI
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item, index) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className={`group relative flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out ${
                    location.pathname === item.path
                      ? (scrolled 
                          ? 'text-hsbc-primary bg-hsbc-light' 
                          : 'text-white bg-white/10')
                      : (scrolled 
                          ? 'text-gray-600 hover:text-hsbc-primary hover:bg-hsbc-light/50' 
                          : 'text-white/80 hover:text-white hover:bg-white/10')
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {item.icon}
                  </span>
                  <span className="relative">
                    {item.label}
                    {location.pathname === item.path && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-hsbc-accent transform scale-x-100 transition-transform duration-300" />
                    )}
                  </span>
                </a>
              ))}
            </nav>

            {/* User menu and actions */}
            <div className="relative flex items-center space-x-2">
              {/* User menu */}
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`group flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  scrolled 
                    ? 'hover:bg-hsbc-light/50' 
                    : 'hover:bg-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-hsbc-accent to-hsbc-primary flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${
                  scrolled ? 'text-white' : 'text-white'
                }`}>
                  {user?.name.charAt(0)}
                </div>
                <span className={`hidden md:inline-block text-sm font-medium transition-colors duration-300 ${
                  scrolled ? 'text-gray-700' : 'text-white'
                }`}>
                  {user?.name}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''} ${
                    scrolled ? 'text-gray-600' : 'text-white/80'
                  }`} 
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl py-1 z-20 animate-scale-in origin-top-right border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.role}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-hsbc-light transition-colors duration-200 flex items-center space-x-2"
                    >
                      <LogOut size={16} className="text-hsbc-accent" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg transition-all duration-300 ${
                  scrolled 
                    ? 'text-gray-600 hover:text-hsbc-primary hover:bg-hsbc-light/50' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl z-30 animate-slide-in">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <div className="flex items-center space-x-3">
                <Logo size="sm" />
                <h2 className="text-lg font-display font-bold text-hsbc-primary">Menu</h2>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="px-2 pt-2 pb-4 space-y-1">
              {navItems.map((item, index) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-hsbc-light text-hsbc-primary'
                      : 'text-gray-700 hover:bg-hsbc-light/50 hover:text-hsbc-primary'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="transition-transform duration-200 hover:scale-110">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
            <div className="border-t px-4 py-4">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium text-gray-700 hover:bg-hsbc-light/50 hover:text-hsbc-primary rounded-lg transition-colors duration-200"
              >
                <LogOut size={20} className="text-hsbc-accent" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 pt-16 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-hsbc-gradient-start to-hsbc-gradient-end text-white py-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-sm font-medium">&copy; {new Date().getFullYear()} HSBC BankFlowAI - Internal Hackathon Project</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-white/60">Confidential and Proprietary</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;