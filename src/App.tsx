import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleLoginSuccess = (accessToken: string, loggedInUser: any) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setToken(accessToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <>
      <div className="bg-glow-container">
        <div className="bg-glow-orb-1"></div>
        <div className="bg-glow-orb-2"></div>
      </div>
      {token && user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <GoogleOAuthProvider clientId={googleClientId}>
          <Login onLoginSuccess={handleLoginSuccess} />
        </GoogleOAuthProvider>
      )}
    </>
  );
}

export default App;
