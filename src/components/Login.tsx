import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (token: string, user: { name: string; email: string; picture?: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const token = credentialResponse.credential;
    if (!token) return;

    try {
      // Send token to backend to verify and get a session token
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const data = await response.json();
      onLoginSuccess(data.accessToken, data.user);
    } catch (error) {
      console.error('Login error:', error);
      alert('Error logging in with Google. Is the backend running?');
    }
  };

  const handleMockLogin = () => {
    // A helpful helper for testing without setup
    onLoginSuccess('mock-token-12345', {
      name: 'Demo User',
      email: 'demo@expensetracker.com',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-icon">
          {/* Wallet / Piggy bank SVG */}
          <svg viewBox="0 0 24 24">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        </div>
        
        <h1 className="brand-name">ExpenseTracker</h1>
        <p className="brand-tagline">
          Take control of your personal finances simply and elegantly.
        </p>

        {hasClientId ? (
          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap
              theme="filled_black"
              shape="pill"
            />
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              ⚠️ Google Client ID not configured in <code>.env</code>
            </p>
          </div>
        )}

        <div className="login-divider">
          <span>Or try the application</span>
        </div>

        <button className="mock-login-btn" onClick={handleMockLogin}>
          {/* Demo User Silhouette SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Sign in as Guest
        </button>

        <p className="card-footer">
          By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};
