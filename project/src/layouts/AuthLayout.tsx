import React from 'react';
import Logo from '../components/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-hsbc-primary via-hsbc-dark to-hsbc-primary">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-hsbc-accent opacity-5 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-hsbc-accent opacity-5 rounded-full animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <Logo size="lg" className="animate-glow" />
          </div>
          <h1 className="text-center text-4xl font-display font-bold text-white animate-fade-in">
            BankFlowAI
          </h1>
          <h2 className="mt-3 text-center text-xl text-white text-opacity-90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Banking Workflow Intelligence
          </h2>
          <p className="mt-2 text-center text-sm text-white text-opacity-70 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Powered by AI to streamline your banking operations
          </p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in" style={{ animationDelay: '0.6s' }}>
          {children}
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <p className="text-sm text-white text-opacity-60">
            &copy; {new Date().getFullYear()} HSBC Banking Group
          </p>
          <p className="text-xs text-white text-opacity-40 mt-1">
            Internal Use Only • Confidential and Proprietary
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;